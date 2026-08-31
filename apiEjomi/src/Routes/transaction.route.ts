import { Router } from 'express';
import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionsByType,
  getTransactionsByDateRange,
  getTransactionStatistics
} from '../Controllers/transaction.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import { requireTransactionPermissions } from '../middlewares/permissionMiddleware.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// Routes pour les transactions
router.get('/', requireTransactionPermissions.read, getAllTransactions);
router.get('/statistics', requireTransactionPermissions.statistics, getTransactionStatistics);
router.get('/type/:type', requireTransactionPermissions.read, getTransactionsByType);
router.get('/date-range', requireTransactionPermissions.read, getTransactionsByDateRange);
router.get('/:id', requireTransactionPermissions.read, getTransactionById);

router.post('/', requireTransactionPermissions.create, createTransaction);

router.put('/:id', requireTransactionPermissions.update, updateTransaction);

router.delete('/:id', requireTransactionPermissions.delete, deleteTransaction);

export default router;