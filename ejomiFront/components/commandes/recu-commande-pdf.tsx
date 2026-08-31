import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { Commande, Client, LigneCommande, Product } from "@/types/product"

interface RecuCommandePDFProps {
  commande: Commande
  client: Client
  lignesAvecProduits: (LigneCommande & { produit: Product | undefined })[]
}

export function RecuCommandePDF({ commande, client, lignesAvecProduits }: RecuCommandePDFProps) {
  // Calculer les totaux (sans TVA)
  const sousTotal = lignesAvecProduits.reduce((total, ligne) => total + ligne.quantite * ligne.prixUnitaire, 0)
  const total = sousTotal - (commande.reduction || 0)

  return (
    <div
      style={{ fontFamily: "Arial, sans-serif", color: "#333", maxWidth: "800px", margin: "0 auto", padding: "20px" }}
    >
      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "30px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                height: "40px",
                width: "40px",
                borderRadius: "50%",
                background: "linear-gradient(to right, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "bold",
              }}
            >
              GT
            </div>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0" }}>GoldTech</h1>
              <p style={{ fontSize: "12px", color: "#6b7280", margin: "0" }}>Bijouterie & Technologie</p>
            </div>
          </div>
          <div style={{ marginTop: "10px", fontSize: "14px" }}>
            <p style={{ margin: "2px 0" }}>123 Avenue du Commerce</p>
            <p style={{ margin: "2px 0" }}>Dakar, Sénégal</p>
            <p style={{ margin: "2px 0" }}>Tel: +221 33 123 45 67</p>
            <p style={{ margin: "2px 0" }}>Email: contact@goldtech.com</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: "0" }}>REÇU</h2>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "5px 0" }}>#{commande.id.substring(0, 8)}</p>
          <p style={{ fontSize: "14px", color: "#6b7280", margin: "5px 0" }}>
            Date: {format(new Date(commande.date), "dd MMMM yyyy", { locale: fr })}
          </p>
          <div
            style={{
              marginTop: "10px",
              display: "inline-block",
              padding: "5px 10px",
              backgroundColor: "#d1fae5",
              color: "#065f46",
              borderRadius: "9999px",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            Payée
          </div>
        </div>
      </div>

      {/* Informations client */}
      <div style={{ marginBottom: "30px", padding: "15px", backgroundColor: "#f9fafb", borderRadius: "8px" }}>
        <h3 style={{ fontWeight: "bold", marginBottom: "10px", color: "#4b5563" }}>Informations client</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
          <div>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "2px 0" }}>Nom:</p>
            <p style={{ fontWeight: "500", margin: "2px 0" }}>{client.nom}</p>
          </div>
          <div>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "2px 0" }}>Email:</p>
            <p style={{ fontWeight: "500", margin: "2px 0" }}>{client.email}</p>
          </div>
          <div>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "2px 0" }}>Téléphone:</p>
            <p style={{ fontWeight: "500", margin: "2px 0" }}>{client.telephone}</p>
          </div>
          <div>
            <p style={{ fontSize: "14px", color: "#6b7280", margin: "2px 0" }}>Adresse:</p>
            <p style={{ fontWeight: "500", margin: "2px 0" }}>{client.adresse}</p>
          </div>
        </div>
      </div>

      {/* Tableau des produits */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
            <th
              style={{ padding: "10px 5px", textAlign: "left", fontSize: "14px", fontWeight: "600", color: "#4b5563" }}
            >
              Produit
            </th>
            <th
              style={{ padding: "10px 5px", textAlign: "right", fontSize: "14px", fontWeight: "600", color: "#4b5563" }}
            >
              Prix unitaire
            </th>
            <th
              style={{ padding: "10px 5px", textAlign: "right", fontSize: "14px", fontWeight: "600", color: "#4b5563" }}
            >
              Qté
            </th>
            <th
              style={{ padding: "10px 5px", textAlign: "right", fontSize: "14px", fontWeight: "600", color: "#4b5563" }}
            >
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {lignesAvecProduits.map((ligne, index) => (
            <tr key={index} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "12px 5px" }}>
                <div style={{ fontWeight: "500" }}>{ligne.produit ? ligne.produit.libelle : "Produit inconnu"}</div>
              </td>
              <td style={{ padding: "12px 5px", textAlign: "right" }}>{ligne.prixUnitaire.toLocaleString()} FCFA</td>
              <td style={{ padding: "12px 5px", textAlign: "right" }}>{ligne.quantite}</td>
              <td style={{ padding: "12px 5px", textAlign: "right", fontWeight: "500" }}>
                {(ligne.prixUnitaire * ligne.quantite - ligne.reduction).toLocaleString()} FCFA
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Résumé des totaux */}
      <div style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
          <span style={{ color: "#4b5563" }}>Sous-total:</span>
          <span>{sousTotal.toLocaleString()} FCFA</span>
        </div>
        {commande.reduction > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ color: "#4b5563" }}>Réduction:</span>
            <span>-{commande.reduction.toLocaleString()} FCFA</span>
          </div>
        )}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "12px 0",
            borderTop: "1px solid #e5e7eb",
            fontWeight: "bold",
            marginTop: "8px",
          }}
        >
          <span>Total:</span>
          <span>{total.toLocaleString()} FCFA</span>
        </div>
      </div>

      {/* Pied de page */}
      <div
        style={{
          textAlign: "center",
          fontSize: "14px",
          color: "#6b7280",
          marginTop: "30px",
          paddingTop: "20px",
          borderTop: "1px solid #e5e7eb",
        }}
      >
        <p style={{ margin: "5px 0" }}>Merci pour votre achat chez GoldTech!</p>
        <p style={{ margin: "10px 0" }}>
          Pour toute question concernant cette commande, veuillez contacter notre service client.
        </p>
        <p style={{ margin: "15px 0" }}>© {new Date().getFullYear()} GoldTech - Tous droits réservés</p>
      </div>
    </div>
  )
}
