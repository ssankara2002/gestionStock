import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

interface LigneAvoirInput {
  produitId?: number;
  platId?: number;
  quantite: number;
  prixUnitaire: number;
}

interface AvoirCreateInput {
  commandeId: number;
  clientId: number;
  vendeurId?: number;
  entrepriseId?: number;
  motif?: string;
  type: 'REMBOURSEMENT' | 'CREDIT' | 'GARDE' | 'MONNAIE' | 'PRODUITS';
  lignes: LigneAvoirInput[];
  porteurNom?: string;
  porteurTel?: string;
}

// Le client « Anonyme » représente tous les clients de passage : on ne doit jamais
// alimenter son solde de crédit, sinon n'importe qui pourrait consommer l'avoir d'un autre.
export const estClientAnonyme = (client?: { nom?: string | null } | null) => client?.nom === 'Anonyme';

// « AV-00012 », « av12 » ou « 12 » → 12
export const parseNumeroAvoir = (numero: string): number | null => {
  const chiffres = String(numero || '').replace(/\D/g, '');
  const id = parseInt(chiffres, 10);
  return Number.isFinite(id) && id > 0 ? id : null;
};

// Bon d'avoir utilisable à la caisse : avoir MONNAIE validé avec un solde restant
const getBonAvoir = async (numero: string, entrepriseId?: number) => {
  const id = parseNumeroAvoir(numero);
  if (!id) throw new Error("Numéro de bon d'avoir invalide.");
  const avoir = await prisma.avoir.findUnique({
    where: { id },
    include: { client: { select: { id: true, nom: true, prenom: true, tel: true } } },
  });
  if (!avoir || (entrepriseId && avoir.entrepriseId !== entrepriseId)) throw new Error(`Bon AV-${String(id).padStart(5, '0')} introuvable.`);
  if (avoir.type !== 'MONNAIE') throw new Error("Ce bon n'est pas un avoir de monnaie.");
  if (avoir.statut !== 'VALIDE') throw new Error('Ce bon a déjà été utilisé ou remboursé.');
  const solde = Number(avoir.montant) - Number(avoir.montantUtilise || 0);
  if (solde <= 0) throw new Error('Ce bon a déjà été entièrement utilisé.');
  return { ...avoir, solde };
};

const createAvoir = async (data: AvoirCreateInput) => {
  return prisma.$transaction(async (tx) => {
    // Vérifier que la commande existe
    const commande = await tx.commande.findUnique({
      where: { id: data.commandeId },
      include: { lignes: true },
    });
    if (!commande) throw new Error('Commande introuvable.');

    // Calculer le montant total de l'avoir
    const montantTotal = data.lignes.reduce((sum, l) => sum + l.prixUnitaire * l.quantite, 0);

    // Créer l'avoir
    const avoir = await tx.avoir.create({
      data: {
        commandeId: data.commandeId,
        clientId: data.clientId,
        vendeurId: data.vendeurId,
        entrepriseId: data.entrepriseId,
        motif: data.motif,
        porteurNom: data.porteurNom?.trim() || null,
        porteurTel: data.porteurTel?.trim() || null,
        type: data.type as any,
        statut: 'EN_ATTENTE' as any,
        montant: montantTotal,
      },
    });

    // Créer les lignes
    // Pour GARDE : le stock ne remonte PAS (les produits sont réservés physiquement pour le client)
    // Pour CREDIT/REMBOURSEMENT : le stock remonte
    for (const ligne of data.lignes) {
      // MONNAIE : ligne fictive sans produit/plat — juste le montant
      if (!ligne.produitId && !ligne.platId && data.type !== 'MONNAIE') throw new Error('Chaque ligne doit avoir un produit ou un plat.');

      await tx.ligneAvoir.create({
        data: {
          avoirId: avoir.id,
          produitId: ligne.produitId,
          platId: ligne.platId,
          quantite: ligne.quantite,
          prixUnitaire: ligne.prixUnitaire,
          montant: ligne.prixUnitaire * ligne.quantite,
        },
      });

      if (data.type === 'GARDE' || data.type === 'PRODUITS' || data.type === 'MONNAIE') continue; // stock ne bouge pas

      // Restitution stock plat
      if (ligne.platId) {
        await tx.plat.update({
          where: { id: ligne.platId },
          data: { stockPlat: { increment: ligne.quantite } },
        });
        continue;
      }

      // Restitution stock boutique + lotStock FIFO inversé
      const stockBoutique = await tx.stockBoutique.findUnique({ where: { produitId: ligne.produitId } });
      if (stockBoutique) {
        await tx.stockBoutique.update({
          where: { id: stockBoutique.id },
          data: { quantite: { increment: ligne.quantite } },
        });
      }
      const lots = await tx.lotStock.findMany({
        where: { produitId: ligne.produitId },
        orderBy: { dateAppro: 'desc' },
        take: 1,
      });
      if (lots.length > 0) {
        await tx.lotStock.update({
          where: { id: lots[0].id },
          data: { quantiteRestante: { increment: ligne.quantite } },
        });
      }
    }

    // CREDIT : créditer le compte client immédiatement
    // REMBOURSEMENT/GARDE/PRODUITS/MONNAIE : rien ne bouge à la création — décision prise au retour du client
    if (data.type === 'CREDIT') {
      await tx.user.update({
        where: { id: data.clientId },
        data: { creditClient: { increment: montantTotal } },
      });
    }

    // Valider l'avoir
    await tx.avoir.update({ where: { id: avoir.id }, data: { statut: 'VALIDE' as any } });

    return tx.avoir.findUnique({
      where: { id: avoir.id },
      include: {
        lignes: { include: { produit: true, plat: true } },
        client: true,
        vendeur: { include: { user: true } },
        commande: { select: { id: true, dateCommande: true, montant: true } },
      },
    });
  });
};

