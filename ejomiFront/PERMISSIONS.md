
# Guide d'utilisation du système de permissions

Ce document explique comment utiliser le système de permissions basé sur RBAC (Role-Based Access Control) dans l'application GoldStore.

## Table des matières

1. [Architecture](#architecture)
2. [Composant PermissionGuard](#composant-permissionguard)
3. [Hook usePermissions](#hook-usepermissions)
4. [Permissions disponibles](#permissions-disponibles)
5. [Exemples d'utilisation](#exemples-dutilisation)

## Architecture

Le système de permissions utilise trois couches :

1. **Rôles** : ADMIN, DIRECTEUR_GENERAL, GERANT, MAGASINIER, VENDEUR, SECRETAIRE, CLIENT
2. **Permissions** : Granulaires par entité et action (ex: `produit.read`, `employe.create`)
3. **Guards** : Composants et hooks pour contrôler l'accès

## Composant PermissionGuard

Le composant `PermissionGuard` permet de protéger des sections de l'interface en fonction des permissions de l'utilisateur.

### Props

```typescript
interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: Permission | Permission[];  // Support ancien format
  permissions?: Permission | Permission[]; // Support nouveau format
  requireAll?: boolean;                    // Nécessite toutes les permissions
  fallback?: React.ReactNode;              // Contenu affiché si accès refusé
  redirectTo?: string;                     // Redirection si accès refusé
}
```

### Exemples d'utilisation

#### Protection d'un bouton

```tsx
import { PermissionGuard } from '@/components/permissions/PermissionGuard';

// Bouton visible uniquement si l'utilisateur peut créer des employés
<PermissionGuard permission="employe.create">
  <Button asChild>
    <Link href="/gerant/employes/nouveau">
      <Plus className="mr-2 h-4 w-4" />
      Nouvel employé
    </Link>
  </Button>
</PermissionGuard>
```

#### Protection d'une page entière

```tsx
export default function EmployesPage() {
  return (
    <PermissionGuard
      permissions={["employe.read"]}
      redirectTo="/auth/login"
      fallback={<div>Accès refusé</div>}
    >
      <div className="flex min-h-screen flex-col">
        {/* Contenu de la page */}
      </div>
    </PermissionGuard>
  );
}
```

#### Permissions multiples (au moins une)

```tsx
// L'utilisateur doit avoir AU MOINS UNE des permissions listées
<PermissionGuard permissions={["employe.read", "transaction.read"]}>
  <DashboardWidget />
</PermissionGuard>
```

#### Permissions multiples (toutes requises)

```tsx
// L'utilisateur doit avoir TOUTES les permissions listées
<PermissionGuard
  permissions={["employe.read", "employe.update"]}
  requireAll={true}
>
  <EditEmployeeForm />
</PermissionGuard>
```

## Hook usePermissions

Le hook `usePermissions` permet de vérifier les permissions dans le code JavaScript/TypeScript.

### API

```typescript
const {
  hasPermission,      // (perm: Permission) => boolean
  hasAnyPermission,   // (perms: Permission[]) => boolean
  hasAllPermissions,  // (perms: Permission[]) => boolean
  getUserPermissions, // () => Permission[]
  isAdmin,            // () => boolean
  userRole,           // string | undefined
} = usePermissions();
```

### Exemples d'utilisation

#### Vérification conditionnelle

```tsx
const { hasPermission } = usePermissions();

return (
  <div>
    {hasPermission("approvisionnement.read") && (
      <Button asChild variant="ghost" size="icon">
        <Link href={`/magasinier/approvisionnements/${id}`}>
          <Eye className="h-4 w-4" />
        </Link>
      </Button>
    )}
  </div>
);
```

#### Filtrage dynamique

```tsx
const { hasAnyPermission } = usePermissions();

const menuItems = [
  { href: "/gerant/employes", label: "Employés", permissions: ["employe.read"] },
  { href: "/vendeur/commandes", label: "Commandes", permissions: ["commande.read"] },
];

const visibleItems = menuItems.filter(item =>
  !item.permissions || hasAnyPermission(item.permissions)
);
```

## Permissions disponibles

### Entités et actions

Chaque permission suit le format : `{entité}.{action}`

**Actions disponibles :**
- `read` : Lecture/consultation
- `create` : Création
- `update` : Modification
- `delete` : Suppression
- `export` : Export de données
- `statistics` : Accès aux statistiques
- `validate` : Validation
- `approve` / `reject` : Approbation/rejet (congés)
- `assign` : Assignation (livraisons)

### Liste complète des permissions

**Utilisateurs**
- `user.read`, `user.create`, `user.update`, `user.delete`, `user.archive`

**Rôles**
- `role.read`, `role.create`, `role.update`, `role.delete`, `role.assign_permissions`

**Permissions**
- `permission.read`, `permission.create`, `permission.update`, `permission.delete`

**Employés**
- `employe.read`, `employe.create`, `employe.update`, `employe.delete`, `employe.export`, `employe.statistics`

**Fournisseurs**
- `fournisseur.read`, `fournisseur.create`, `fournisseur.update`, `fournisseur.delete`, `fournisseur.export`

**Produits**
- `produit.read`, `produit.create`, `produit.update`, `produit.delete`, `produit.export`, `produit.statistics`

**Commandes**
- `commande.read`, `commande.create`, `commande.update`, `commande.delete`, `commande.export`, `commande.statistics`, `commande.validate`

**Paiements**
- `paiement.read`, `paiement.create`, `paiement.update`, `paiement.delete`, `paiement.export`, `paiement.statistics`, `paiement.validate`

**Livraisons**
- `livraison.read`, `livraison.create`, `livraison.update`, `livraison.delete`, `livraison.export`, `livraison.assign`

**Approvisionnements**
- `approvisionnement.read`, `approvisionnement.create`, `approvisionnement.update`, `approvisionnement.delete`, `approvisionnement.export`, `approvisionnement.validate`
- `approvisionnement_matiere_premiere.read`, `approvisionnement_matiere_premiere.create`, `approvisionnement_matiere_premiere.update`, `approvisionnement_matiere_premiere.delete`, `approvisionnement_matiere_premiere.export`

**Production**
- `production.read`, `production.create`, `production.update`, `production.delete`, `production.export`, `production.statistics`

**Matières premières**
- `matiere_premiere.read`, `matiere_premiere.create`, `matiere_premiere.update`, `matiere_premiere.delete`, `matiere_premiere.export`

**Absences**
- `absence.read`, `absence.create`, `absence.update`, `absence.delete`, `absence.export`, `absence.statistics`

**Congés**
- `conge.read`, `conge.create`, `conge.update`, `conge.delete`, `conge.approve`, `conge.reject`, `conge.export`

**Salaires**
- `salaire_paiement.read`, `salaire_paiement.create`, `salaire_paiement.update`, `salaire_paiement.delete`, `salaire_paiement.export`

**Transactions**
- `transaction.read`, `transaction.create`, `transaction.update`, `transaction.delete`, `transaction.export`, `transaction.statistics`

**Inventaire**
- `inventaire.read`, `inventaire.create`, `inventaire.update`, `inventaire.statistics`

**Contact**
- `contact.read`, `contact.update`, `contact.delete`

## Permissions par rôle

### ADMIN / DIRECTEUR_GENERAL
Accès complet à toutes les permissions.

### GERANT
Permissions de gestion complète sauf certaines suppressions critiques :
- Gestion des utilisateurs et rôles
- Gestion des employés (lecture, création, modification, export, statistiques)
- Gestion financière complète
- Gestion RH (absences, congés, salaires)
- Accès aux statistiques et exports

### MAGASINIER
Permissions liées à la gestion d'inventaire :
- Produits : lecture, création, modification
- Matières premières : lecture, création, modification
- Approvisionnements : lecture, création, modification
- Production : lecture, création, modification
- Fournisseurs : lecture, création, modification
- Livraisons : lecture, modification, assignation
- Inventaire : lecture, création, modification, statistiques

### VENDEUR
Permissions liées aux ventes :
- Commandes : lecture, création, modification, export, validation
- Produits : lecture
- Paiements : lecture, création, modification
- Livraisons : lecture, création, modification
- Clients (users) : lecture, création, modification, archivage
- Contacts : lecture, modification, suppression
- Inventaire : lecture, création, modification, statistiques

### SECRETAIRE
Permissions administratives limitées :
- Utilisateurs : lecture, modification
- Employés : lecture, modification
- Fournisseurs : lecture, création, modification
- Transactions : lecture, création, modification, export
- Absences : gestion complète
- Congés : gestion complète (y compris approbation/rejet)
- Production : lecture, statistiques

### CLIENT
Permissions minimales pour les clients :
- Produits : lecture
- Commandes : lecture, création (ses propres commandes)
- Paiements : lecture, création

## Bonnes pratiques

1. **Toujours protéger les pages sensibles** avec PermissionGuard au niveau du composant principal
2. **Protéger les boutons d'action** (créer, modifier, supprimer) avec PermissionGuard
3. **Utiliser `requireAll`** lorsque plusieurs permissions sont critiques
4. **Fournir un fallback** ou une redirection pour une meilleure UX
5. **Vérifier les permissions côté serveur** également (ne pas se fier uniquement au frontend)
6. **Utiliser des permissions granulaires** plutôt que de se baser uniquement sur les rôles

## Exemples complets

### Sidebar avec filtrage de permissions

```tsx
const menuItems: MenuItem[] = [
  {
    href: "/gerant/employes",
    label: "Employés",
    icon: <UserCog className="h-5 w-5" />,
    permissions: ["employe.read"],
  },
  // ... autres items
];

const visibleMenuItems = menuItems.filter((item) => {
  if (!item.permissions || item.permissions.length === 0) return true;
  if (item.requireAll) return hasAllPermissions(item.permissions);
  return hasAnyPermission(item.permissions);
});

return (
  <SidebarMenu>
    {visibleMenuItems.map((item) => (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton asChild>
          <Link href={item.href}>
            {item.icon}
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    ))}
  </SidebarMenu>
);
```

### Page avec protection multiple

```tsx
export default function ApprovisionnementsPage() {
  const { hasPermission } = usePermissions();

  return (
    <PermissionGuard
      permissions={["approvisionnement.read"]}
      redirectTo="/auth/login"
    >
      <div className="container py-8">
        <div className="flex justify-between">
          <h1>Approvisionnements</h1>

          <PermissionGuard permission="approvisionnement.create">
            <Button asChild>
              <Link href="/magasinier/approvisionnements/nouveau">
                Nouvel approvisionnement
              </Link>
            </Button>
          </PermissionGuard>
        </div>

        <Table>
          {/* ... */}
          <TableCell>
            {hasPermission("approvisionnement.update") && (
              <Button>Modifier</Button>
            )}
            {hasPermission("approvisionnement.delete") && (
              <Button>Supprimer</Button>
            )}
          </TableCell>
        </Table>
      </div>
    </PermissionGuard>
  );
}
```
