import { Router } from "express"
import {
  getAllConges,
  getCongeById,
  createConge,
  updateConge,
  deleteConge,
  getCongesByEmploye,
  getCongesByStatut,
  approveConge,
  rejectConge,
  getCongesByDateRange,
  getCongeStatistics,
} from "../Controllers/conge.controller"
import authenticateToken from "../middlewares/authMiddleware"
import { checkPermission } from "../middlewares/permissionMiddleware"

const router = Router()

// Appliquer l'authentification à toutes les routes de congés
router.use(authenticateToken)

router.get("/", checkPermission("conge.read"), getAllConges)
router.post("/", checkPermission("conge.create"), createConge)
router.get("/stats", checkPermission("conge.read"), getCongeStatistics)
router.get("/date-range", checkPermission("conge.read"), getCongesByDateRange)
router.get("/employe/:employeId", checkPermission("conge.read"), getCongesByEmploye)
router.get("/statut/:statut", checkPermission("conge.read"), getCongesByStatut)
router.get("/:id", checkPermission("conge.read"), getCongeById)
router.put("/:id", checkPermission("conge.update"), updateConge)
router.delete("/:id", checkPermission("conge.delete"), deleteConge)

router.put("/:id/approuver", checkPermission("conge.approve"), approveConge)
router.put("/:id/refuser", checkPermission("conge.reject"), rejectConge)

export default router