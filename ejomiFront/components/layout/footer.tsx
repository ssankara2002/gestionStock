import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

interface FooterProps {
  nom?: string
  facebook?: string
  instagram?: string
  twitter?: string
}

export function Footer({ nom, facebook, instagram, twitter }: FooterProps = {}) {
  const hasSocial = facebook || instagram || twitter

  return (
    <footer className="border-t bg-card">
      <div className="container py-8 md:py-12">
        {hasSocial && (
          <div className="flex justify-center gap-4 mb-6">
            {facebook && (
              <Link href={facebook} target="_blank" className="text-muted-foreground hover:text-primary">
                <Facebook className="h-5 w-5" />
              </Link>
            )}
            {instagram && (
              <Link href={instagram} target="_blank" className="text-muted-foreground hover:text-primary">
                <Instagram className="h-5 w-5" />
              </Link>
            )}
            {twitter && (
              <Link href={twitter} target="_blank" className="text-muted-foreground hover:text-primary">
                <Twitter className="h-5 w-5" />
              </Link>
            )}
          </div>
        )}
        <div className="text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {nom || "StockManager"}. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}
