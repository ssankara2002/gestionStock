import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js'
import recetteService from '../Services/recette.service.js'

const prisma = new PrismaClient()

// Vérifie que le plat appartient à l'entreprise de l'utilisateur
const checkPlatEntreprise = async (platId: number, entrepriseId?: number): Promise<boolean> => {
  if (!entrepriseId) return true // SUPER_ADMIN : pas de restriction
  const plat = await prisma.plat.findUnique({ where: { id: platId }, select: { entrepriseId: true } })
  return plat?.entrepriseId === entrepriseId
}

export const getRecette = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const platId = parseInt(req.params.platId)
    const entrepriseId = req.user?.entrepriseId
    if (!(await checkPlatEntreprise(platId, entrepriseId))) {
      res.status(403).json({ success: false, message: 'Accès interdit' })
      return
    }
    const recette = await recetteService.getRecetteByPlat(platId)
    res.json({ success: true, data: recette })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
}

export const upsertIngredient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const platId = parseInt(req.params.platId)
    const entrepriseId = req.user?.entrepriseId
    if (!(await checkPlatEntreprise(platId, entrepriseId))) {
      res.status(403).json({ success: false, message: 'Accès interdit' })
      return
    }
    const { matierePremiereId, quantiteParPortion, unite } = req.body
    if (!matierePremiereId || !quantiteParPortion) {
      res.status(400).json({ success: false, message: 'matierePremiereId et quantiteParPortion requis' })
      return
    }
    const result = await recetteService.upsertIngredient(platId, parseInt(matierePremiereId), parseFloat(quantiteParPortion), unite || 'g')
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
}

export const deleteIngredient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const platId = parseInt(req.params.platId)
    const entrepriseId = req.user?.entrepriseId
    if (!(await checkPlatEntreprise(platId, entrepriseId))) {
      res.status(403).json({ success: false, message: 'Accès interdit' })
      return
    }
    const matierePremiereId = parseInt(req.params.matierePremiereId)
    await recetteService.deleteIngredient(platId, matierePremiereId)
    res.json({ success: true, message: 'Ingrédient supprimé' })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
}

export const getCapacite = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const platId = parseInt(req.params.platId)
    const entrepriseId = req.user?.entrepriseId
    if (!(await checkPlatEntreprise(platId, entrepriseId))) {
      res.status(403).json({ success: false, message: 'Accès interdit' })
      return
    }
    const result = await recetteService.getCapaciteProduction(platId)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
}

export const getCapaciteTousPlats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entrepriseId = req.user?.entrepriseId
    const result = await recetteService.getCapaciteTousPlats(entrepriseId)
    res.json({ success: true, data: result })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
}
