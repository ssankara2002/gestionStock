import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from './authMiddleware.js';

const prisma = new PrismaClient();

interface RequirePermissionOptions {
  permissions: string[];
  requireAll?: boolean; // Si true, toutes les permissions sont requises. Si false, une seule suffit
}

export const requirePermission = (options: RequirePermissionOptions | string | string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.roleId) {
        res.status(403).json({
          message: 'Accès refusé : Utilisateur non authentifié ou sans rôle'
        });
        return;
      }

      // Normaliser les options
      let permissionsRequired: string[];
      let requireAll = false;

      if (typeof options === 'string') {
        permissionsRequired = [options];
      } else if (Array.isArray(options)) {
        permissionsRequired = options;
      } else {
        permissionsRequired = options.permissions;
        requireAll = options.requireAll || false;
      }

      // Récupérer les permissions de l'utilisateur via son rôle
      const userRole = await prisma.role.findUnique({
        where: { id: req.user.roleId },
        include: {
          permissions: true
        }
      });

      if (!userRole) {
        res.status(403).json({
          message: 'Accès refusé : Rôle non trouvé'
        });
        return;
      }

      // Si l'utilisateur est admin, lui donner accès à tout (uniquement ADMIN, pas les autres rôles)
      const isAdmin = userRole.name === 'SUPER_ADMIN' || userRole.name === 'ADMIN' || userRole.id === 1;

      if (isAdmin) {
        console.log(`✅ Accès admin accordé (bypass) pour le rôle: ${userRole.name}`);
        next();
        return;
      }

      const userPermissions = userRole.permissions.map(p => p.key);

      console.log(`🔍 Vérification permissions pour rôle: ${userRole.name}`);
      console.log(`📋 Permissions requises:`, permissionsRequired);
      console.log(`👤 Permissions utilisateur (${userPermissions.length}):`, userPermissions);

      // Vérifier les permissions
      const hasPermission = requireAll
        ? permissionsRequired.every(permission => userPermissions.includes(permission))
        : permissionsRequired.some(permission => userPermissions.includes(permission));

      if (!hasPermission) {
        console.log(`❌ Accès refusé pour ${userRole.name} - Permissions manquantes`);
        res.status(403).json({
          message: 'Accès refusé : Permissions insuffisantes',
          required: permissionsRequired,
          userPermissions: userPermissions,
          role: userRole.name
        });
        return;
      }

      console.log(`✅ Accès accordé pour ${userRole.name}`);
      next();
    } catch (error) {
      console.error('Erreur dans le middleware de permissions:', error);
      res.status(500).json({
        message: 'Erreur interne du serveur lors de la vérification des permissions'
      });
    }
  };
};

// Middleware pour vérifier si l'utilisateur est admin
export const requireAdmin = requirePermission(['user.delete', 'role.create', 'permission.create']);

// Middlewares spécifiques pour les différentes entités
export const requireUserPermissions = {
  read: requirePermission('user.read'),
  create: requirePermission('user.create'),
  update: requirePermission('user.update'),
  delete: requirePermission('user.delete'),
  archive: requirePermission('user.archive')
};

export const requireEmployePermissions = {
  read: requirePermission('employe.read'),
  create: requirePermission('employe.create'),
  update: requirePermission('employe.update'),
  delete: requirePermission('employe.delete'),
  export: requirePermission('employe.export'),
  statistics: requirePermission('employe.statistics')
};

export const requireFournisseurPermissions = {
  read: requirePermission('fournisseur.read'),
  create: requirePermission('fournisseur.create'),
  update: requirePermission('fournisseur.update'),
  delete: requirePermission('fournisseur.delete'),
  export: requirePermission('fournisseur.export')
};

export const requireProduitPermissions = {
  read: requirePermission('produit.read'),
  create: requirePermission('produit.create'),
  update: requirePermission('produit.update'),
  delete: requirePermission('produit.delete'),
  export: requirePermission('produit.export'),
  statistics: requirePermission('produit.statistics')
};

export const requireCommandePermissions = {
  read: requirePermission('commande.read'),
  create: requirePermission('commande.create'),
  update: requirePermission('commande.update'),
  delete: requirePermission('commande.delete'),
  export: requirePermission('commande.export'),
  statistics: requirePermission('commande.statistics'),
  validate: requirePermission('commande.validate')
};

export const requirePaiementPermissions = {
  read: requirePermission('paiement.read'),
  create: requirePermission('paiement.create'),
  update: requirePermission('paiement.update'),
  delete: requirePermission('paiement.delete'),
  export: requirePermission('paiement.export'),
  statistics: requirePermission('paiement.statistics'),
  validate: requirePermission('paiement.validate')
};

export const requireLivraisonPermissions = {
  read: requirePermission('livraison.read'),
  create: requirePermission('livraison.create'),
  update: requirePermission('livraison.update'),
  delete: requirePermission('livraison.delete'),
  export: requirePermission('livraison.export'),
  assign: requirePermission('livraison.assign')
};

export const requireApprovisionnementPermissions = {
  read: requirePermission('approvisionnement.read'),
  create: requirePermission('approvisionnement.create'),
  update: requirePermission('approvisionnement.update'),
  delete: requirePermission('approvisionnement.delete'),
  export: requirePermission('approvisionnement.export'),
  validate: requirePermission('approvisionnement.validate')
};

export const requireProductionPermissions = {
  read: requirePermission('production.read'),
  create: requirePermission('production.create'),
  update: requirePermission('production.update'),
  delete: requirePermission('production.delete'),
  export: requirePermission('production.export'),
  statistics: requirePermission('production.statistics')
};

export const requireMatierePremierePermissions = {
  read: requirePermission('matiere_premiere.read'),
  create: requirePermission('matiere_premiere.create'),
  update: requirePermission('matiere_premiere.update'),
  delete: requirePermission('matiere_premiere.delete'),
  export: requirePermission('matiere_premiere.export')
};

export const requireAbsencePermissions = {
  read: requirePermission('absence.read'),
  create: requirePermission('absence.create'),
  update: requirePermission('absence.update'),
  delete: requirePermission('absence.delete'),
  export: requirePermission('absence.export'),
  statistics: requirePermission('absence.statistics')
};

export const requireCongePermissions = {
  read: requirePermission('conge.read'),
  create: requirePermission('conge.create'),
  update: requirePermission('conge.update'),
  delete: requirePermission('conge.delete'),
  approve: requirePermission('conge.approve'),
  reject: requirePermission('conge.reject'),
  export: requirePermission('conge.export')
};

export const requireSalairePaiementPermissions = {
  read: requirePermission('salaire_paiement.read'),
  create: requirePermission('salaire_paiement.create'),
  update: requirePermission('salaire_paiement.update'),
  delete: requirePermission('salaire_paiement.delete'),
  export: requirePermission('salaire_paiement.export')
};

export const requireTransactionPermissions = {
  read: requirePermission('transaction.read'),
  create: requirePermission('transaction.create'),
  update: requirePermission('transaction.update'),
  delete: requirePermission('transaction.delete'),
  export: requirePermission('transaction.export'),
  statistics: requirePermission('transaction.statistics')
};

export default requirePermission;

export const checkPermission = requirePermission;