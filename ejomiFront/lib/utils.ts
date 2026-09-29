import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// « 29/09/2026 17:03 »
export function formatDateHeure(date?: string | Date | null): string {
  if (!date) return "—"
  const d = new Date(date)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// La date de commande est saisie sans heure (minuit) : on prend l'heure de création de la commande
export function dateHeureCommande(commande: { dateCommande?: string | Date | null; createdAt?: string | Date | null }): string {
  const d = commande.dateCommande ? new Date(commande.dateCommande) : null
  const c = commande.createdAt ? new Date(commande.createdAt) : null
  if (d && c && d.getHours() === 0 && d.getMinutes() === 0) {
    d.setHours(c.getHours(), c.getMinutes())
  }
  return formatDateHeure(d ?? c)
}
