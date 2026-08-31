import { Router } from "express"
import {
  getAllPaiements,
  getPaiementsByEmploye,
  createPaiement,
  deletePaiement,
  downloadBulletinPaie,
} from "../Controllers/salaire-paiement.controller"
import authenticateToken from '../middlewares/authMiddleware.js';
import { checkPermission } from "../middlewares/permissionMiddleware"

const router = Router()

router.use(authenticateToken)

router.get("/", checkPermission("salaire_paiement.read"), getAllPaiements)
router.post("/", checkPermission("salaire_paiement.create"), createPaiement)
router.get("/employe/:employeId", checkPermission("salaire_paiement.read"), getPaiementsByEmploye)
router.get("/:id/download-bulletin", checkPermission("salaire_paiement.read"), downloadBulletinPaie)
router.delete("/:id", checkPermission("salaire_paiement.delete"), deletePaiement)

export default router