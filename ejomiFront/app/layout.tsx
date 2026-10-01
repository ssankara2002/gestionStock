import type { Metadata } from "next"
import { Playfair_Display, Roboto } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/context/auth-provider"
import { CartProvider } from "@/context/cart-context"
import { Toaster } from "@/components/ui/toaster"
import { QueryProvider } from "@/context/query-provider"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: "stocka",
  description: "stocka - Gestion de stock et commerce moderne",
}

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
  preload: false,
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${roboto.variable} ${playfair.variable} font-sans`}>
        <QueryProvider>
          <AuthProvider>
            <CartProvider>
              {children}
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
