import { useAuth } from "@/context/auth-provider"

/**
 * Liste complète des permissions du système
 * Alignée avec les permissions du backend (api/prisma/seed.ts)
 */
export type Permission =
  // Utilisateurs
  | "user.read" | "user.create" | "user.update" | "user.delete"
  // Rôles
  | "role.read"
  // Employés
  | "employe.read" | "employe.create" | "employe.update" | "employe.delete" | "employe.export"
  // Fournisseurs
  | "fournisseur.read" | "fournisseur.create" | "fournisseur.update" | "fournisseur.delete"
  // Produits
  | "produit.read" | "produit.create" | "produit.update" | "produit.delete"
  // Commandes
  | "commande.read" | "commande.create" | "commande.update" | "commande.delete"
  // Livraisons
  | "livraison.read" | "livraison.update"
  // Approvisionnements
  | "approvisionnement.read" | "approvisionnement.create" | "approvisionnement.update" | "approvisionnement.delete"
  | "approvisionnement_matiere_premiere.read" | "approvisionnement_matiere_premiere.create" | "approvisionnement_matiere_premiere.update" | "approvisionnement_matiere_premiere.delete"
  // Production
  | "production.read" | "production.create" | "production.delete"
  // Matières premières
  | "matiere_premiere.read" | "matiere_premiere.create" | "matiere_premiere.update" | "matiere_premiere.delete"
  // Absences
  | "absence.read" | "absence.create" | "absence.update" | "absence.delete" | "absence.statistics"
  // Congés
  | "conge.read" | "conge.create" | "conge.update" | "conge.delete" | "conge.approve" | "conge.reject"
  // Salaires
  | "salaire_paiement.read" | "salaire_paiement.create" | "salaire_paiement.delete" | "salaire_paiement.export"
  // Transactions
  | "transaction.read"
  // Inventaire
  | "inventaire.read" | "inventaire.create" | "inventaire.update"
  // Transferts stock
  | "transfert.create"
  // Contact
  | "contact.read" | "contact.update" | "contact.delete"

