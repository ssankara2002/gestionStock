import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const getRecetteByPlat = async (platId: number) => {
  return prisma.recettePlat.findMany({
    where: { platId },
    include: { matierePremiere: true },
  })
}

const upsertIngredient = async (platId: number, matierePremiereId: number, quantiteParPortion: number, unite: string) => {
  return prisma.recettePlat.upsert({
    where: { platId_matierePremiereId: { platId, matierePremiereId } },
    create: { platId, matierePremiereId, quantiteParPortion, unite },
    update: { quantiteParPortion, unite },
    include: { matierePremiere: true },
  })
}

const deleteIngredient = async (platId: number, matierePremiereId: number) => {
  return prisma.recettePlat.deleteMany({ where: { platId, matierePremiereId } })
}

// Calcule combien de portions d'un plat on peut faire avec le stock actuel
const getCapaciteProduction = async (platId: number) => {
  const recette = await prisma.recettePlat.findMany({
    where: { platId },
    include: { matierePremiere: true },
  })

  if (recette.length === 0) return { capacite: null, ingredients: [] }

  const ingredients = recette.map((r) => {
    const stock = r.matierePremiere.quantiteStock
    const portionsPossibles = r.quantiteParPortion > 0 ? Math.floor(stock / r.quantiteParPortion) : 0
    return {
      matierePremiereId: r.matierePremiereId,
      nom: r.matierePremiere.nom,
      unite: r.unite,
      quantiteParPortion: r.quantiteParPortion,
      stockActuel: stock,
      portionsPossibles,
    }
  })

  const capacite = Math.min(...ingredients.map((i) => i.portionsPossibles))

  return { capacite, ingredients }
}

// Calcule la capacité pour tous les plats d'une entreprise
const getCapaciteTousPlats = async (entrepriseId?: number) => {
  const plats = await prisma.plat.findMany({
    where: entrepriseId ? { entrepriseId } : {},
    include: {
      recette: {
        include: { matierePremiere: true },
      },
    },
    orderBy: { libelle: 'asc' },
  })

  return plats.map((plat) => {
    if (plat.recette.length === 0) return { platId: plat.id, libelle: plat.libelle, image: plat.image, capacite: null }

    const portionsParIngredient = plat.recette.map((r) =>
      r.quantiteParPortion > 0 ? Math.floor(r.matierePremiere.quantiteStock / r.quantiteParPortion) : 0
    )
    const capacite = Math.min(...portionsParIngredient)
    return { platId: plat.id, libelle: plat.libelle, image: plat.image, capacite }
  })
}

export default { getRecetteByPlat, upsertIngredient, deleteIngredient, getCapaciteProduction, getCapaciteTousPlats }
