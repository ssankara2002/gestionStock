import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_for_dev_only"
const secretKey = new TextEncoder().encode(JWT_SECRET)

interface UserPayload {
  userId: number
  role: string
  iat: number
  exp: number
}

// Pages accessibles sans authentification
const PUBLIC_PATHS = [
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
  "/produits",
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // L'API est gérée par le backend
  if (pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  )

  const token = request.cookies.get("auth_token")?.value

  // Page publique sans token → laisser passer
  if (isPublicPath) {
    if (!token) return NextResponse.next()
    try {
      await jwtVerify<UserPayload>(token, secretKey)
      return NextResponse.next()
    } catch {
      const response = NextResponse.next()
      response.cookies.set("auth_token", "", { maxAge: -1 })
      return response
    }
  }

  // Page protégée sans token → login
  if (!token) {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("from", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Vérifier que le token est valide
  try {
    await jwtVerify<UserPayload>(token, secretKey)
    // Token valide : laisser passer, les permissions sont gérées par les composants et le backend
    return NextResponse.next()
  } catch {
    if (!process.env.JWT_SECRET) {
      // JWT_SECRET absent en dev : laisser le backend valider
      return NextResponse.next()
    }
    const response = NextResponse.redirect(new URL("/auth/login", request.url))
    response.cookies.set("auth_token", "", { maxAge: -1 })
    return response
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
}
