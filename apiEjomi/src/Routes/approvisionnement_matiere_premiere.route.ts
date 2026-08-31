import { Router } from 'express';
import { 
  createApprovisionnementMatierePremiere,
  getAllApprovisionnementsMatierePremiere,
  getApprovisionnementMatierePremiereById,
  updateApprovisionnementMatierePremiere,
  deleteApprovisionnementMatierePremiere
} from '../Controllers/approvisionnement_matiere_premiere.controller';
import authenticateToken from '../middlewares/authMiddleware';
import { checkPermission } from '../middlewares/permissionMiddleware';

const router = Router();

router.post('/', authenticateToken, checkPermission('approvisionnement_matiere_premiere.create'), createApprovisionnementMatierePremiere)
      .get('/', authenticateToken, checkPermission('approvisionnement_matiere_premiere.read'), getAllApprovisionnementsMatierePremiere);

router.get('/:id', authenticateToken, checkPermission('approvisionnement_matiere_premiere.read'), getApprovisionnementMatierePremiereById);
router.put('/:id', authenticateToken, checkPermission('approvisionnement_matiere_premiere.update'), updateApprovisionnementMatierePremiere);
router.delete('/:id', authenticateToken, checkPermission('approvisionnement_matiere_premiere.delete'), deleteApprovisionnementMatierePremiere);

export default router;