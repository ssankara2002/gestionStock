import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { Commande, Client, LigneCommande, Product } from "@/types/product"

interface RecuCommandeProps {
  commande: Commande
  client: Client
  lignesAvecProduits: (LigneCommande & { produit: Product | undefined })[]
  soldePaiement?: {
    totalPaye: number
    creance: number
  }
}

export function RecuCommande({ commande, client, lignesAvecProduits, soldePaiement }: RecuCommandeProps) {
  // Calculer les totaux (sans TVA)
  const sousTotal = lignesAvecProduits.reduce((total, ligne) => total + ligne.montant, 0)
  const total = sousTotal - ((commande as any).reduction || 0)

  // Payment summary (fallback to computed totals)
  const totalPaye = soldePaiement?.totalPaye ?? 0
  const creance = soldePaiement?.creance ?? Math.max(0, total - totalPaye)

  return (
    <div className="max-w-2xl mx-auto font-sans text-gray-800">
      {/* En-tête */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold">
              GT
            </div>
            <div>
              <h1 className="text-xl font-bold">GoldTech</h1>
              <p className="text-xs text-gray-500">Bijouterie & Technologie</p>
            </div>
          </div>
          <div className="mt-2 text-sm">
            <p>123 Avenue du Commerce</p>
            <p>Dakar, Sénégal</p>
            <p>Tel: +221 33 123 45 67</p>
            <p>Email: contact@goldtech.com</p>
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-xl font-bold">REÇU</h2>
          <p className="text-sm text-gray-600">#{commande.id}</p>
          <p className="text-sm text-gray-600">
            Date: {format(new Date(commande.dateCommande), "dd MMMM yyyy", { locale: fr })}
          </p>
          <div className="mt-2 inline-block px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
            {commande.statut}
          </div>
        </div>
      </div>

      {/* Informations client */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-bold mb-2 text-gray-700">Informations client</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Nom:</p>
            <p className="font-medium">{client.nom}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email:</p>
            <p className="font-medium">{client.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Téléphone:</p>
            <p className="font-medium">{client.telephone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Adresse:</p>
            <p className="font-medium">{client.adresse}</p>
          </div>
        </div>
      </div>

      {/* Tableau des produits */}
      <table className="w-full mb-8">
        <thead>
          <tr className="border-b border-gray-300 text-left">
            <th className="py-2 text-sm font-semibold text-gray-600">Produit</th>
            <th className="py-2 text-sm font-semibold text-gray-600 text-right">Prix unitaire</th>
            <th className="py-2 text-sm font-semibold text-gray-600 text-right">Qté</th>
            <th className="py-2 text-sm font-semibold text-gray-600 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {lignesAvecProduits.map((ligne, index) => (
            <tr key={index} className="border-b border-gray-200">
              <td className="py-3">
                <div className="font-medium">{ligne.produit ? ligne.produit.libelle : "Produit inconnu"}</div>
              </td>
              <td className="py-3 text-right">
                {ligne.quantiteCommande > 0
                  ? (ligne.montant / ligne.quantiteCommande).toLocaleString("fr-FR", { maximumFractionDigits: 2 })
                  : "0"}{" "}
                FCFA
              </td>
              <td className="py-3 text-right">{ligne.quantiteCommande}</td>
              <td className="py-3 text-right font-medium">
                {ligne.montant.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} FCFA
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mb-8">
        <div className="flex justify-between py-2">
          <span className="text-gray-600">Sous-total:</span>
          <span>{sousTotal.toLocaleString()} FCFA</span>
        </div>
  {(commande as any).reduction > 0 && (
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Réduction:</span>
            <span className="text-red-600">-{(commande as any).reduction?.toLocaleString?.() || 0} FCFA</span>
          </div>
        )}
        <div className="flex justify-between py-3 border-t border-gray-300 font-bold text-lg">
          <span>Total à payer:</span>
          <span className="text-blue-600">{total.toLocaleString()} FCFA</span>
        </div>

        <div className="mt-4 pt-4 border-t-2 border-gray-300 space-y-2">
          <div className="flex justify-between py-2 text-green-600">
            <span className="font-semibold">Total payé:</span>
            <span className="font-bold">{Number(totalPaye).toLocaleString()} FCFA</span>
          </div>
          <div className={`flex justify-between py-2 ${creance > 0 ? "text-orange-600" : "text-green-600"}`}>
            <span className="font-semibold">Reste à payer:</span>
            <span className="font-bold">{Number(creance).toLocaleString()} FCFA</span>
          </div>
          {creance > 0 && (
            <div className="mt-2 p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
              <p className="text-sm font-medium text-orange-800">⚠️ Paiement incomplet - Créance restante: {Number(creance).toLocaleString()} FCFA</p>
            </div>
          )}
          {creance === 0 && totalPaye > 0 && (
            <div className="mt-2 p-3 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="text-sm font-medium text-green-800">✓ Vente entièrement payée</p>
            </div>
          )}
        </div>
      </div>

      {/* Pied de page */}
      <div className="text-center text-sm text-gray-500 mt-8 pt-8 border-t border-gray-200">
        <p>Merci pour votre achat chez GoldTech!</p>
        <p className="mt-2">Pour toute question concernant cette vente, veuillez contacter notre service client.</p>
        <p className="mt-4">© {new Date().getFullYear()} GoldTech - Tous droits réservés</p>
      </div>
    </div>
  )
}
