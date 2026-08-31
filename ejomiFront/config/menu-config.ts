import {
  BarChart3,
  Package,
  ShoppingBag,
  Users,
  Truck,
  UserCog,
  Home,
  ClipboardList,
  MessageSquare,
  PackageCheck,
  Box,
  Factory,
  Calendar,
  CalendarClock,
  Wallet,
  Shield,
} from "lucide-react"

export interface MenuItem {
  href: string
  label: string
  icon: any
  roles: string[] // Rôles autorisés à voir ce menu
}

/**
 * Configuration complète des menus par rôle
 * Alignée avec le middleware et les permissions backend
 */
export const MENU_ITEMS: MenuItem[] = [
  {
    href: "/",
    label: "Accueil",
    icon: Home,
    roles: ["*"], // Visible par tous
  },

  // === SECTION GERANT ===
  {
    href: "/gerant/dashboard",
    label: "Tableau de bord",
    icon: BarChart3,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "GERANT"],
  },
  {
    href: "/gerant/employes",
    label: "Employés",
    icon: UserCog,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "GERANT", "SECRETAIRE"],
  },
  {
    href: "/gerant/absences",
    label: "Absences",
    icon: CalendarClock,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "GERANT", "SECRETAIRE"],
  },
  {
    href: "/gerant/conges",
    label: "Congés",
    icon: Calendar,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "GERANT", "SECRETAIRE"],
  },
  {
    href: "/gerant/paiements-salaires",
    label: "Paiements Salaires",
    icon: Wallet,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "GERANT"],
  },
  {
    href: "/gerant/contacts",
    label: "Messages",
    icon: MessageSquare,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "GERANT"],
  },
  {
    href: "/roles",
    label: "Rôles & Permissions",
    icon: Shield,
    roles: ["ADMIN"],
  },

  // === SECTION VENDEUR ===
  {
    href: "/vendeur/commandes",
    label: "Commandes",
    icon: ShoppingBag,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "VENDEUR"],
  },
  {
    href: "/vendeur/clients",
    label: "Clients",
    icon: Users,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "VENDEUR"],
  },
  {
    href: "/vendeur/livraisons",
    label: "Livraisons",
    icon: PackageCheck,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "VENDEUR"],
  },

  // === SECTION MAGASINIER ===
  {
    href: "/produits",
    label: "Produits",
    icon: Package,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "MAGASINIER", "VENDEUR"],
  },
  {
    href: "/magasinier/fournisseurs",
    label: "Fournisseurs",
    icon: Truck,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "MAGASINIER"],
  },
  {
    href: "/magasinier/approvisionnements",
    label: "Approvisionnements",
    icon: ShoppingBag,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "MAGASINIER"],
  },
  {
    href: "/magasinier/matieres-premieres",
    label: "Matières premières",
    icon: Box,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "MAGASINIER"],
  },
  {
    href: "/magasinier/matieres-premieres/approvisionnements",
    label: "Approvisionnements MP",
    icon: ClipboardList,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "MAGASINIER"],
  },
  {
    href: "/magasinier/productions",
    label: "Productions",
    icon: Factory,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "MAGASINIER"],
  },
  {
    href: "/magasinier/inventaire",
    label: "Inventaire",
    icon: ClipboardList,
    roles: ["ADMIN", "DIRECTEUR_GENERAL", "MAGASINIER"],
  },
]

/**
 * Filtre les items de menu selon le rôle de l'utilisateur
 */
export function getMenuItemsForRole(userRole: string | undefined): MenuItem[] {
  if (!userRole) {
    // Si pas de rôle, retourner seulement les items publics
    return MENU_ITEMS.filter(item => item.roles.includes("*"))
  }

  return MENU_ITEMS.filter(item => {
    // Si l'item est accessible par tous
    if (item.roles.includes("*")) {
      return true
    }
    // Si le rôle de l'utilisateur est dans la liste des rôles autorisés
    return item.roles.includes(userRole)
  })
}

/**
 * Organise les menus par sections pour un affichage groupé
 */
export interface MenuSection {
  title: string
  items: MenuItem[]
}

export function getMenuSectionsForRole(userRole: string | undefined): MenuSection[] {
  const items = getMenuItemsForRole(userRole)
  const sections: MenuSection[] = []

  // Accueil (toujours en premier)
  const homeItems = items.filter(item => item.href === "/")
  if (homeItems.length > 0) {
    sections.push({ title: "", items: homeItems })
  }

  // Section Administration (Admin uniquement)
  const adminItems = items.filter(item => item.href === "/roles")
  if (adminItems.length > 0) {
    sections.push({ title: "Administration", items: adminItems })
  }

  // Section Gestion (Gérant)
  const gerantItems = items.filter(item => item.href.startsWith("/gerant"))
  if (gerantItems.length > 0) {
    sections.push({ title: "Gestion", items: gerantItems })
  }

  // Section Ventes (Vendeur)
  const vendeurItems = items.filter(item => item.href.startsWith("/vendeur"))
  if (vendeurItems.length > 0) {
    sections.push({ title: "Ventes", items: vendeurItems })
  }

  // Section Stock (Magasinier)
  const magasinierItems = items.filter(item =>
    item.href.startsWith("/magasinier") ||
    (item.href === "/produits" && !item.href.startsWith("/gerant") && !item.href.startsWith("/vendeur"))
  )
  if (magasinierItems.length > 0) {
    sections.push({ title: "Stock & Production", items: magasinierItems })
  }

  return sections
}
