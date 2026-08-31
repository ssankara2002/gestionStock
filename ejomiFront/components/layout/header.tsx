"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { User, LogOut, Package, UserCog, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/context/auth-provider"
import { useCart } from "@/context/cart-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header({ showSidebar = false }: { showSidebar?: boolean }) {
  const { user, logout, isAuthenticated } = useAuth()
  const { totalItems } = useCart()
  const isMobile = useIsMobile()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:3002'

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary p-1.5">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <span className="font-playfair text-2xl font-bold text-primary">GoldTech</span>
              </div>
            </Link>
          </div>
        </div>
      </header>
    )
  }

  const avatarSmall = user?.image ? (
    <Image
      src={`${baseUrl}/uploads/${user.image}`}
      alt="avatar"
      width={32}
      height={32}
      className="rounded-full object-cover w-full h-full"
    />
  ) : (
    <span>{user?.nom ? user.nom.charAt(0).toUpperCase() : <User className="h-5 w-5" />}</span>
  )

  const avatarLarge = user?.image ? (
    <Image
      src={`${baseUrl}/uploads/${user.image}`}
      alt="avatar"
      width={40}
      height={40}
      className="rounded-full object-cover w-full h-full"
    />
  ) : (
    <span>{user?.nom ? user.nom.charAt(0).toUpperCase() : <User className="h-6 w-6" />}</span>
  )

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showSidebar && (isMobile ? (
            <SidebarTrigger className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-input bg-background text-sm font-medium hover:bg-accent">
              <Menu className="h-4 w-4" />
              <span>Menu</span>
            </SidebarTrigger>
          ) : (
            <SidebarTrigger className="h-8 w-8" />
          ))}
          <Link href="/" className="flex items-center gap-2">
            <div className="rounded-full bg-primary p-1.5">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="font-playfair text-xl font-bold text-primary hidden sm:block">GoldTech</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {/* Panier commenté */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <div className="h-8 w-8 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white text-sm font-bold">
                    {avatarSmall}
                  </div>
                  <span className="sr-only">Menu utilisateur</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center gap-2 p-2">
                  <div className="h-10 w-10 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {avatarLarge}
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium">{user ? `${user.prenom} ${user.nom}` : "Utilisateur"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email || "email@example.com"}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profil" className="flex items-center cursor-pointer">
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Mon Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
                <Link href="/auth/register">Inscription</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/login">Connexion</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
