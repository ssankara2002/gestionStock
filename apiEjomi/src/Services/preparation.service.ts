import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface LignePreparationInput {
  matierePremiereId: number
  quantiteUtilisee: number
}

const creerPreparation = async (
  platId: number,
  nombrePortions: number,
  lignes: LignePreparationInput[],
  note?: string,
  entrepriseId?: number,
) => {
  const plat = await prisma.plat.findUnique({ where: { id: platId }, select: { id: true, entrepriseId: true } })
  if (!plat) throw new Error('Plat introuvable')
  if (entrepriseId && plat.entrepriseId !== entrepriseId) throw new Error('Accès interdit')
  if (!lignes || lignes.length === 0) throw new Error('Ajoutez au moins un ingrédient')

  const insuffisants: string[] = []
  for (const ligne of lignes) {
    const mp = await prisma.matierePremiere.findUnique({ where: { id: ligne.matierePremiereId } })
    if (!mp) throw new Error(`Ingrédient introuvable (id: ${ligne.matierePremiereId})`)
    if (mp.quantiteStock < ligne.quantiteUtilisee) {
      insuffisants.push(`${mp.nom} : besoin ${ligne.quantiteUtilisee} ${mp.unite}, disponible ${mp.quantiteStock} ${mp.unite}`)
    }
  }
  if (insuffisants.length > 0) throw new Error(`Stock insuffisant :\n${insuffisants.join('\n')}`)

  return await prisma.$transaction(async (tx) => {
    for (const ligne of lignes) {
      await tx.matierePremiere.update({
        where: { id: ligne.matierePremiereId },
        data: { quantiteStock: { decrement: ligne.quantiteUtilisee } },
      })
    }
    // Incrémenter le stock de plats préparés
    await tx.plat.update({
      where: { id: platId },
      data: { stockPlat: { increment: nombrePortions } },
    })
    return tx.preparationPlat.create({
      data: {
        platId,
        nombrePortions,
        note: note || null,
        lignes: {
          create: lignes.map((l) => ({
            matierePremiereId: l.matierePremiereId,
            quantiteUtilisee: l.quantiteUtilisee,
          })),
        },
      },
      include: {
        plat: { select: { id: true, libelle: true } },
        lignes: { include: { matierePremiere: { select: { id: true, nom: true, unite: true } } } },
      },
    })
  })
}

const getById = async (id: number, entrepriseId?: number) => {
  const prep = await prisma.preparationPlat.findUnique({
    where: { id },
    include: {
      plat: { select: { id: true, libelle: true, image: true, entrepriseId: true, stockPlat: true } },
      lignes: { include: { matierePremiere: { select: { id: true, nom: true, unite: true, categorie: true, quantiteStock: true } } } },
    },
  })
  if (!prep) throw new Error('Préparation introuvable')
  if (entrepriseId && prep.plat.entrepriseId !== entrepriseId) throw new Error('Accès interdit')

  // Total vendus de ce plat depuis la préparation (toutes périodes)
  const totalVendus = await prisma.ligneCommande.aggregate({
    _sum: { quantiteCommande: true },
    where: { platId: prep.platId },
  })
  const totalPreparations = await prisma.preparationPlat.aggregate({
    _sum: { nombrePortions: true },
    where: { platId: prep.platId },
  })
  const totalPrepares = totalPreparations._sum.nombrePortions ?? 0
  const totalVendusTout = totalVendus._sum.quantiteCommande ?? 0

  return {
    ...prep,
    stockPlatRestant: prep.plat.stockPlat,  // stock temps réel
    totalPreparesToutTemps: totalPrepares,
    totalVendusToutTemps: totalVendusTout,
  }
}

