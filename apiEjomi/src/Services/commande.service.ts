import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

const toCommandeStatut = (statut: string): string => {
  const map: Record<string, string> = {
    'en attente': 'EN_ATTENTE',
    'confirmée': 'CONFIRMEE',
    'en préparation': 'EN_PREPARATION',
    'prête': 'PRETE',
    'livrée': 'LIVREE',
    'payée': 'LIVREE',
    'annulée': 'ANNULEE',
  };
  return map[statut?.toLowerCase()] || statut?.toUpperCase().replace(' ', '_') || 'EN_ATTENTE';
};

interface LigneCommandeInput {
  produitId?: number;
  platId?: number;
  quantite: number;
  prixUnitaire: number;
  reduction: number;
}

interface CommandeCreateInput {
  clientId: number;
  vendeurId?: number;
  entrepriseId?: number;
  dateCommande: Date;
  reduction: number;
  statut: string;
  lignes: LigneCommandeInput[];
  montantPaye?: number;
  modePaiement?: string;
}

const createCommande = async (data: CommandeCreateInput) => {
  return prisma.$transaction(async (tx) => {
    // 1. Vérifier le stock uniquement pour les produits. Les plats n'ont pas de stock.
    for (const ligne of data.lignes) {
      if (!ligne.produitId && !ligne.platId) {
        throw new Error('Chaque ligne doit contenir un produit ou un plat.');
      }
      if (ligne.produitId && ligne.platId) {
        throw new Error('Une ligne ne peut pas contenir un produit et un plat.');
      }
      if (ligne.platId) {
        const plat = await tx.plat.findFirst({ where: { id: ligne.platId, entrepriseId: data.entrepriseId } });
        if (!plat) throw new Error(`Plat introuvable pour l'entreprise.`);
        continue;
      }
      const stockBoutique = await tx.stockBoutique.findUnique({
        where: { produitId: ligne.produitId },
        include: { produit: { select: { libelle: true } } },
      });

      if (!stockBoutique) {
        throw new Error(`Aucun stock boutique trouvé pour le produit ID ${ligne.produitId}.`);
      }

      if (stockBoutique.quantite < ligne.quantite) {
        throw new Error(
          `Stock boutique insuffisant pour "${stockBoutique.produit.libelle}". Disponible: ${stockBoutique.quantite}, Demandé: ${ligne.quantite}`
        );
      }
    }

    // 2. Calculer le montant total
    const montantTotalLignes = data.lignes.reduce((sum, ligne) => {
      return sum + Math.max(0, ligne.prixUnitaire * ligne.quantite - ligne.reduction);
    }, 0);
    const montantFinal = Math.max(0, montantTotalLignes - data.reduction);

    // 3. Créer la commande (lieu BOUTIQUE par défaut)
    const commande = await tx.commande.create({
      data: {
        clientId: data.clientId,
        vendeurId: data.vendeurId,
        entrepriseId: data.entrepriseId,
        dateCommande: data.dateCommande,
        montant: montantFinal,
        statut: 'EN_ATTENTE' as any,
        reduction: data.reduction,
        lieu: 'BOUTIQUE',
      },
    });

    // 4. Créer les lignes avec lien vers StockBoutique, décrémenter le stock et calculer le coût FIFO
    for (const ligne of data.lignes) {
      if (ligne.platId) {
        await tx.ligneCommande.create({
          data: {
            commandeId: commande.id,
            platId: ligne.platId,
            quantiteCommande: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            montant: Math.max(0, ligne.prixUnitaire * ligne.quantite - ligne.reduction),
            coutRevient: 0,
          },
        });
        continue;
      }
      const stockBoutique = await tx.stockBoutique.findUnique({
        where: { produitId: ligne.produitId },
      });

      // FIFO : consommer les lots par ordre de date d'approvisionnement
      const lots = await tx.lotStock.findMany({
        where: { produitId: ligne.produitId, quantiteRestante: { gt: 0 } },
        orderBy: { dateAppro: 'asc' },
      });

      let quantiteAConsommer = ligne.quantite;
      let coutTotal = 0;

      for (const lot of lots) {
        if (quantiteAConsommer <= 0) break;
        const qte = Math.min(lot.quantiteRestante, quantiteAConsommer);
        coutTotal += qte * lot.prixAchat;
        quantiteAConsommer -= qte;
        await tx.lotStock.update({
          where: { id: lot.id },
          data: { quantiteRestante: { decrement: qte } },
        });
      }

      // Si pas assez de lots (stock boutique vient d'un transfert sans lot), fallback sur prixAchatUnitaire
      if (quantiteAConsommer > 0) {
        const produit = await tx.produit.findUnique({
          where: { id: ligne.produitId },
          select: { prixAchatUnitaire: true },
        });
        coutTotal += quantiteAConsommer * (produit?.prixAchatUnitaire ?? 0);
      }

      const coutRevient = ligne.quantite > 0 ? coutTotal / ligne.quantite : 0;

      await tx.ligneCommande.create({
        data: {
          commandeId: commande.id,
          produitId: ligne.produitId,
          stockBoutiqueId: stockBoutique!.id,
          quantiteCommande: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          montant: Math.max(0, ligne.prixUnitaire * ligne.quantite - ligne.reduction),
          coutRevient,
        },
      });

      await tx.stockBoutique.update({
        where: { id: stockBoutique!.id },
        data: { quantite: { decrement: ligne.quantite } },
      });
    }

    // 5. Créer le paiement initial si fourni
    const montantPaye = Number(data.montantPaye || 0);
    const modePaiement = data.modePaiement || 'ESPECES';
    if (montantPaye > 0) {
      await tx.paiement.create({
        data: {
          commandeId: commande.id,
          montant: montantPaye,
          modePaiement: modePaiement as any,
          statut: 'REUSSI',
        },
      });
    }

    return tx.commande.findUnique({
      where: { id: commande.id },
      include: {
        lignes: { include: { produit: true, plat: true, stockBoutique: true } },
        client: true,
        paiements: true,
      },
    });
  });
};

