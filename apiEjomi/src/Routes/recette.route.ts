import { Router } from 'express'
import authenticateToken from '../middlewares/authMiddleware.js'
import { requirePermission } from '../middlewares/permissionMiddleware.js'
import { getRecette, upsertIngredient, deleteIngredient, getCapacite, getCapaciteTousPlats } from '../Controllers/recette.controller.js'
import { preparer, getHistorique, getHistoriqueJour } from '../Controllers/preparation.controller.js'

const router = Router()

router.use(authenticateToken)

// Capacité globale tous plats
router.get('/capacite', requirePermission('plat.read'), getCapaciteTousPlats)

// Historique préparations du jour (tous plats)
router.get('/preparations/jour', requirePermission('plat.read'), getHistoriqueJour)

// Recette d'un plat
router.get('/:platId/recette', requirePermission('plat.read'), getRecette)
router.post('/:platId/recette', requirePermission('plat.update'), upsertIngredient)
router.delete('/:platId/recette/:matierePremiereId', requirePermission('plat.update'), deleteIngredient)
router.get('/:platId/capacite', requirePermission('plat.read'), getCapacite)

// Préparations d'un plat
router.post('/:platId/preparer', requirePermission('plat.read'), preparer)
router.get('/:platId/preparations', requirePermission('plat.read'), getHistorique)

export default router
