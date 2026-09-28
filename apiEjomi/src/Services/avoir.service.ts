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
  type: 'REMBOURSEMENT' | 'CREDIT';
  lignes: LigneAvoirInput[];
}

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
        type: data.type as any,
        statut: 'EN_ATTENTE' as any,
        montant: montantTotal,
      },
    });

    // Créer les lignes et restituer le stock
    for (const ligne of data.lignes) {
      if (!ligne.produitId && !ligne.platId) throw new Error('Chaque ligne doit avoir un produit ou un plat.');

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

      // Restitution stock plat
      if (ligne.platId) {
        await tx.plat.update({
          where: { id: ligne.platId },
          data: { stockPlat: { increment: ligne.quantite } },
        });
        continue;
      }

      // Restitution stock boutique + lotStock FIFO inversé (dernier lot consommé d'abord)
      const stockBoutique = await tx.stockBoutique.findUnique({ where: { produitId: ligne.produitId } });
      if (stockBoutique) {
        await tx.stockBoutique.update({
          where: { id: stockBoutique.id },
          data: { quantite: { increment: ligne.quantite } },
        });
      }

      // Réincrémenter le lot le plus récent consommé (dernier FIFO)
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

    // Appliquer selon le type
    if (data.type === 'REMBOURSEMENT') {
      // Paiement négatif pour sortie de caisse
      await tx.paiement.create({
        data: {
          commandeId: data.commandeId,
          montant: -montantTotal,
          modePaiement: 'ESPECES' as any,
          statut: 'REUSSI' as any,
        },
      });
    } else {
      // Crédit client
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
  const hauteurFixe = 340;
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
      if ((avoir.client as any).tel) doc.text(`Tél: ${(avoir.client as any).tel}`);
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

      const typeLabel = avoir.type === 'REMBOURSEMENT' ? 'REMBOURSEMENT EN ESPÈCES' : 'CRÉDIT CLIENT';
      doc.fontSize(9).font('Helvetica-Bold').text(`Type: ${typeLabel}`, { align: 'center' });
      doc.moveDown(0.4);

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
  deleteAvoir,
  generateAvoirPdf,
};
