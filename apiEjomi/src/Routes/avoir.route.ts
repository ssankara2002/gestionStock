import { Router } from 'express';
import {
  createAvoir,
  getAllAvoirs,
  getAvoirById,
  getAvoirsByCommande,
  consommerMonnaie,
  recupererGarde,
  rembourserCredit,
  deleteAvoir,
  generateAvoirPdf,
} from '../Controllers/avoir.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireAvoirPermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

router.use(authenticateToken);

router.get('/', requireAvoirPermissions.read, getAllAvoirs);
router.get('/recu', requireAvoirPermissions.export, generateAvoirPdf);
router.get('/commande/:commandeId', requireAvoirPermissions.read, getAvoirsByCommande);
router.get('/:id', requireAvoirPermissions.read, getAvoirById);

router.post('/', requireAvoirPermissions.create, createAvoir);
router.patch('/:id/rembourser', requireAvoirPermissions.create, rembourserCredit);
router.patch('/:id/consommer', requireAvoirPermissions.create, consommerMonnaie);
router.patch('/:id/recuperer', requireAvoirPermissions.create, recupererGarde);

router.delete('/:id', requireAvoirPermissions.delete, deleteAvoir);

export default router;
