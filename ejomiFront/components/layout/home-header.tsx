"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface HomeHeaderProps {
  logo?: string
  nom?: string
}

export function HomeHeader({ logo, nom }: HomeHeaderProps = {}) {
  const baseUrl = process.env.NEXT_PUBLIC_UPLOADS_URL || process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:80"
  const logoSrc = logo ? `${baseUrl}/uploads/${logo}` : "/logo.jpeg"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src={logoSrc} alt={nom || "Logo"} width={50} height={50} className="object-contain" />
          <span className="font-playfair text-2xl font-bold text-primary">{nom || "STOCKA"}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10 hidden sm:flex">
            <Link href="/produits-public">Produits</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10 hidden sm:flex">
            <Link href="/a-propos">A propos</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10 hidden sm:flex">
            <Link href="/contact">Contact</Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
            <Link href="/auth/login">Connexion</Link>
          </Button>
          {/* <Button asChild size="sm">
            <Link href="/auth/register">S'inscrire</Link>
          </Button> */}
        </div>
      </div>
    </header>
  )
}
