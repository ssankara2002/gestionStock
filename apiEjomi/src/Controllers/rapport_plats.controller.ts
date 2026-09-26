import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js'

const prisma = new PrismaClient()

export const getRapportCoutsPlats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entrepriseId = req.user?.entrepriseId
    const { debut, fin } = req.query

    const dateDebut = debut ? new Date(debut as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const dateFin = fin ? new Date(fin as string) : new Date()
    dateFin.setHours(23, 59, 59, 999)

    const where = entrepriseId ? { entrepriseId } : {}

    // Tous les plats de l'entreprise
    const plats = await prisma.plat.findMany({
      where,
      select: { id: true, libelle: true, prixVenteUnitaire: true, stockPlat: true },
      orderBy: { libelle: 'asc' },
    })

    const rapport = await Promise.all(plats.map(async (plat) => {
      // Préparations sur la période
      const preparations = await prisma.preparationPlat.findMany({
        where: {
          platId: plat.id,
          datePreparation: { gte: dateDebut, lte: dateFin },
        },
        include: {
          lignes: {
            include: { matierePremiere: { select: { prixAchat: true, nom: true, unite: true } } },
          },
        },
      })

      // Coût total ingrédients utilisés
      let coutIngredients = 0
      let totalPlatsPreparesUnites = 0
      for (const prep of preparations) {
        totalPlatsPreparesUnites += prep.nombrePortions
        for (const ligne of prep.lignes) {
          coutIngredients += ligne.quantiteUtilisee * (ligne.matierePremiere.prixAchat || 0)
        }
      }

      // Coût des approvisionnements d'ingrédients sur la période
      // Via LigneApprovisionnement liées aux matières premières utilisées dans les préparations de ce plat
      const matiereIds = [...new Set(preparations.flatMap(p => p.lignes.map(l => l.matierePremiereId)))]
      let coutApproIngredients = 0
      if (matiereIds.length > 0) {
        const lignesAppro = await prisma.ligneApprovisionnement.findMany({
          where: {
            matierePremiereId: { in: matiereIds },
            approvisionnement: {
              dateApprovisionnement: { gte: dateDebut, lte: dateFin },
              ...(entrepriseId ? { entrepriseId } : {}),
            },
          },
          select: { quantite: true, prixUnitaire: true },
        })
        coutApproIngredients = lignesAppro.reduce((s, a) => s + a.quantite * a.prixUnitaire, 0)
      }

      // Ventes sur la période
      const lignesVente = await prisma.ligneCommande.findMany({
        where: {
          platId: plat.id,
          commande: {
            dateCommande: { gte: dateDebut, lte: dateFin },
            ...(entrepriseId ? { entrepriseId } : {}),
          },
        },
        select: { quantiteCommande: true, prixUnitaire: true, montant: true },
      })

      const totalPlatsVendus = lignesVente.reduce((s, l) => s + l.quantiteCommande, 0)
      const revenuVente = lignesVente.reduce((s, l) => s + l.montant, 0)
      const benefice = revenuVente - coutIngredients
      const stockPlatRestant = plat.stockPlat  // stock actuel en temps réel
      const ecartPreparesVendus = totalPlatsPreparesUnites - totalPlatsVendus

      return {
        platId: plat.id,
        libelle: plat.libelle,
        prixVente: plat.prixVenteUnitaire,
        nbPreparations: preparations.length,
        totalPlatsPreparesUnites,
        coutIngredients: Math.round(coutIngredients * 100) / 100,
        coutApproIngredients: Math.round(coutApproIngredients * 100) / 100,
        totalPlatsVendus,
        revenuVente,
        benefice: Math.round(benefice * 100) / 100,
        stockPlatRestant,
        ecartPreparesVendus,
      }
    }))

    // Totaux globaux
    const totaux = rapport.reduce((acc, r) => ({
      coutIngredients: acc.coutIngredients + r.coutIngredients,
      coutApproIngredients: acc.coutApproIngredients + r.coutApproIngredients,
      revenuVente: acc.revenuVente + r.revenuVente,
      benefice: acc.benefice + r.benefice,
      totalPlatsVendus: acc.totalPlatsVendus + r.totalPlatsVendus,
      totalPlatsPrepares: acc.totalPlatsPrepares + r.totalPlatsPreparesUnites,
      totalStockRestant: acc.totalStockRestant + r.stockPlatRestant,
    }), { coutIngredients: 0, coutApproIngredients: 0, revenuVente: 0, benefice: 0, totalPlatsVendus: 0, totalPlatsPrepares: 0, totalStockRestant: 0 })

    res.json({ success: true, data: { rapport, totaux, periode: { debut: dateDebut, fin: dateFin } } })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
}
