import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BilanPeriode {
  periode: { debut: Date; fin: Date };
  revenus: {
    totalVentes: number;
    totalPaiementsRecus: number;
    creances: number;
    nbCommandes: number;
    nbCommandesLivrees: number;
  };
  depenses: {
    totalApprovisionnements: number;
    totalSalaires: number;
    total: number;
  };
  beneficeNet: number;
  margePercent: number;
  topProduits: Array<{ libelle: string; quantite: number; montant: number }>;
  detailTransactions: Array<{ type: string; libelle: string; montant: number; date: Date }>;
}

const getBilanPeriode = async (
  debut: Date,
  fin: Date,
  entrepriseId?: number
): Promise<BilanPeriode> => {
  const w = entrepriseId ? { entrepriseId } : {};
  const wDate = { ...w, dateCommande: { gte: debut, lte: fin } };
  const wDateAppro = { ...w, dateApprovisionnement: { gte: debut, lte: fin } };
  const wDateSalaire = { datePaiement: { gte: debut, lte: fin } };

  // Commandes de la période
  const commandes = await prisma.commande.findMany({
    where: wDate,
    include: {
      paiements: { where: { statut: 'REUSSI' } },
      lignes: { include: { produit: { select: { libelle: true } } } },
    },
  });

  let totalVentes = 0;
  let totalPaiementsRecus = 0;
  let creances = 0;
  const nbCommandes = commandes.length;
  const nbCommandesLivrees = commandes.filter(c => c.statut === 'LIVREE').length;
  const produitsMap: Record<string, { quantite: number; montant: number }> = {};

  for (const cmd of commandes) {
    totalVentes += Number(cmd.montant);
    const paye = cmd.paiements.reduce((s, p) => s + Number(p.montant), 0);
    totalPaiementsRecus += paye;
    creances += Math.max(0, Number(cmd.montant) - paye);

    for (const ligne of cmd.lignes) {
      const lib = ligne.produit?.libelle ?? 'Inconnu';
      if (!produitsMap[lib]) produitsMap[lib] = { quantite: 0, montant: 0 };
      produitsMap[lib].quantite += ligne.quantiteCommande;
      produitsMap[lib].montant += Number(ligne.montant);
    }
  }

  const topProduits = Object.entries(produitsMap)
    .map(([libelle, v]) => ({ libelle, ...v }))
    .sort((a, b) => b.montant - a.montant)
    .slice(0, 5);

  // Approvisionnements
  const approAgg = await prisma.approvisionnement.aggregate({
    where: wDateAppro,
    _sum: { montant: true },
  });
  const totalApprovisionnements = approAgg._sum.montant || 0;

  // Salaires (filtre via employe.user.entrepriseId si nécessaire)
  let salaireWhere: any = wDateSalaire;
  if (entrepriseId) {
    const employeIds = await prisma.employe.findMany({
      where: { user: { entrepriseId } },
      select: { id: true },
    });
    salaireWhere = { ...wDateSalaire, employeId: { in: employeIds.map(e => e.id) } };
  }
  const salaireAgg = await prisma.salairePaiement.aggregate({
    where: salaireWhere,
    _sum: { montant: true },
  });
  const totalSalaires = salaireAgg._sum.montant || 0;
  const totalDepenses = totalApprovisionnements + totalSalaires;

  const beneficeNet = totalPaiementsRecus - totalDepenses;
  const margePercent = totalVentes > 0
    ? Math.round(((totalPaiementsRecus - totalDepenses) / totalVentes) * 100 * 10) / 10
    : 0;

  // Dernières transactions de la période (25 max)
  const transactions = await prisma.transaction.findMany({
    where: { ...w, date: { gte: debut, lte: fin } },
    orderBy: { updatedAt: 'desc' },
    take: 25,
    select: { type: true, libelle: true, montant: true, date: true },
  });

  return {
    periode: { debut, fin },
    revenus: { totalVentes, totalPaiementsRecus, creances, nbCommandes, nbCommandesLivrees },
    depenses: { totalApprovisionnements, totalSalaires, total: totalDepenses },
    beneficeNet,
    margePercent,
    topProduits,
    detailTransactions: transactions,
  };
};

export default { getBilanPeriode };