// Modifie une préparation : réajuste le stock (remet l'ancien, déduit le nouveau)
const modifierPreparation = async (
  id: number,
  nombrePortions: number,
  lignes: LignePreparationInput[],
  note?: string,
  entrepriseId?: number,
) => {
  const prep = await prisma.preparationPlat.findUnique({
    where: { id },
    include: {
      plat: { select: { entrepriseId: true } },
      lignes: true,
    },
  })
  if (!prep) throw new Error('Préparation introuvable')
  if (entrepriseId && prep.plat.entrepriseId !== entrepriseId) throw new Error('Accès interdit')
  if (!lignes || lignes.length === 0) throw new Error('Ajoutez au moins un ingrédient')

  // Vérifier stocks : stock actuel + ancienne qté - nouvelle qté >= 0
  const insuffisants: string[] = []
  for (const ligne of lignes) {
    const mp = await prisma.matierePremiere.findUnique({ where: { id: ligne.matierePremiereId } })
    if (!mp) throw new Error(`Ingrédient introuvable (id: ${ligne.matierePremiereId})`)
    const ancienneLigne = prep.lignes.find((l) => l.matierePremiereId === ligne.matierePremiereId)
    const ancienneQte = ancienneLigne?.quantiteUtilisee ?? 0
    const stockEffectif = mp.quantiteStock + ancienneQte
    if (stockEffectif < ligne.quantiteUtilisee) {
      insuffisants.push(`${mp.nom} : besoin ${ligne.quantiteUtilisee} ${mp.unite}, disponible ${stockEffectif} ${mp.unite}`)
    }
  }
  if (insuffisants.length > 0) throw new Error(`Stock insuffisant :\n${insuffisants.join('\n')}`)

  return await prisma.$transaction(async (tx) => {
    // Remettre l'ancien stock ingrédients
    for (const ancienne of prep.lignes) {
      await tx.matierePremiere.update({
        where: { id: ancienne.matierePremiereId },
        data: { quantiteStock: { increment: ancienne.quantiteUtilisee } },
      })
    }
    // Déduire le nouveau stock ingrédients
    for (const ligne of lignes) {
      await tx.matierePremiere.update({
        where: { id: ligne.matierePremiereId },
        data: { quantiteStock: { decrement: ligne.quantiteUtilisee } },
      })
    }
    // Ajuster stockPlat : retirer l'ancien nombrePortions, ajouter le nouveau
    await tx.plat.update({
      where: { id: prep.platId },
      data: { stockPlat: { decrement: prep.nombrePortions } },
    })
    await tx.plat.update({
      where: { id: prep.platId },
      data: { stockPlat: { increment: nombrePortions } },
    })
    // Supprimer les anciennes lignes et recréer
    await tx.lignePreparation.deleteMany({ where: { preparationId: id } })
    return tx.preparationPlat.update({
      where: { id },
      data: {
        nombrePortions,
        note: note || null,
        lignes: {
          create: lignes.map((l) => ({
            matierePremiereId: l.matierePremiereId,
            quantiteUtilisee: l.quantiteUtilisee,
          })),
        },
      },
      include: {
        plat: { select: { id: true, libelle: true } },
        lignes: { include: { matierePremiere: { select: { id: true, nom: true, unite: true } } } },
      },
    })
  })
}

// Supprime une préparation et remet le stock
const supprimerPreparation = async (id: number, entrepriseId?: number) => {
  const prep = await prisma.preparationPlat.findUnique({
    where: { id },
    include: {
      plat: { select: { entrepriseId: true } },
      lignes: true,
    },
  })
  if (!prep) throw new Error('Préparation introuvable')
  if (entrepriseId && prep.plat.entrepriseId !== entrepriseId) throw new Error('Accès interdit')

  return await prisma.$transaction(async (tx) => {
    // Remettre le stock ingrédients
    for (const ligne of prep.lignes) {
      await tx.matierePremiere.update({
        where: { id: ligne.matierePremiereId },
        data: { quantiteStock: { increment: ligne.quantiteUtilisee } },
      })
    }
    // Remettre le stockPlat (ne pas descendre sous 0)
    await tx.plat.update({
      where: { id: prep.platId },
      data: { stockPlat: { decrement: prep.nombrePortions } },
    })
    await tx.preparationPlat.delete({ where: { id } })
  })
}

const getHistorique = async (platId?: number, entrepriseId?: number, limit = 50) => {
  const where: any = {}
  if (platId) where.platId = platId
  if (entrepriseId) where.plat = { entrepriseId }

  const preps = await prisma.preparationPlat.findMany({
    where,
    include: {
      plat: { select: { id: true, libelle: true, image: true, stockPlat: true } },
      lignes: { include: { matierePremiere: { select: { id: true, nom: true, unite: true } } } },
    },
    orderBy: { datePreparation: 'desc' },
    take: limit,
  })

  // Ajouter stockPlatRestant (temps réel depuis plat.stockPlat)
  return preps.map((prep) => ({
    ...prep,
    stockPlatRestant: prep.plat.stockPlat,
  }))
}

const getHistoriqueJour = async (entrepriseId?: number) => {
  const debutJour = new Date()
  debutJour.setHours(0, 0, 0, 0)
  const finJour = new Date()
  finJour.setHours(23, 59, 59, 999)

  const preps = await prisma.preparationPlat.findMany({
    where: {
      datePreparation: { gte: debutJour },
      ...(entrepriseId ? { plat: { entrepriseId } } : {}),
    },
    include: {
      plat: { select: { id: true, libelle: true, image: true, stockPlat: true } },
      lignes: { include: { matierePremiere: { select: { id: true, nom: true, unite: true } } } },
    },
    orderBy: { datePreparation: 'desc' },
  })

  return preps.map((prep) => ({
    ...prep,
    stockPlatRestant: prep.plat.stockPlat,
  }))
}

export default { creerPreparation, getById, modifierPreparation, supprimerPreparation, getHistorique, getHistoriqueJour }
