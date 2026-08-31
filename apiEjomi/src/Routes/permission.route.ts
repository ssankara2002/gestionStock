import express from 'express';
import {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission
} from '../Controllers/permission.controller';
import authenticateToken from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/permissionMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Gestion des permissions du système
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Permission:
 *       type: object
 *       required:
 *         - key
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unique de la permission
 *         key:
 *           type: string
 *           description: "Clé unique de la permission (ex: user.read, note.create)"
 *         description:
 *           type: string
 *           description: Description de la permission
 *         roles:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               name:
 *                 type: string
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Récupérer toutes les permissions
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des permissions récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permission'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
// 🔍 LECTURE - Admin et proviseur peuvent voir les permissions
router.get('/', authenticateToken, requirePermission('permission.read'), getAllPermissions);

/**
 * @swagger
 * /permissions/{id}:
 *   get:
 *     summary: Récupérer une permission par ID
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la permission
 *     responses:
 *       200:
 *         description: Permission récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       404:
 *         description: Permission introuvable
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
// 🔍 CONSULTATION - Même permissions que la lecture
router.get('/:id', authenticateToken, requirePermission('permission.read'), getPermissionById);

/**
 * @swagger
 * /permissions:
 *   post:
 *     summary: Créer une nouvelle permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *             properties:
 *               key:
 *                 type: string
 *                 description: Clé unique de la permission
 *                 example: "eleve.read"
 *               description:
 *                 type: string
 *                 description: Description de la permission
 *                 example: "Permet de lire les informations des élèves"
 *     responses:
 *       201:
 *         description: Permission créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       400:
 *         description: Données invalides ou permission existante
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (admin requis)
 *       500:
 *         description: Erreur serveur
 */
// ➕ CRÉATION - Seul l'admin peut créer des permissions
router.post('/', authenticateToken, requirePermission('permission.create'), createPermission);

/**
 * @swagger
 * /permissions/{id}:
 *   put:
 *     summary: Mettre à jour une permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la permission
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *                 description: Clé unique de la permission
 *               description:
 *                 type: string
 *                 description: Description de la permission
 *     responses:
 *       200:
 *         description: Permission mise à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Permission introuvable
 *       500:
 *         description: Erreur serveur
 */
// ✏️ MODIFICATION - Seul l'admin peut modifier les permissions
router.put('/:id', authenticateToken, requirePermission('permission.update'), updatePermission);

/**
 * @swagger
 * /permissions/{id}:
 *   delete:
 *     summary: Supprimer une permission
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la permission
 *     responses:
 *       200:
 *         description: Permission supprimée avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Permission introuvable
 *       500:
 *         description: Erreur serveur
 */
// 🗑️ SUPPRESSION - Seul l'admin peut supprimer les permissions
router.delete('/:id', authenticateToken, requirePermission('permission.delete'), deletePermission);

export default router;