import { Request, Response } from "express"
import salairePaiementService from "../Services/salaire-paiement.service"
import { AuthenticatedRequest } from "../middlewares/authMiddleware"

export const getAllPaiements = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const paiements = await salairePaiementService.getAll((req as any).user?.entrepriseId)
    res.status(200).json({ success: true, data: paiements })
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message })
  }
}

export const getPaiementsByEmploye = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeId } = req.params
    const paiements = await salairePaiementService.getByEmployeId(Number(employeId))
    res.status(200).json({ success: true, data: paiements })
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message })
  }
}

export const createPaiement = async (req: Request, res: Response): Promise<void> => {
  try {
    const paiement = await salairePaiementService.create(req.body)
    res.status(201).json({ success: true, data: paiement })
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message })
  }
}

export const deletePaiement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    await salairePaiementService.delete(Number(id))
    res.status(200).json({ success: true, message: "Paiement supprimé" })
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Erreur serveur", error: error.message })
  }
}

export const downloadBulletinPaie = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const pdfBuffer = await salairePaiementService.generateBulletinPaiePdf(Number(id))

    if (!pdfBuffer) {
      res.status(404).json({ success: false, message: 'Paiement introuvable' })
      return
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="bulletin-paie-${id}.pdf"`)
    res.setHeader('Content-Length', pdfBuffer.length)
    res.send(pdfBuffer)
  } catch (error: any) {
    console.error('Erreur downloadBulletinPaie', error)
    res.status(500).json({ success: false, message: error.message })
    return
  }
}