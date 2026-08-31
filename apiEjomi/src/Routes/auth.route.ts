import express, { Request, Response, NextFunction } from 'express';
import authService from '../Services/auth.service';
import {
  loginController,
  registerController,
  registerEntrepriseController,
  forgotPasswordController,
  resetPasswordController,
} from '../Controllers/auth.controller';
import authenticateToken, { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/permissionMiddleware'; // Importer le middleware admin
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient(); 


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentification
 *   description: Gestion de l'authentification des utilisateurs
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     description: |
 *       Cette route permet l'inscription d'un nouvel utilisateur.
 *       - Si aucun utilisateur n'existe dans le système, l'inscription est libre (premier admin)
 *       - Sinon, l'authentification et le rôle admin sont requis
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nom
 *               - prenom
 *               - email
 *               - password
 *             properties:
 *               nom:
 *                 type: string
 *                 description: Nom de famille de l'utilisateur
 *                 example: "Doe"
 *               prenom:
 *                 type: string
 *                 description: Prénom de l'utilisateur
 *                 example: "John"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email unique de l'utilisateur
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: Mot de passe (minimum 6 caractères)
 *                 example: "motdepasse123"
 *               adresse:
 *                 type: string
 *                 description: Adresse physique (optionnel)
 *                 example: "123 Rue de la Paix"
 *               phone:
 *                 type: string
 *                 description: Numéro de téléphone (optionnel)
 *                 example: "+33123456789"
 *     responses:
 *       201:
 *         description: Utilisateur inscrit avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Utilisateur enregistré avec succès"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     nom:
 *                       type: string
 *                       example: "Doe"
 *                     prenom:
 *                       type: string
 *                       example: "John"
 *                     role:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "ADMIN"
 *       400:
 *         description: Erreur de validation ou email déjà utilisé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email et mot de passe, nom et prénom sont requis."
 *       401:
 *         description: Non autorisé (token manquant ou invalide) - uniquement si des utilisateurs existent déjà
 *       403:
 *         description: Accès refusé (rôle non admin) - uniquement si des utilisateurs existent déjà
 *       500:
 *         description: Erreur interne du serveur
 */



router.post(
  '/register',
  registerController                  // Utiliser le contrôleur extrait
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     description: Authentifie un utilisateur avec son email et mot de passe
 *     tags: [Authentification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *                 example: "admin@test.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mot de passe de l'utilisateur
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT d'authentification
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   description: Informations de l'utilisateur connecté (sans mot de passe)
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: "admin@test.com"
 *                     nom:
 *                       type: string
 *                       example: "Admin"
 *                     prenom:
 *                       type: string
 *                       example: "System"
 *                     role:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         name:
 *                           type: string
 *                           example: "ADMIN"
 *       400:
 *         description: Paramètres manquants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email et mot de passe sont requis."
 *       401:
 *         description: Identifiants invalides
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Identifiants invalides."
 *       403:
 *         description: Compte archivé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Votre compte est archivé et ne peut plus être utilisé. Veuillez contacter l'administrateur."
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/login', loginController);
router.post('/register-entreprise', registerEntrepriseController);
router.post('/forgot-password', forgotPasswordController);
router.post('/reset-password', resetPasswordController);

export default router;