const getAllCommandes = async (page: number = 1, limit: number = 10, entrepriseId?: number) => {
  const skip = (page - 1) * limit;
  const where: any = entrepriseId ? { entrepriseId } : {};
  const [data, total] = await prisma.$transaction([
    prisma.commande.findMany({
      skip,
      take: limit,
      where,
      include: {
        client: { select: { id: true, nom: true, prenom: true } },
        lignes: { select: { quantiteCommande: true } },
        paiements: true,
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.commande.count({ where }),
  ]);

  return {
    data,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

const getCommandeById = async (id: number) => {
  return prisma.commande.findUnique({
    where: { id },
    include: {
      client: true,
      vendeur: { include: { user: true } },
      lignes: { include: { produit: true, stockBoutique: true } },
      paiements: true,
      livraisons: true,
    },
  });
};

const updateCommande = async (id: number, data: CommandeCreateInput) => {
  return prisma.$transaction(async (tx) => {
    // 1. Récupérer l'ancienne commande
    const ancienneCommande = await tx.commande.findUnique({
      where: { id },
      include: { lignes: true },
    });

    if (!ancienneCommande) {
      throw new Error('Commande introuvable pour la mise à jour.');
    }

    // 2. Restaurer le stock boutique des anciennes lignes
    for (const ligne of ancienneCommande.lignes) {
      if (ligne.stockBoutiqueId) {
        await tx.stockBoutique.update({
          where: { id: ligne.stockBoutiqueId },
          data: { quantite: { increment: ligne.quantiteCommande } },
        });
      }
    }

    // 3. Vérifier le stock boutique pour les nouvelles lignes
    for (const ligne of data.lignes) {
      if (ligne.platId) {
        const plat = await tx.plat.findFirst({ where: { id: ligne.platId, entrepriseId: data.entrepriseId } });
        if (!plat) throw new Error('Plat introuvable pour l\'entreprise.');
        continue;
      }
      const stockBoutique = await tx.stockBoutique.findUnique({
        where: { produitId: ligne.produitId },
        include: { produit: { select: { libelle: true } } },
      });

      if (!stockBoutique) {
        throw new Error(`Aucun stock boutique trouvé pour le produit ID ${ligne.produitId}.`);
      }

      if (stockBoutique.quantite < ligne.quantite) {
        throw new Error(
          `Stock boutique insuffisant pour "${stockBoutique.produit.libelle}". Disponible: ${stockBoutique.quantite}, Demandé: ${ligne.quantite}`
        );
      }
    }

    // 4. Supprimer les anciennes lignes
    await tx.ligneCommande.deleteMany({ where: { commandeId: id } });

    // 5. Calculer le nouveau montant
    const montantTotalLignes = data.lignes.reduce((sum, ligne) => {
      return sum + Math.max(0, ligne.prixUnitaire * ligne.quantite - ligne.reduction);
    }, 0);
    const montantFinal = Math.max(0, montantTotalLignes - data.reduction);

    // 6. Mettre à jour la commande
    await tx.commande.update({
      where: { id },
      data: {
        clientId: data.clientId,
        dateCommande: data.dateCommande,
        montant: montantFinal,
        statut: toCommandeStatut(data.statut) as any,
        reduction: data.reduction,
      },
    });

    // 7. Créer les nouvelles lignes et décrémenter le stock boutique
    for (const ligne of data.lignes) {
      if (ligne.platId) {
        const plat = await tx.plat.findFirst({ where: { id: ligne.platId, entrepriseId: data.entrepriseId } });
        if (!plat) throw new Error('Plat introuvable pour l\'entreprise.');
        await tx.ligneCommande.create({
          data: {
            commandeId: id,
            platId: ligne.platId,
            quantiteCommande: ligne.quantite,
            prixUnitaire: ligne.prixUnitaire,
            montant: Math.max(0, ligne.prixUnitaire * ligne.quantite - ligne.reduction),
            coutRevient: 0,
          },
        });
        continue;
      }
      const stockBoutique = await tx.stockBoutique.findUnique({
        where: { produitId: ligne.produitId },
      });

      await tx.ligneCommande.create({
        data: {
          commandeId: id,
          produitId: ligne.produitId,
          stockBoutiqueId: stockBoutique!.id,
          quantiteCommande: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          montant: Math.max(0, ligne.prixUnitaire * ligne.quantite - ligne.reduction),
        },
      });

      await tx.stockBoutique.update({
        where: { id: stockBoutique!.id },
        data: { quantite: { decrement: ligne.quantite } },
      });
    }

    return tx.commande.findUnique({
      where: { id },
      include: {
        lignes: { include: { produit: true, plat: true, stockBoutique: true } },
        client: true,
        vendeur: { include: { user: true } },
        paiements: true,
      },
    });
  });
};

const deleteCommande = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    const commande = await tx.commande.findUnique({
      where: { id },
      include: { lignes: true },
    });

    if (!commande) return null;

    // Restaurer le stock boutique
    for (const ligne of commande.lignes) {
      if (ligne.stockBoutiqueId) {
        await tx.stockBoutique.update({
          where: { id: ligne.stockBoutiqueId },
          data: { quantite: { increment: ligne.quantiteCommande } },
        });
      }
    }

    await tx.paiement.deleteMany({ where: { commandeId: id } });
    await tx.livraison.deleteMany({ where: { commandeId: id } });
    await tx.ligneCommande.deleteMany({ where: { commandeId: id } });

    return tx.commande.delete({ where: { id } });
  });
};

const getCommandesByVendeur = async (vendeurId: number) => {
  return prisma.commande.findMany({
    where: { vendeurId },
    include: {
      client: true,
      vendeur: { include: { user: true } },
      lignes: { include: { produit: true, plat: true } },
      paiements: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
};

const getCommandesByClient = async (clientId: number) => {
  return prisma.commande.findMany({
    where: { clientId },
    include: {
      client: true,
      vendeur: { include: { user: true } },
      lignes: { include: { produit: true, plat: true } },
      paiements: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
};

const getCommandeStatistics = async (entrepriseId?: number) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const w = entrepriseId ? { entrepriseId } : {};

  // Résoudre d'abord les commandeIds pour éviter les colonnes ambiguës dans le groupBy de ligneCommande
  let commandeIds: number[] | undefined;
  if (entrepriseId) {
    const cmds = await prisma.commande.findMany({ where: { entrepriseId }, select: { id: true } });
    commandeIds = cmds.map(c => c.id);
  }

  const [
    totalRevenu,
    commandesParStatut,
    topProduits,
    commandesSemaine,
    commandesMois,
    commandesAnnee,
    commandesCeMois,
    commandesMoisPrecedent,
    commandesEnAttente,
    commandesLivrees,
  ] = await prisma.$transaction([
    prisma.commande.aggregate({ where: w, _sum: { montant: true } }),
    prisma.commande.groupBy({ by: ['statut'], where: w, _count: { statut: true }, orderBy: { _count: { statut: 'desc' } } }),
    prisma.ligneCommande.groupBy({
      by: ['produitId'],
      where: commandeIds ? { commandeId: { in: commandeIds } } : {},
      _sum: { quantiteCommande: true, montant: true },
      orderBy: { _sum: { quantiteCommande: 'desc' } },
      take: 5,
    }),
    entrepriseId
      ? prisma.$queryRaw`SELECT DATE("dateCommande") as date, COUNT(*)::int as count, SUM(montant)::float as total FROM "Commande" WHERE "dateCommande" >= ${startOfWeek} AND "entrepriseId" = ${entrepriseId} GROUP BY DATE("dateCommande") ORDER BY date ASC`
      : prisma.$queryRaw`SELECT DATE("dateCommande") as date, COUNT(*)::int as count, SUM(montant)::float as total FROM "Commande" WHERE "dateCommande" >= ${startOfWeek} GROUP BY DATE("dateCommande") ORDER BY date ASC`,
    entrepriseId
      ? prisma.$queryRaw`SELECT DATE("dateCommande") as date, COUNT(*)::int as count, SUM(montant)::float as total FROM "Commande" WHERE "dateCommande" >= ${startOfMonth} AND "entrepriseId" = ${entrepriseId} GROUP BY DATE("dateCommande") ORDER BY date ASC`
      : prisma.$queryRaw`SELECT DATE("dateCommande") as date, COUNT(*)::int as count, SUM(montant)::float as total FROM "Commande" WHERE "dateCommande" >= ${startOfMonth} GROUP BY DATE("dateCommande") ORDER BY date ASC`,
    entrepriseId
      ? prisma.$queryRaw`SELECT EXTRACT(MONTH FROM "dateCommande")::int as month, COUNT(*)::int as count, SUM(montant)::float as total FROM "Commande" WHERE "dateCommande" >= ${startOfYear} AND "entrepriseId" = ${entrepriseId} GROUP BY EXTRACT(MONTH FROM "dateCommande") ORDER BY month ASC`
      : prisma.$queryRaw`SELECT EXTRACT(MONTH FROM "dateCommande")::int as month, COUNT(*)::int as count, SUM(montant)::float as total FROM "Commande" WHERE "dateCommande" >= ${startOfYear} GROUP BY EXTRACT(MONTH FROM "dateCommande") ORDER BY month ASC`,
    prisma.commande.count({ where: { ...w, dateCommande: { gte: startOfMonth } } }),
    prisma.commande.count({ where: { ...w, dateCommande: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.commande.count({ where: { ...w, statut: 'EN_ATTENTE' } }),
    prisma.commande.count({ where: { ...w, statut: 'LIVREE' } }),
  ]);

  const produitsIds = topProduits.map((p) => p.produitId).filter((id): id is number => id !== null);
  const produits = produitsIds.length > 0 ? await prisma.produit.findMany({
    where: { id: { in: produitsIds }, ...(entrepriseId ? { entrepriseId } : {}) },
    select: { id: true, libelle: true, image: true, prixDeVenteUnitaire: true },
  }) : [];

  const topProduitsWithDetails = topProduits
    .filter((tp) => tp.produitId !== null)
    .map((tp) => ({
      produitId: tp.produitId,
      produit: produits.find((p) => p.id === tp.produitId) || null,
      quantiteCommandee: tp._sum?.quantiteCommande || 0,
      montantTotal: tp._sum?.montant || 0,
    }));

  const percentChange =
    commandesMoisPrecedent > 0
      ? ((commandesCeMois - commandesMoisPrecedent) / commandesMoisPrecedent) * 100
      : 0;

  return {
    totalCommandes: commandesCeMois,
    totalRevenu: totalRevenu._sum.montant || 0,
    commandesParStatut: commandesParStatut.map((item) => ({
      statut: item.statut,
      count: (item._count as any)?.statut || 0,
    })),
    topProduits: topProduitsWithDetails,
    chartsData: { week: commandesSemaine, month: commandesMois, year: commandesAnnee },
    commandesEnAttente,
    commandesLivrees,
    percentChange: Math.round(percentChange * 10) / 10,
  };
};

const generateRecuPdf = async (commandeId: number): Promise<Buffer | null> => {
  const commande = await getCommandeById(commandeId);
  if (!commande) return null;

  const nbLignes = commande.lignes.length;
  const hauteurFixe = 280; // en-tête + client + vendeur + totaux + pied
  const hauteurParLigne = 28;
  const hauteurTotale = hauteurFixe + nbLignes * hauteurParLigne;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [226.77, hauteurTotale],
        margins: { top: 10, bottom: 10, left: 10, right: 10 },
        autoFirstPage: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(14).font('Helvetica-Bold').text('REÇU DE COMMANDE', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(8).font('Helvetica').text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.5);

      doc.fontSize(9).font('Helvetica-Bold').text(`N° ${commande.id}`, { align: 'center' });
      doc.fontSize(8).font('Helvetica').text(new Date(commande.dateCommande).toLocaleString('fr-FR'), { align: 'center' });
      doc.moveDown(0.5);

      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica-Bold').text('CLIENT');
      doc.font('Helvetica').text(`${commande.client.prenom} ${commande.client.nom}`);
      if (commande.client.tel) doc.text(`Tél: ${commande.client.tel}`);
      doc.moveDown(0.5);

      if (commande.vendeur?.user) {
        doc.font('Helvetica-Bold').text('VENDEUR');
        doc.font('Helvetica').text(`${commande.vendeur.user.prenom} ${commande.vendeur.user.nom}`);
        doc.moveDown(0.5);
      }

      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(9).text('ARTICLES');
      doc.moveDown(0.5);

      commande.lignes.forEach((ligne: any) => {
        const libelle = ligne.produit?.libelle || 'Produit inconnu';
        const qte = ligne.quantiteCommande;
        const montantLigne = Number(ligne.montant);
        const prixUnitaire = ligne.prixUnitaire || (qte > 0 ? montantLigne / qte : 0);

        doc.font('Helvetica').fontSize(8).text(libelle);

        const leftPart = `${qte} x ${Number(prixUnitaire).toFixed(0)}`;
        const rightPart = `${montantLigne.toFixed(0)} F`;
        const pageWidth = 226.77 - 20;
        const dotsWidth = pageWidth - doc.widthOfString(leftPart) - doc.widthOfString(rightPart) - 10;
        const dots = '.'.repeat(Math.max(0, Math.floor(dotsWidth / doc.widthOfString('.'))));

        doc.text(`${leftPart}${dots}${rightPart}`);
        doc.moveDown(0.3);
      });

      doc.moveDown(0.3);
      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);

      const montantTotal = Number(commande.montant);
      const reduction = Number(commande.reduction || 0);

      if (reduction > 0) {
        doc.fontSize(8).font('Helvetica').text(`Sous-total: ${(montantTotal + reduction).toFixed(0)} FCFA`, { align: 'right' });
        doc.text(`Réduction: -${reduction.toFixed(0)} FCFA`, { align: 'right' });
      }

      doc.fontSize(10).font('Helvetica-Bold').text(`TOTAL: ${montantTotal.toFixed(0)} FCFA`, { align: 'right' });
      doc.moveDown(0.5);

      doc.fontSize(8).font('Helvetica').text(`Statut: ${commande.statut}`, { align: 'center' });
      doc.moveDown(0.5);

      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica-Bold').text('Merci pour votre confiance!', { align: 'center' });
      doc.fontSize(7).font('Helvetica').text('GoldTech - Votre partenaire', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateFacturePdf = async (commandeId: number): Promise<Buffer | null> => {
  const commande = await getCommandeById(commandeId);
  if (!commande) return null;

  const paiements = (commande as any).paiements || [];
  const totalPaye = paiements.reduce((s: number, p: any) => s + Number(p.montant || 0), 0);
  const montantTotal = Number(commande.montant);
  const reduction = Number(commande.reduction || 0);
  const creance = Math.max(0, montantTotal - totalPaye);

  const nbLignesFacture = commande.lignes.length;
  const nbPaiements = paiements.length;
  const hauteurFixeFacture = 320; // en-tête + client + vendeur + totaux + pied
  const hauteurParLigneFacture = 28;
  const hauteurParPaiement = 14;
  const hauteurTotaleFacture = hauteurFixeFacture + nbLignesFacture * hauteurParLigneFacture + nbPaiements * hauteurParPaiement;

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: [226.77, hauteurTotaleFacture],
        margins: { top: 10, bottom: 10, left: 10, right: 10 },
        autoFirstPage: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = 226.77 - 20; // largeur utile

      // En-tête
      doc.fontSize(14).font('Helvetica-Bold').text('FACTURE', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica').text('GoldTech - Bijouterie & Technologie', { align: 'center' });
      doc.text('123 Avenue du Commerce, Dakar', { align: 'center' });
      doc.text('Tel: +221 33 123 45 67', { align: 'center' });
      doc.moveDown(0.4);
      doc.fontSize(8).text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica-Bold').text(`FAC-${String(commandeId).padStart(5, '0')}`, { align: 'center' });
      doc.fontSize(8).font('Helvetica').text(new Date(commande.dateCommande).toLocaleString('fr-FR'), { align: 'center' });
      doc.moveDown(0.4);

      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);

      // Client
      doc.fontSize(8).font('Helvetica-Bold').text('CLIENT');
      doc.font('Helvetica').text(`${commande.client.prenom || ''} ${commande.client.nom}`.trim());
      if (commande.client.tel) doc.text(`Tél: ${commande.client.tel}`);
      if ((commande.client as any).adresse) doc.text((commande.client as any).adresse);
      doc.moveDown(0.4);

      // Vendeur
      if (commande.vendeur?.user) {
        doc.font('Helvetica-Bold').text('VENDEUR');
        doc.font('Helvetica').text(`${commande.vendeur.user.prenom} ${commande.vendeur.user.nom}`);
        doc.moveDown(0.4);
      }

      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(9).text('ARTICLES');
      doc.moveDown(0.4);

      // Lignes articles
      commande.lignes.forEach((ligne: any) => {
        const libelle = ligne.produit?.libelle || 'Produit inconnu';
        const qte = ligne.quantiteCommande;
        const montantLigne = Number(ligne.montant);
        const prixUnitaire = ligne.prixUnitaire || (qte > 0 ? montantLigne / qte : 0);

        doc.font('Helvetica').fontSize(8).text(libelle);

        const leftPart = `${qte} x ${Number(prixUnitaire).toFixed(0)}`;
        const rightPart = `${montantLigne.toFixed(0)} F`;
        const dotsWidth = W - doc.widthOfString(leftPart) - doc.widthOfString(rightPart) - 10;
        const dots = '.'.repeat(Math.max(0, Math.floor(dotsWidth / doc.widthOfString('.'))));
        doc.text(`${leftPart}${dots}${rightPart}`);
        doc.moveDown(0.3);
      });

      doc.moveDown(0.3);
      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);

      // Totaux
      if (reduction > 0) {
        const sousTotal = montantTotal + reduction;
        doc.fontSize(8).font('Helvetica').text(`Sous-total: ${sousTotal.toFixed(0)} FCFA`, { align: 'right' });
        doc.text(`Réduction: -${reduction.toFixed(0)} FCFA`, { align: 'right' });
      }
      doc.fontSize(10).font('Helvetica-Bold').text(`TOTAL: ${montantTotal.toFixed(0)} FCFA`, { align: 'right' });
      doc.moveDown(0.4);

      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);

      // Paiements
      doc.fontSize(8).font('Helvetica-Bold').text('PAIEMENTS');
      doc.font('Helvetica').fontSize(8).text(`Payé: ${totalPaye.toFixed(0)} FCFA`, { align: 'right' });
      doc.text(`Reste: ${creance.toFixed(0)} FCFA`, { align: 'right' });

      if (paiements.length > 0) {
        doc.moveDown(0.3);
        paiements.forEach((p: any) => {
          const date = new Date(p.createdAt || p.datePaiement || '').toLocaleDateString('fr-FR');
          doc.fontSize(7).font('Helvetica').text(`${date} | ${p.modePaiement} | ${Number(p.montant).toFixed(0)} F`);
        });
      }

      doc.moveDown(0.4);
      doc.fontSize(8).text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(9).font('Helvetica-Bold').text('Merci pour votre confiance!', { align: 'center' });
      doc.fontSize(7).font('Helvetica').text('GoldTech - Votre partenaire', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  createCommande,
  getAllCommandes,
  getCommandeById,
  updateCommande,
  deleteCommande,
  getCommandeStatistics,
  getCommandesByClient,
  getCommandesByVendeur,
  generateRecuPdf,
  generateFacturePdf,
};
