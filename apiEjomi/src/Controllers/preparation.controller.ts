import { Response } from 'express'
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js'
import preparationService from '../Services/preparation.service.js'

export const creerPreparation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const platId = parseInt(req.params.platId)
    const { nombrePortions, lignes, note } = req.body
    const entrepriseId = req.user?.entrepriseId

    if (!platId || !lignes || !Array.isArray(lignes) || lignes.length === 0) {
      res.status(400).json({ success: false, message: 'platId et lignes[] requis' })
      return
    }

    const preparation = await preparationService.creerPreparation(
      platId, parseInt(nombrePortions) || 1, lignes, note, entrepriseId,
    )
    res.status(201).json({ success: true, data: preparation })
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message })
  }
}

export const getPreparationById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const entrepriseId = req.user?.entrepriseId
    const data = await preparationService.getById(id, entrepriseId)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(404).json({ success: false, message: e.message })
  }
}

export const modifierPreparation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const { nombrePortions, lignes, note } = req.body
    const entrepriseId = req.user?.entrepriseId

    if (!lignes || !Array.isArray(lignes) || lignes.length === 0) {
      res.status(400).json({ success: false, message: 'lignes[] requis' })
      return
    }

    const data = await preparationService.modifierPreparation(
      id, parseInt(nombrePortions) || 1, lignes, note, entrepriseId,
    )
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message })
  }
}

export const supprimerPreparation = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id)
    const entrepriseId = req.user?.entrepriseId
    await preparationService.supprimerPreparation(id, entrepriseId)
    res.json({ success: true, message: 'Préparation supprimée et stock restauré' })
  } catch (e: any) {
    res.status(400).json({ success: false, message: e.message })
  }
}

export const getHistorique = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const platId = req.params.platId ? parseInt(req.params.platId) : undefined
    const entrepriseId = req.user?.entrepriseId
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50
    const data = await preparationService.getHistorique(platId, entrepriseId, limit)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
}

export const getHistoriqueJour = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entrepriseId = req.user?.entrepriseId
    const data = await preparationService.getHistoriqueJour(entrepriseId)
    res.json({ success: true, data })
  } catch (e: any) {
    res.status(500).json({ success: false, message: e.message })
  }
}
