import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('[recompute-creance] Start');

  const commandes = await prisma.commande.findMany({
    include: { paiements: { orderBy: { datePaiement: 'asc' } } },
  });

  for (const cmd of commandes) {
    const reduction = Number((cmd as any).reduction || 0);
    const totalAttendu = Number((cmd as any).montant || 0) - reduction;

    let paid = 0;
    for (const p of cmd.paiements) {
      // Only count successful payments in the running total
      if ((p as any).statut === 'REUSSI') {
        paid += Number((p as any).montant || 0);
      }

      const remaining = Math.max(0, totalAttendu - paid);

      // Update paiement.creance
      await prisma.paiement.update({
        where: { id: p.id },
        data: { creance: remaining },
      });

      console.log(`commande=${cmd.id} paiement=${p.id} statut=${p.statut} montant=${p.montant} -> creance=${remaining}`);
    }
  }

  console.log('[recompute-creance] Done');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
