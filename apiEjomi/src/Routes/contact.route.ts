import { Router } from 'express';
import {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStatistics,
  getContactsByStatut,
} from '../Controllers/contact.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requirePermission } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Route publique pour envoyer un message de contact (pas d'authentification requise)
router.post('/', createContact);

// Routes protégées (admin uniquement)
router.get('/', authenticateToken, requirePermission('contact.read'), getAllContacts);
router.get('/statistics', authenticateToken, requirePermission('contact.read'), getContactStatistics);
router.get('/statut/:statut', authenticateToken, requirePermission('contact.read'), getContactsByStatut);
router.get('/:id', authenticateToken, requirePermission('contact.read'), getContactById);
router.put('/:id', authenticateToken, requirePermission('contact.update'), updateContact);
router.delete('/:id', authenticateToken, requirePermission('contact.delete'), deleteContact);

export default router;
