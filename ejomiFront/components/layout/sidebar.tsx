"use client"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Package,
  Utensils,
  ShoppingBag,
  Users,
  Truck,
  UserCog,
  Home,
  ChevronRight,
  LogOut,
  ClipboardList,
  MessageSquare,
  PackageCheck,
  Box,
  Factory,
  Calendar,
  CalendarClock,
  Wallet,
  Shield,
  ArrowLeftRight,
  Building2,
  Layers,
  PieChart,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-provider"
import { usePermissions, type Permission } from "@/hooks/usePermissions"

interface MenuItem {
  href: string
  label: string
  icon: React.ReactNode
  permissions?: Permission[]
  requireAll?: boolean
  roles?: string[] // restreindre à certains rôles
}

export function AppSidebar() {
  const pathname = usePathname()
  const { user, entreprise, logout, loading } = useAuth()
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002'

  const menuItems: MenuItem[] = [
    {
      href: "/",
      label: "Accueil",
      icon: <Home className="h-5 w-5" />,
      // Accessible à tous
    },
    {
      href: "/gerant/dashboard",
      label: "Tableau de bord",
      icon: <BarChart3 className="h-5 w-5" />,
      permissions: ["employe.read", "transaction.read"],
      requireAll: true,
    },
    {
      href: "/gerant/bilan",
      label: "Bilan financier",
      icon: <PieChart className="h-5 w-5" />,
      permissions: ["transaction.read"],
    },
    {
      href: "/vendeur/commandes",
      label: "Ventes",
      icon: <ShoppingBag className="h-5 w-5" />,
      permissions: ["commande.read"],
    },
    // {
    //   href: "/vendeur/livraisons",
    //   label: "Livraisons",
    //   icon: <PackageCheck className="h-5 w-5" />,
    //   permissions: ["livraison.read"],
    // },
    
    {
      href: "/vendeur/clients",
      label: "Clients",
      icon: <Users className="h-5 w-5" />,
      permissions: ["user.read"],
    },
    {
      href: "/produits",
      label: "Produits",
      icon: <Package className="h-5 w-5" />,
      permissions: ["produit.read"],
    },
    {
      href: "/plats",
      label: "Plats",
      icon: <Utensils className="h-5 w-5" />,
      permissions: ["plat.read"],
    },
    {
      href: "/magasinier/fournisseurs",
      label: "Fournisseurs",
      icon: <Truck className="h-5 w-5" />,
      permissions: ["fournisseur.read"],
    },
    {
      href: "/gerant/employes",
      label: "Employés",
      icon: <UserCog className="h-5 w-5" />,
      permissions: ["employe.read"],
    },
    {
      href: "/gerant/absences",
      label: "Absences",
      icon: <CalendarClock className="h-5 w-5" />,
      permissions: ["absence.read"],
    },
    {
      href: "/gerant/conges",
      label: "Congés",
      icon: <Calendar className="h-5 w-5" />,
      permissions: ["conge.read"],
    },
    {
      href: "/gerant/paiements-salaires",
      label: "Paiements Salaires",
      icon: <Wallet className="h-5 w-5" />,
      permissions: ["salaire_paiement.read"],
    },
    {
      href: "/magasinier/approvisionnements",
      label: "Approvisionnements",
      icon: <ShoppingBag className="h-5 w-5" />,
      permissions: ["approvisionnement.read"],
    },
    // {
    //   href: "/magasinier/matieres-premieres/approvisionnements",
    //   label: "Approvisionnements MP",
    //   icon: <ClipboardList className="h-5 w-5" />,
    //   permissions: ["approvisionnement_matiere_premiere.read"],
    // },
    // {
    //   href: "/magasinier/matieres-premieres",
    //   label: "Matières premières",
    //   icon: <Box className="h-5 w-5" />,
    //   permissions: ["matiere_premiere.read"],
    // },
    // {
    //   href: "/magasinier/productions",
    //   label: "Productions",
    //   icon: <Factory className="h-5 w-5" />,
    //   permissions: ["production.read"],
    // },
    {
      href: "/magasinier/transferts",
      label: "Transferts",
      icon: <ArrowLeftRight className="h-5 w-5" />,
      permissions: ["transfert.create"],
    },
    {
      href: "/magasinier/rapport-lots",
      label: "Lots de stock",
      icon: <Layers className="h-5 w-5" />,
      permissions: ["produit.read"],
    },
    {
      href: "/magasinier/inventaire",
      label: "Inventaire",
      icon: <ClipboardList className="h-5 w-5" />,
      permissions: ["inventaire.create"],
    },
    {
      href: "/gerant/contacts",
      label: "Messages",
      icon: <MessageSquare className="h-5 w-5" />,
      permissions: ["contact.read"],
    },
    {
      href: "/roles",
      label: "Rôles & Permissions",
      icon: <Shield className="h-5 w-5" />,
      permissions: ["role.read"],
    },
    {
      href: "/super-admin/entreprises",
      label: "Entreprises",
      icon: <Building2 className="h-5 w-5" />,
      roles: ["SUPER_ADMIN"],
    },
  ]

  const userRole = user?.role?.name

  // Filtrer les items en fonction des permissions et rôles
  const visibleMenuItems = menuItems.filter((item) => {
    // Vérification par rôle strict (ex: SUPER_ADMIN uniquement)
    if (item.roles && item.roles.length > 0) {
      return userRole ? item.roles.includes(userRole) : false
    }

    // Si pas de permissions requises, l'item est visible
    if (!item.permissions || item.permissions.length === 0) {
      return true
    }

    // Si requireAll est vrai, vérifier que l'utilisateur a toutes les permissions
    if (item.requireAll) {
      return hasAllPermissions(item.permissions)
    }

    // Sinon, vérifier que l'utilisateur a au moins une permission
    return hasAnyPermission(item.permissions)
  })

  if (loading) return null

  return (
    <Sidebar variant="floating" collapsible="icon">
      <SidebarHeader className="flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center overflow-hidden shrink-0">
            {entreprise?.logo ? (
              <Image
                src={`${baseUrl}/uploads/${entreprise.logo}`}
                alt={entreprise.nom}
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="font-playfair text-sm font-bold text-primary-foreground">
                {entreprise?.nom?.charAt(0)?.toUpperCase() || "E"}
              </span>
            )}
          </div>
          <span className="font-playfair text-xl font-bold text-primary truncate">
            {entreprise?.nom || "Dashboard"}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {visibleMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                <Link href={item.href}>
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4">
        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="font-medium text-primary">{user.nom?.charAt(0) || "U"}</span>
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate font-medium">
                  {user.prenom} {user.nom}
                </p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start bg-transparent" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/auth/login">Connexion</Link>
            </Button>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/auth/register">Inscription</Link>
            </Button>
          </div>
        )}
      </SidebarFooter>
      <SidebarRailComponent />
    </Sidebar>
  )
}

export function SidebarRailComponent() {
  return (
    <div className="absolute inset-y-0 right-0 flex w-2 cursor-ew-resize items-center justify-center border-l bg-border transition-all group-data-[state=collapsed]:w-1">
      <ChevronRight className="h-4 w-4 transition-transform group-data-[state=collapsed]:rotate-180" />
    </div>
  )
}