const getAllAvoirs = async (entrepriseId?: number) => {
  const where: any = entrepriseId ? { entrepriseId } : {};
  return prisma.avoir.findMany({
    where,
    include: {
      client: { select: { id: true, nom: true, prenom: true, tel: true } },
      vendeur: { include: { user: { select: { nom: true, prenom: true } } } },
      commande: { select: { id: true, dateCommande: true, montant: true } },
      lignes: { include: { produit: true, plat: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getAvoirById = async (id: number) => {
  return prisma.avoir.findUnique({
    where: { id },
    include: {
      client: true,
      vendeur: { include: { user: true } },
      commande: { select: { id: true, dateCommande: true, montant: true } },
      lignes: { include: { produit: true, plat: true } },
    },
  });
};

const getAvoirsByCommande = async (commandeId: number) => {
  return prisma.avoir.findMany({
    where: { commandeId },
    include: {
      client: { select: { id: true, nom: true, prenom: true, tel: true } },
      lignes: { include: { produit: true, plat: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const consommerMonnaie = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    const avoir = await tx.avoir.findUnique({ where: { id }, include: { client: { select: { nom: true } } } });
    if (!avoir) throw new Error('Avoir introuvable.');
    if (!['MONNAIE', 'CREDIT'].includes(avoir.type as string)) throw new Error('Seuls les avoirs de type MONNAIE peuvent être consommés.');
    if (!['VALIDE'].includes(avoir.statut as string)) throw new Error('Seuls les avoirs validés peuvent être consommés.');
    if (estClientAnonyme(avoir.client)) {
      throw new Error(`Client de passage : saisissez le bon AV-${String(avoir.id).padStart(5, '0')} au moment d'encaisser sa commande.`);
    }

    // Créditer le compte client du solde restant — il consommera à la prochaine commande
    const solde = Number(avoir.montant) - Number(avoir.montantUtilise || 0);
    await tx.user.update({
      where: { id: avoir.clientId },
      data: { creditClient: { increment: solde } },
    });

    return tx.avoir.update({
      where: { id },
      data: { statut: 'CONSOMME' as any, dateRemboursement: new Date() },
    });
  });
};

const recupererGarde = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    const avoir = await tx.avoir.findUnique({ where: { id }, include: { lignes: true } });
    if (!avoir) throw new Error('Avoir introuvable.');
    if (!['GARDE', 'PRODUITS'].includes(avoir.type as string)) throw new Error('Cet avoir n\'est pas de type Produits gardés.');
    if ((avoir.statut as string) === 'REMBOURSE') throw new Error('Ces produits ont déjà été récupérés.');
    if (avoir.statut !== 'VALIDE') throw new Error('Seuls les avoirs validés peuvent être récupérés.');

    // Marquer la date de récupération — statut REMBOURSE réutilisé comme "récupéré"
    return tx.avoir.update({
      where: { id },
      data: { statut: 'REMBOURSE' as any, dateRemboursement: new Date() },
    });
  });
};

const rembourserCredit = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    const avoir = await tx.avoir.findUnique({ where: { id } });
    if (!avoir) throw new Error('Avoir introuvable.');
    if (['REMBOURSE', 'CONSOMME'].includes(avoir.statut as string)) throw new Error('Cet avoir a déjà été traité.');
    if (avoir.statut !== 'VALIDE') throw new Error('Seuls les avoirs validés peuvent être remboursés.');

    // Si CREDIT : retirer le crédit du compte client (il prend l'argent en espèces au lieu de consommer)
    if (['CREDIT'].includes(avoir.type as string)) {
      await tx.user.update({
        where: { id: avoir.clientId },
        data: { creditClient: { decrement: avoir.montant } },
      });
    }

    // Sortie de caisse dans les deux cas — seulement la part du bon pas encore utilisée
    const solde = Number(avoir.montant) - Number(avoir.montantUtilise || 0);
    await tx.paiement.create({
      data: {
        commandeId: avoir.commandeId,
        montant: -solde,
        modePaiement: 'ESPECES' as any,
        statut: 'REUSSI' as any,
      },
    });

    return tx.avoir.update({
      where: { id },
      data: { statut: 'REMBOURSE' as any, dateRemboursement: new Date() },
    });
  });
};

const deleteAvoir = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    const avoir = await tx.avoir.findUnique({
      where: { id },
      include: { lignes: true },
    });
    if (!avoir) throw new Error('Avoir introuvable.');
    if (avoir.statut === 'VALIDE') throw new Error('Un avoir validé ne peut pas être supprimé.');

    await tx.ligneAvoir.deleteMany({ where: { avoirId: id } });
    return tx.avoir.delete({ where: { id } });
  });
};

