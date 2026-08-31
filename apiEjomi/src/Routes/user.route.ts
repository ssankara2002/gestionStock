import express from 'express';
import {
  createUserController,
  getAllUsersController,
  getUserByIdController,
  updateUserController,
  deleteUserController,
  getOrCreateClientAnonyme,
  uploadPhotoProfil,
} from '../Controllers/user.controller.js';
import authenticateToken from '../middlewares/authMiddleware.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

// Route pour récupérer tous les utilisateurs
router.get('/', authenticateToken, getAllUsersController);

// Route pour obtenir (ou créer) le client anonyme
router.get('/client-anonyme', authenticateToken, getOrCreateClientAnonyme);

// Route pour récupérer un utilisateur par ID
router.get('/:id', authenticateToken, getUserByIdController);

// Route pour créer un nouvel utilisateur (client)
router.post('/', authenticateToken, createUserController);

// Route pour mettre à jour un utilisateur
router.put('/:id', authenticateToken, updateUserController);

// Route pour uploader la photo de profil
router.post('/:id/photo', authenticateToken, upload.single('photo'), uploadPhotoProfil);

// Route pour supprimer un utilisateur
router.delete('/:id', authenticateToken, deleteUserController);

export default router;