/**
 * Mapping des rôles vers leurs permissions
 * Basé sur le seed backend
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: ["*"] as any,

  DIRECTEUR_GENERAL: [
    'user.read', 'user.create', 'user.update', 'user.delete',
    'role.read',
    'employe.read', 'employe.create', 'employe.update', 'employe.export',
    'fournisseur.read', 'fournisseur.create', 'fournisseur.update', 'fournisseur.delete',
    'produit.read', 'produit.create', 'produit.update', 'produit.delete',
    'commande.read', 'commande.create', 'commande.update', 'commande.delete',
    'livraison.read', 'livraison.update',
    'approvisionnement.read', 'approvisionnement.create', 'approvisionnement.update', 'approvisionnement.delete',
    'approvisionnement_matiere_premiere.read', 'approvisionnement_matiere_premiere.create', 'approvisionnement_matiere_premiere.update', 'approvisionnement_matiere_premiere.delete',
    'production.read', 'production.create', 'production.delete',
    'matiere_premiere.read', 'matiere_premiere.create', 'matiere_premiere.update', 'matiere_premiere.delete',
    'transaction.read',
    'salaire_paiement.read', 'salaire_paiement.create', 'salaire_paiement.delete', 'salaire_paiement.export',
    'absence.read', 'absence.create', 'absence.update', 'absence.delete', 'absence.statistics',
    'conge.read', 'conge.create', 'conge.update', 'conge.delete', 'conge.approve', 'conge.reject',
    'inventaire.read', 'inventaire.create', 'inventaire.update',
    'transfert.create',
    'contact.read', 'contact.update', 'contact.delete',
  ],

  GERANT: [
    'user.read', 'user.create', 'user.update', 'user.delete',
    'role.read',
    'employe.read', 'employe.create', 'employe.update', 'employe.export',
    'fournisseur.read', 'fournisseur.create', 'fournisseur.update', 'fournisseur.delete',
    'produit.read', 'produit.create', 'produit.update', 'produit.delete',
    'commande.read', 'commande.create', 'commande.update', 'commande.delete',
    'livraison.read', 'livraison.update',
    'approvisionnement.read', 'approvisionnement.create', 'approvisionnement.update', 'approvisionnement.delete',
    'approvisionnement_matiere_premiere.read', 'approvisionnement_matiere_premiere.create', 'approvisionnement_matiere_premiere.update', 'approvisionnement_matiere_premiere.delete',
    'production.read', 'production.create', 'production.delete',
    'matiere_premiere.read', 'matiere_premiere.create', 'matiere_premiere.update', 'matiere_premiere.delete',
    'transaction.read',
    'salaire_paiement.read', 'salaire_paiement.create', 'salaire_paiement.delete', 'salaire_paiement.export',
    'absence.read', 'absence.create', 'absence.update', 'absence.delete', 'absence.statistics',
    'conge.read', 'conge.create', 'conge.update', 'conge.delete', 'conge.approve', 'conge.reject',
    'inventaire.read', 'inventaire.create', 'inventaire.update',
    'transfert.create',
    'contact.read', 'contact.update', 'contact.delete',
  ],

  MAGASINIER: [
    'produit.read', 'produit.create', 'produit.update',
    'fournisseur.read', 'fournisseur.create', 'fournisseur.update',
    'approvisionnement.read', 'approvisionnement.create', 'approvisionnement.update', 'approvisionnement.delete',
    'approvisionnement_matiere_premiere.read', 'approvisionnement_matiere_premiere.create', 'approvisionnement_matiere_premiere.update', 'approvisionnement_matiere_premiere.delete',
    'production.read', 'production.create', 'production.delete',
    'matiere_premiere.read', 'matiere_premiere.create', 'matiere_premiere.update', 'matiere_premiere.delete',
    'livraison.read', 'livraison.update',
    'inventaire.read', 'inventaire.create', 'inventaire.update',
    'transfert.create',
  ],

  VENDEUR: [
    'commande.read', 'commande.create', 'commande.update', 'commande.delete',
    'produit.read',
    'livraison.read', 'livraison.update',
    'user.read', 'user.create', 'user.update',
    'contact.read', 'contact.update', 'contact.delete',
    'inventaire.read', 'inventaire.create', 'inventaire.update',
  ],

  SECRETAIRE: [
    'user.read', 'user.update',
    'employe.read', 'employe.update',
    'fournisseur.read', 'fournisseur.create', 'fournisseur.update',
    'commande.read', 'commande.create', 'commande.update',
    'produit.read',
    'livraison.read',
    'approvisionnement.read',
    'production.read',
    'transaction.read',
    'absence.read', 'absence.create', 'absence.update', 'absence.statistics',
    'conge.read', 'conge.create', 'conge.update', 'conge.approve', 'conge.reject',
  ],

  CLIENT: [
    'produit.read',
    'commande.read', 'commande.create',
  ],
}

/**
 * Hook pour vérifier les permissions de l'utilisateur
 * Utilise en priorité les permissions réelles de l'API (user.role.permissions),
 * avec le mapping statique comme fallback.
 */
export function usePermissions() {
  const { user } = useAuth()
  const userRole = user?.role?.name

  // Permissions réelles venant de l'API (si disponibles)
  const apiPermissions: string[] = (user?.role as any)?.permissions?.map((p: any) => p.key) || []
  const hasApiPermissions = apiPermissions.length > 0

  const hasPermission = (permission: Permission): boolean => {
    if (!userRole) return false

    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return true

    // Utiliser les permissions de l'API si disponibles
    if (hasApiPermissions) {
      return apiPermissions.includes(permission)
    }

    // Fallback sur le mapping statique
    if (userRole === "DIRECTEUR_GENERAL") return true
    const rolePermissions = ROLE_PERMISSIONS[userRole] || []
    return rolePermissions.includes(permission)
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission))
  }

  const getUserPermissions = (): Permission[] => {
    if (!userRole) return []
    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return ["*"] as any
    if (hasApiPermissions) return apiPermissions as Permission[]
    if (userRole === "DIRECTEUR_GENERAL") return ["*"] as any
    return ROLE_PERMISSIONS[userRole] || []
  }

  const isAdmin = (): boolean => {
    return userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "DIRECTEUR_GENERAL"
  }

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserPermissions,
    isAdmin,
    userRole,
  }
}