const generateAvoirPdf = async (avoirId: number): Promise<Buffer | null> => {
  const avoir = await getAvoirById(avoirId);
  if (!avoir) return null;

  const entreprise = (avoir as any).entrepriseId
    ? await prisma.entreprise.findUnique({ where: { id: (avoir as any).entrepriseId } })
    : null;

  const nomEntreprise = entreprise?.nom || 'Mon Entreprise';
  const telEntreprise = entreprise?.tel || '';
  const adresseEntreprise = entreprise?.adresse || '';

  const nbLignes = avoir.lignes.length;
  const hauteurFixe = 380;
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

      const W = 226.77 - 20;

      // En-tête
      doc.fontSize(13).font('Helvetica-Bold').text(nomEntreprise.toUpperCase(), { align: 'center' });
      if (adresseEntreprise) doc.fontSize(7).font('Helvetica').text(adresseEntreprise, { align: 'center' });
      if (telEntreprise) doc.fontSize(7).font('Helvetica').text(`Tél: ${telEntreprise}`, { align: 'center' });
      doc.moveDown(0.3);

      doc.fontSize(14).font('Helvetica-Bold').text('AVOIR', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(8).font('Helvetica').text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica-Bold').text(`N° AV-${String(avoir.id).padStart(5, '0')}`, { align: 'center' });
      doc.fontSize(8).font('Helvetica').text(`Date: ${new Date(avoir.dateAvoir).toLocaleString('fr-FR')}`, { align: 'center' });
      doc.fontSize(8).font('Helvetica').text(`Réf. commande: CMD-${String((avoir.commande as any).id).padStart(5, '0')}`, { align: 'center' });
      doc.fontSize(8).font('Helvetica').text(`Date commande: ${new Date((avoir.commande as any).dateCommande).toLocaleDateString('fr-FR')}`, { align: 'center' });
      doc.moveDown(0.4);

      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);

      // Client
      doc.fontSize(8).font('Helvetica-Bold').text('CLIENT');
      doc.font('Helvetica').text(`${(avoir.client as any).prenom || ''} ${avoir.client.nom}`.trim());
      if ((avoir.client as any).tel && !estClientAnonyme(avoir.client)) doc.text(`Tél: ${(avoir.client as any).tel}`);
      if ((avoir as any).porteurNom || (avoir as any).porteurTel) {
        doc.text(`Porteur: ${[(avoir as any).porteurNom, (avoir as any).porteurTel].filter(Boolean).join(' - ')}`);
      }
      doc.moveDown(0.4);

      // Vendeur
      if ((avoir.vendeur as any)?.user) {
        doc.font('Helvetica-Bold').text('TRAITÉ PAR');
        doc.font('Helvetica').text(`${(avoir.vendeur as any).user.prenom} ${(avoir.vendeur as any).user.nom}`);
        doc.moveDown(0.4);
      }

      // Motif
      if (avoir.motif) {
        doc.font('Helvetica-Bold').text('MOTIF');
        doc.font('Helvetica').text(avoir.motif);
        doc.moveDown(0.4);
      }

      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);
      doc.font('Helvetica-Bold').fontSize(9).text('ARTICLES RETOURNÉS');
      doc.moveDown(0.4);

      avoir.lignes.forEach((ligne: any) => {
        const libelle = ligne.produit?.libelle || ligne.plat?.libelle || 'Article inconnu';
        const qte = ligne.quantite;
        const prixU = Number(ligne.prixUnitaire);
        const montantLigne = Number(ligne.montant);

        doc.font('Helvetica').fontSize(8).text(libelle);
        const leftPart = `${qte} x ${prixU.toFixed(0)}`;
        const rightPart = `${montantLigne.toFixed(0)} F`;
        const dotsWidth = W - doc.widthOfString(leftPart) - doc.widthOfString(rightPart) - 10;
        const dots = '.'.repeat(Math.max(0, Math.floor(dotsWidth / doc.widthOfString('.'))));
        doc.text(`${leftPart}${dots}${rightPart}`);
        doc.moveDown(0.3);
      });

      doc.moveDown(0.3);
      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);

      doc.fontSize(10).font('Helvetica-Bold').text(`TOTAL AVOIR: ${Number(avoir.montant).toFixed(0)} FCFA`, { align: 'right' });
      doc.moveDown(0.4);

      doc.text('----------------------------------------', { align: 'center' });
      doc.moveDown(0.3);

      const typeLabel = avoir.type === 'REMBOURSEMENT' ? 'REMBOURSEMENT EN ESPÈCES'
        : avoir.type === 'MONNAIE' ? "BON D'AVOIR (MONNAIE)"
        : ['PRODUITS', 'GARDE'].includes(avoir.type as string) ? 'PRODUITS GARDÉS'
        : 'CRÉDIT CLIENT';
      doc.fontSize(9).font('Helvetica-Bold').text(`Type: ${typeLabel}`, { align: 'center' });
      doc.moveDown(0.4);

      if (['MONNAIE', 'PRODUITS', 'GARDE'].includes(avoir.type as string)) {
        doc.fontSize(8).font('Helvetica-Bold').text(
          `Présentez ce bon N° AV-${String(avoir.id).padStart(5, '0')} à la caisse.`,
          { align: 'center' },
        );
        doc.fontSize(7).font('Helvetica').text('Bon valable une seule fois.', { align: 'center' });
        doc.moveDown(0.4);
      }

      doc.fontSize(9).font('Helvetica-Bold').text('Merci pour votre confiance!', { align: 'center' });
      doc.fontSize(7).font('Helvetica').text(nomEntreprise, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  createAvoir,
  getAllAvoirs,
  getAvoirById,
  getAvoirsByCommande,
  consommerMonnaie,
  recupererGarde,
  rembourserCredit,
  deleteAvoir,
  generateAvoirPdf,
  getBonAvoir,
};
