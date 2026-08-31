import express from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissionsToRole
} from '../Controllers/role.controller';
import authenticateToken from '../middlewares/authMiddleware';
import { requirePermission } from '../middlewares/permissionMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Gestion des rôles utilisateur
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: integer
 *           description: ID unique du rôle
 *         name:
 *           type: string
 *           description: Nom du rôle
 *         description:
 *           type: string
 *           description: Description du rôle
 *         permissions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Permission'
 *         users:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               nom:
 *                 type: string
 *               prenom:
 *                 type: string
 *               email:
 *                 type: string
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Récupérer tous les rôles
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des rôles récupérée avec succès
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
 *                     $ref: '#/components/schemas/Role'
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
// 🔍 LECTURE - Admin et proviseur peuvent voir les rôles
// router.get('/', authenticateToken, requirePermission('role.read'), getAllRoles);
router.get('/', getAllRoles);

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Récupérer un rôle par ID
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rôle
 *     responses:
 *       200:
 *         description: Rôle récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       404:
 *         description: Rôle introuvable
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur serveur
 */
// 🔍 CONSULTATION - Même permissions que la lecture
router.get('/:id', authenticateToken, requirePermission('role.read'), getRoleById);

/**
 * @swagger
 * /roles:
 *   post:
 *     summary: Créer un nouveau rôle
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom du rôle
 *                 example: "TEACHER"
 *               description:
 *                 type: string
 *                 description: Description du rôle
 *                 example: "Professeur ayant accès aux notes et évaluations"
 *     responses:
 *       201:
 *         description: Rôle créé avec succès
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
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Données invalides ou rôle existant
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (admin requis)
 *       500:
 *         description: Erreur serveur
 */
// ➕ CRÉATION - Seul l'admin peut créer des rôles
router.post('/', authenticateToken, requirePermission('role.create'), createRole);

/**
 * @swagger
 * /roles/{id}:
 *   put:
 *     summary: Mettre à jour un rôle
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rôle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom du rôle
 *               description:
 *                 type: string
 *                 description: Description du rôle
 *     responses:
 *       200:
 *         description: Rôle mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Rôle introuvable
 *       500:
 *         description: Erreur serveur
 */
// ✏️ MODIFICATION - Seul l'admin peut modifier les rôles
router.put('/:id', authenticateToken, requirePermission('role.update'), updateRole);

/**
 * @swagger
 * /roles/{id}:
 *   delete:
 *     summary: Supprimer un rôle
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rôle
 *     responses:
 *       200:
 *         description: Rôle supprimé avec succès
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Rôle introuvable
 *       500:
 *         description: Erreur serveur
 */
// 🗑️ SUPPRESSION - Seul l'admin peut supprimer les rôles
router.delete('/:id', authenticateToken, requirePermission('role.delete'), deleteRole);

/**
 * @swagger
 * /roles/{id}/permissions:
 *   post:
 *     summary: Assigner des permissions à un rôle
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID du rôle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionIds
 *             properties:
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Liste des IDs des permissions à assigner
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Permissions assignées avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non autorisé
 *       403:
 *         description: Accès refusé (admin requis)
 *       404:
 *         description: Rôle ou permissions introuvables
 *       500:
 *         description: Erreur serveur
 */
// 🔐 ASSIGNATION PERMISSIONS - Seul l'admin peut assigner des permissions
router.post('/:id/permissions', authenticateToken, requirePermission('role.assign_permissions'), assignPermissionsToRole);

export default router;