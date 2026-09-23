import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';

const prisma = new PrismaClient();

interface PaiementCreateData {
  montant: number;
  datePaiement: Date;
  modePaiement: string;
  statut?: string;
  commandeId: number;
}

interface PaiementUpdateData {
  montant?: number;
  datePaiement?: Date;
  modePaiement?: string;
  statut?: string;
  commandeId?: number;
}

const getAllPaiements = async (entrepriseId?: number) => {
  return await prisma.paiement.findMany({
    where: entrepriseId ? { commande: { entrepriseId } } : {},
    include: {
      commande: {
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { datePaiement: 'desc' }
  });
};

const getPaiementById = async (id: number) => {
  return await prisma.paiement.findUnique({
    where: { id },
    include: {
      commande: {
        include: {
          client: true,
          vendeur: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });
};

const createPaiement = async (data: PaiementCreateData) => {
  // Calculate creance (remaining) based on commande total and paid amounts
  const commande = await prisma.commande.findUnique({ where: { id: data.commandeId }, include: { paiements: true } });

  if (!commande) {
    throw new Error('Commande introuvable');
  }

  // La réduction est maintenant un montant absolu déjà appliqué dans commande.montant
  const totalAttendu = Number((commande as any).montant || 0);

  const totalPaidSoFar = (commande.paiements || [])
    .filter((p: any) => p.statut === 'REUSSI')
    .reduce((acc: number, p: any) => acc + Number(p.montant || 0), 0);

  // Validation: Empêcher les paiements qui dépassent le montant de la commande
  const montantPaiement = Number(data.montant || 0);
  const totalPaidAfter = totalPaidSoFar + montantPaiement;

  if (totalPaidAfter > totalAttendu) {
    throw new Error(
      `Le montant du paiement dépasse le montant restant de la commande. ` +
      `Montant de la commande: ${totalAttendu.toFixed(2)} FCFA, ` +
      `Déjà payé: ${totalPaidSoFar.toFixed(2)} FCFA, ` +
      `Reste à payer: ${(totalAttendu - totalPaidSoFar).toFixed(2)} FCFA`
    );
  }

  const creance = Math.max(0, totalAttendu - totalPaidAfter);

  return await prisma.$transaction(async (tx) => {
    // Créer le paiement
    const paiement = await tx.paiement.create({
      data: {
        montant: montantPaiement,
        creance,
        datePaiement: data.datePaiement,
        modePaiement: data.modePaiement as any,
        statut: (data.statut as any) || 'EN_ATTENTE',
        commandeId: data.commandeId,
      },
      include: {
        commande: {
          include: {
            client: {
              select: {
                id: true,
                nom: true,
                prenom: true,
              },
            },
          },
        },
      },
    });

    // Si le paiement est réussi et que la créance est nulle, mettre à jour le statut de la commande à "payé"
    if (paiement.statut === 'REUSSI' && creance === 0) {
      await tx.commande.update({
        where: { id: data.commandeId },
        data: { statut: 'LIVREE' as any },
      });
    }

    return paiement;
  });
};

const updatePaiement = async (id: number, data: PaiementUpdateData) => {
  return await prisma.paiement.update({
    where: { id },
    data: {
      montant: data.montant,
      datePaiement: data.datePaiement,
      modePaiement: data.modePaiement as any,
      statut: data.statut as any,
      commandeId: data.commandeId,
    },
    include: {
      commande: {
        include: {
          client: {
            select: {
              id: true,
              nom: true,
              prenom: true,
            },
          },
        },
      },
    },
  });
};

const deletePaiement = async (id: number) => {
  return await prisma.paiement.delete({
    where: { id },
  });
};

const getPaiementsByCommande = async (commandeId: number) => {
  return await prisma.paiement.findMany({
    where: { commandeId },
    include: {
      commande: true,
    },
    orderBy: { datePaiement: 'desc' }
  });
};

const getPaiementsByStatut = async (statut: string) => {
  return await prisma.paiement.findMany({
    where: { statut: statut as any },
    include: {
      commande: {
        include: {
          client: true,
        },
      },
    },
    orderBy: { datePaiement: 'desc' }
  });
};

/**
 * Retourne le solde (reste à payer) d'une commande.
 * Calcul: montant commande - reduction - somme des paiements réussis
 */
const getSoldeByCommande = async (commandeId: number) => {
  const commande = await prisma.commande.findUnique({
    where: { id: commandeId },
    include: { paiements: true },
  });

  if (!commande) return null;

  const totalPaid = (commande.paiements || [])
    .filter((p: any) => p.statut === 'REUSSI')
    .reduce((acc: number, p: any) => acc + Number(p.montant || 0), 0);

  const reduction = Number((commande as any).reduction || 0);
  const total = Number((commande as any).montant || 0) - reduction;
  const remaining = Math.max(0, total - totalPaid);

  return {
    commandeId,
    total,
    totalPaid,
    reduction,
    remaining,
  };
};

/**
 * Retourne l'encours (liste des commandes avec reste à payer) pour un client
 */
const getOutstandingByClient = async (clientId: number) => {
  const commandes = await prisma.commande.findMany({
    where: { clientId },
    include: { paiements: true },
    orderBy: { datePaiement: 'desc' }
  });

  const result = commandes.map((c: any) => {
    const totalPaid = (c.paiements || [])
      .filter((p: any) => p.statut === 'REUSSI')
      .reduce((acc: number, p: any) => acc + Number(p.montant || 0), 0);
    const reduction = Number(c.reduction || 0);
    const total = Number(c.montant || 0) - reduction;
    const remaining = Math.max(0, total - totalPaid);
    return {
      commandeId: c.id,
      dateCommande: c.dateCommande,
      total,
      totalPaid,
      reduction,
      remaining,
      statut: c.statut,
    };
  }).filter((r: any) => r.remaining > 0);

  const totalOutstanding = result.reduce((acc: number, r: any) => acc + r.remaining, 0);

  return { clientId, totalOutstanding, details: result };
};

/**
 * Génère un reçu de paiement au format PDF A5
 */
const generateRecuPaiementPdf = async (paiementId: number): Promise<Buffer | null> => {
  const paiement = await getPaiementById(paiementId);

  if (!paiement) {
    return null;
  }

  return new Promise((resolve, reject) => {
    try {
      // Créer un document PDF au format A5 (148 x 210 mm = 419.53 x 595.28 points)
      const doc = new PDFDocument({
        size: [419.53, 595.28],
        margins: { top: 30, bottom: 30, left: 30, right: 30 },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text('REÇU DE PAIEMENT', { align: 'center' })
        .moveDown(0.5);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('GoldStore - Équipement de Détection d\'Or', { align: 'center' })
        .moveDown(1);

      // Ligne de séparation
      doc
        .moveTo(30, doc.y)
        .lineTo(419.53 - 30, doc.y)
        .stroke()
        .moveDown(0.5);

      // Informations du paiement
      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(`Reçu N° ${paiement.id}`, { align: 'left' })
        .moveDown(0.3);

      doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Date du paiement: ${new Date(paiement.datePaiement).toLocaleDateString('fr-FR')}`)
        .text(`Mode de paiement: ${paiement.modePaiement}`)
        .text(`Statut: ${paiement.statut}`)
        .moveDown(0.5);

      // Informations du client
      const client = paiement.commande?.client;
      if (client) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('INFORMATIONS CLIENT', { underline: true })
          .moveDown(0.3);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Nom: ${client.prenom} ${client.nom}`)
          .text(`Email: ${client.email || 'N/A'}`)
          .text(`Téléphone: ${client.tel || 'N/A'}`)
          .text(`Adresse: ${client.adresse || 'N/A'}`)
          .moveDown(0.5);
      }

      // Informations de la commande
      if (paiement.commande) {
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('DÉTAILS DE LA COMMANDE', { underline: true })
          .moveDown(0.3);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Commande N° ${paiement.commandeId}`)
          .text(`Date de commande: ${new Date(paiement.commande.dateCommande).toLocaleDateString('fr-FR')}`)
          .text(`Montant de la commande: ${Number(paiement.commande.montant).toFixed(2)} FCFA`)
          .text(`Réduction: ${Number(paiement.commande.reduction || 0).toFixed(2)}%`)
          .moveDown(0.5);
      }

      // Ligne de séparation
      doc
        .moveTo(30, doc.y)
        .lineTo(419.53 - 30, doc.y)
        .stroke()
        .moveDown(0.5);

      // Montant du paiement (mis en évidence)
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('MONTANT PAYÉ:', { continued: true })
        .fontSize(14)
        .text(` ${Number(paiement.montant).toFixed(2)} FCFA`, { align: 'left' })
        .moveDown(0.3);

      doc
        .fontSize(11)
        .font('Helvetica')
        .text(`Créance restante: ${Number(paiement.creance).toFixed(2)} FCFA`)
        .moveDown(1);

      // Ligne de séparation
      doc
        .moveTo(30, doc.y)
        .lineTo(419.53 - 30, doc.y)
        .stroke()
        .moveDown(1);

      // Pied de page
      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .text('Merci pour votre confiance!', { align: 'center' })
        .moveDown(0.3)
        .text('Ce reçu fait office de preuve de paiement.', { align: 'center' })
        .moveDown(0.5)
        .fontSize(8)
        .text(`Document généré le ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });

      // Finaliser le PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const getPaiementStatistics = async (entrepriseId?: number) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const commandeWhere = entrepriseId ? { entrepriseId } : {};

  const commandes = await prisma.commande.findMany({
    where: commandeWhere,
    include: {
      paiements: { where: { statut: 'REUSSI' } },
    },
  });

  let totalPaiements = 0;
  let totalCreances = 0;
  let totalPaiementsCeMois = 0;

  commandes.forEach(commande => {
    const montantCommande = Number(commande.montant || 0);
    const totalPaye = commande.paiements.reduce((sum, p) => sum + Number(p.montant || 0), 0);
    totalPaiements += totalPaye;
    totalCreances += Math.max(0, montantCommande - totalPaye);
    commande.paiements.forEach(p => {
      if (p.datePaiement && p.datePaiement >= startOfMonth) {
        totalPaiementsCeMois += Number(p.montant || 0);
      }
    });
  });

  const approWhere = entrepriseId ? { entrepriseId } : {};
  const [approvisionnements, salaires] = await Promise.all([
    prisma.approvisionnement.aggregate({ where: approWhere, _sum: { montant: true } }),
    prisma.salairePaiement.aggregate({ _sum: { montant: true } }),
  ]);

  const totalDepenses = (approvisionnements._sum.montant || 0) + (salaires._sum.montant || 0);

  return {
    totalPaiements,
    totalCreances,
    totalPaiementsCeMois,
    totalDepenses,
    balance: totalPaiements - totalDepenses,
  };
};

export default {
  getAllPaiements,
  getPaiementById,
  createPaiement,
  updatePaiement,
  deletePaiement,
  getPaiementsByCommande,
  getPaiementsByStatut,
  getSoldeByCommande,
  getPaiementStatistics,
  getOutstandingByClient,
  generateRecuPaiementPdf,
};