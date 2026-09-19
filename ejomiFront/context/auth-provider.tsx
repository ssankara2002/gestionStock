"use client"

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { jwtDecode, type JwtPayload } from "jwt-decode"
import { authService } from "@/services"
import apiClient from "@/services/api-client"
import { entrepriseService } from "@/services/entreprise-service"

export interface User {
  id: number
  nom?: string
  prenom?: string
  email?: string | null
  adresse?: string
  tel?: string
  image?: string | null
  entrepriseId?: number
  role?: {
    id?: number
    name?: string
    description?: string | null
  }
  employe?: {
    id?: number
  }
}

export interface Entreprise {
  id: number
  nom: string
  logo?: string | null
  adresse?: string | null
  tel?: string | null
  email?: string | null
}

interface UserJwtPayload extends JwtPayload {
  userId: number
  email: string
  role: string
  entrepriseId?: number
}

interface AuthContextType {
  user: User | null
  entreprise: Entreprise | null
  loading: boolean
  login: (email: string, password: string, entrepriseId?: number) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const loadEntreprise = useCallback(async (entrepriseId: number) => {
    try {
      const res = await entrepriseService.getById(entrepriseId)
      const data = res.data?.data || res.data
      setEntreprise({ id: data.id, nom: data.nom, logo: data.logo, adresse: data.adresse, tel: data.tel, email: data.email })
    } catch {
      setEntreprise(null)
    }
  }, [])

  const handleAuthChange = useCallback((token: string | null) => {
    if (token) {
      try {
        const decoded = jwtDecode<UserJwtPayload>(token)

        // Vérifier si le token est expiré
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.log("Token expiré, nettoyage de la session...")
          localStorage.removeItem("token")
          localStorage.removeItem("user")
          delete apiClient.defaults.headers.common["Authorization"]
          setUser(null)
          setLoading(false)
          return
        }

        // Tenter de récupérer les données complètes de l'utilisateur depuis localStorage
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        } else {
          // Fallback: créer un objet utilisateur minimal depuis le JWT
          setUser({
            id: decoded.userId,
            email: decoded.email,
            role: { name: decoded.role },
          } as User)
        }

        apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`
      } catch (error) {
        console.error("Token invalide, déconnexion.", error)
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        delete apiClient.defaults.headers.common["Authorization"]
        setUser(null)
      }
    } else {
      // Pas de token, s'assurer que l'état est propre
      delete apiClient.defaults.headers.common["Authorization"]
      setUser(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem("token")
    handleAuthChange(token)
    const entrepriseId = localStorage.getItem("entrepriseId")
    if (entrepriseId) loadEntreprise(parseInt(entrepriseId))
  }, [handleAuthChange, loadEntreprise])

  const login = async (email: string, password: string, entrepriseId?: number) => {
    try {
      const response = await authService.login({ email, password, ...(entrepriseId ? { entrepriseId } : {}) })
      console.log("Response complète:", response)
      console.log("Response.data:", response.data)

      // L'API retourne directement {user, token} dans response.data
      const { token, user: loggedInUser } = response.data as { token: string; user: User }

      if (!token) {
        throw new Error("Token manquant dans la réponse")
      }

      if (!loggedInUser) {
        throw new Error("Données utilisateur manquantes dans la réponse")
      }

      console.log("User reçu:", loggedInUser)
      console.log("Role de l'user:", loggedInUser.role)

      localStorage.setItem("token", token)
      // Stocker également les données complètes de l'utilisateur incluant employe
      localStorage.setItem("user", JSON.stringify(loggedInUser))

      // Mettre à jour le cookie pour le middleware
      document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`

      // Stocker entrepriseId
      if (loggedInUser?.entrepriseId) {
        localStorage.setItem("entrepriseId", String(loggedInUser.entrepriseId))
        loadEntreprise(loggedInUser.entrepriseId)
      }

      handleAuthChange(token) // Centralise la logique de mise à jour

      // Mettre à jour l'état utilisateur avec les données complètes
      setUser(loggedInUser)

      // Redirection après connexion selon le rôle
      const userRole = loggedInUser?.role?.name || "CLIENT"

      switch (userRole) {
        case "SUPER_ADMIN":
        case "ADMIN":
        case "DIRECTEUR_GENERAL":
          router.push("/gerant/dashboard") // Accès complet
          break
        case "GERANT":
          router.push("/gerant/dashboard")
          break
        case "MAGASINIER":
          router.push("/magasinier/approvisionnements")
          break
        case "VENDEUR":
          router.push("/vendeur/commandes")
          break
        case "SECRETAIRE":
          router.push("/gerant/employes")
          break
        case "CLIENT":
        default:
          router.push("/") // Page d'accueil pour les clients
          break
      }
    } catch (error) {
      console.error("Échec de la connexion:", error)
      // Propager l'erreur pour que le formulaire puisse l'afficher
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    localStorage.removeItem("entrepriseId")
    setEntreprise(null)
    handleAuthChange(null)
    router.push("/auth/login")
  }

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      let userId = user?.id
      if (!userId) {
        const decoded = jwtDecode<UserJwtPayload>(token)
        userId = decoded.userId
      }
      if (!userId) return

      const response = await apiClient.get(`/users/${userId}`)
      const updatedUser = response.data?.data || response.data
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
    } catch (error) {
      console.error("Erreur lors du rafraîchissement du profil:", error)
    }
  }

  const value = useMemo(() => ({
    user,
    entreprise,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshUser,
  }), [user, entreprise, loading]);

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider")
  }
  return context
}

export default AuthProvider