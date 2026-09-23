import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_for_dev_only"
const secretKey = new TextEncoder().encode(JWT_SECRET)

interface UserPayload {
  id: number
  role: string
  iat: number
  exp: number
}

// Définition stricte des rôles et leurs accès
const ROLE_ACCESS = {
  SUPER_ADMIN: {
    name: "SUPER_ADMIN",
    allowedPaths: ["*"], // Accès total à toute la plateforme
  },
  ADMIN: {
    name: "ADMIN",
    allowedPaths: ["*"], // Accès à tout
  },
  DIRECTEUR_GENERAL: {
    name: "DIRECTEUR_GENERAL",
    allowedPaths: ["*"], // Accès à tout comme ADMIN
  },
  GERANT: {
    name: "GERANT",
    allowedPaths: [
     "*",
    ],
  },
  MAGASINIER: {
    name: "MAGASINIER",
    allowedPaths: [
      "/magasinier/approvisionnements",
      "/magasinier/fournisseurs",
      "/magasinier/inventaire",
      "/magasinier/matieres-premieres",
      "/magasinier/productions",
      "/magasinier/transferts",
      "/produits",
      "/profil",
    ],
  },
  VENDEUR: {
    name: "VENDEUR",
    allowedPaths: [
      "/vendeur/commandes",
      "/vendeur/clients",
      "/vendeur/livraisons",
      "/produits",
      "/magasinier/inventaire",
      "/gerant/contacts",
      "/profil",
    ],
  },
  CAISSIER: {
    name: "CAISSIER",
    allowedPaths: [
      "/vendeur/commandes",
      "/vendeur/clients",
      "/plats",
      "/magasinier/fournisseurs",
      "/magasinier/approvisionnements",
      "/magasinier/rapport-lots",
      "/produits",
      "/profil",
    ],
  },
  CAISSIERE: {
    name: "CAISSIERE",
    allowedPaths: [
      "/vendeur/commandes",
      "/vendeur/clients",
      "/plats",
      "/magasinier/fournisseurs",
      "/magasinier/approvisionnements",
      "/magasinier/rapport-lots",
      "/produits",
      "/profil",
    ],
  },
  SECRETAIRE: {
    name: "SECRETAIRE",
    allowedPaths: [
      "/gerant/employes",
      "/gerant/absences",
      "/gerant/conges",
      "/vendeur/commandes",
      "/vendeur/clients",
      "/magasinier/fournisseurs",
      "/magasinier/approvisionnements",
      "/magasinier/productions",
      "/gerant/paiements-salaires",
      "/produits",
      "/profil",
    ],
  },
  CLIENT: {
    name: "CLIENT",
    allowedPaths: [
      "/", // Accueil
      "/produits", // Catalogue
      "/panier", // Panier
      "/profil", // Profil
    ],
  },
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Si la requête est pour l'API, on laisse le backend gérer la sécurité
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  // Pages publiques accessibles sans authentification
  const publicPages = [
    "/",
    "/auth/login",
    "/auth/register",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/unauthorized",
    "/about",
    "/a-propos",
    "/contact",
    "/produits-public",
    "/produits", // Catalogue public
  ]

  // Vérifier si c'est une page publique
  const isPublicPage = publicPages.some((path) => pathname === path || pathname.startsWith(path + "/"))

  // Récupérer le token
  const token = request.cookies.get("auth_token")?.value

  // Si c'est une page publique, autoriser l'accès même sans token valide
  if (isPublicPage && !pathname.startsWith("/produits/admin")) {
    // Si pas de token, laisser passer
    if (!token) {
      return NextResponse.next()
    }

    // Si token présent, vérifier sa validité mais ne pas bloquer si invalide
    try {
      await jwtVerify<UserPayload>(token, secretKey)
      return NextResponse.next()
    } catch (error) {
      // Token invalide sur page publique : supprimer le cookie et laisser passer
      console.log(`⚠️ Token invalide sur page publique ${pathname}, suppression du cookie`)
      const response = NextResponse.next()
      response.cookies.set("auth_token", "", { maxAge: -1 })
      return response
    }
  }

  // Pour les pages protégées, le token est obligatoire
  if (!token) {
    console.log(`❌ Pas de token - Redirection vers login depuis: ${pathname}`)
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Vérifier et décoder le token (optionnel - le backend fait la vraie vérification)
  try {
    const { payload } = await jwtVerify<UserPayload>(token, secretKey)
    const userRole = String(payload.role || "").trim().toUpperCase()

    console.log(`🔍 Middleware - Rôle: ${userRole}, Path: ${pathname}`)

    // Vérifier si le rôle existe
    if (!ROLE_ACCESS[userRole as keyof typeof ROLE_ACCESS]) {
      console.log(`❌ Rôle inconnu: ${userRole}`)
      return NextResponse.redirect(new URL("/unauthorized", request.url))
    }

    const roleConfig = ROLE_ACCESS[userRole as keyof typeof ROLE_ACCESS]

    // Si le rôle a accès à tout (*), autoriser
    if (roleConfig.allowedPaths.includes("*")) {
      console.log(`✅ Accès complet pour ${userRole}`)
      return NextResponse.next()
    }

    // Vérifier si le chemin actuel est autorisé pour ce rôle
    const isAllowed = roleConfig.allowedPaths.some((allowedPath) => {
      // Correspondance exacte ou début de chemin
      return pathname === allowedPath || pathname.startsWith(allowedPath + "/")
    })

    if (isAllowed) {
      console.log(`✅ Accès autorisé pour ${userRole} vers ${pathname}`)
      return NextResponse.next()
    }

    // Accès refusé
    console.log(`❌ Accès refusé pour ${userRole} vers ${pathname}`)
    console.log(`   Chemins autorisés:`, roleConfig.allowedPaths)
    return NextResponse.redirect(new URL("/unauthorized", request.url))

  } catch (error) {
    console.error("❌ Token invalide ou JWT_SECRET manquant:", error)
    // Si le JWT_SECRET manque, laisser passer et laisser le backend valider
    if (!process.env.JWT_SECRET) {
      console.log("⚠️ JWT_SECRET manquant - Validation déléguée au backend")
      return NextResponse.next()
    }
    const response = NextResponse.redirect(new URL("/auth/login", request.url))
    response.cookies.set("auth_token", "", { maxAge: -1 })
    return response
  }
}

// Configurer les routes sur lesquelles le middleware doit s'exécuter
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
}
