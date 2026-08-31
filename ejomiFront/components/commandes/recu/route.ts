import { type NextRequest, NextResponse } from "next/server"
import puppeteer from "puppeteer"
import React from "react"
import ReactDOMServer from "react-dom/server"
import { RecuCommandePDF } from "@/components/commandes/recu-commande-pdf"
import { getCommandeById, getClientById, getProduitById } from "@/lib/data"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID de commande requis" }, { status: 400 })
    }

    const commande = getCommandeById(id)
    if (!commande) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 })
    }

    const client = getClientById(commande.clientId)
    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 })
    }

    // Récupérer les détails des produits pour chaque ligne
    const lignesAvecProduits = commande.lignes.map((ligne) => {
      const produit = getProduitById(ligne.produitId)
      return {
        ...ligne,
        produit,
      }
    })

    // Générer le HTML du reçu
    const recuHTML = ReactDOMServer.renderToString(
      React.createElement(RecuCommandePDF, {
        commande,
        client,
        lignesAvecProduits,
      }),
    )

    // Créer le PDF avec Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()

    // Définir le contenu HTML
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Reçu Commande #${commande.id.substring(0, 8)}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              color: #333;
            }
          </style>
        </head>
        <body>
          ${recuHTML}
        </body>
      </html>
    `)

    // Générer le PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    })

    await browser.close()

    // Retourner le PDF
    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recu-commande-${commande.id.substring(0, 8)}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Erreur lors de la génération du PDF:", error)
    return NextResponse.json({ error: "Erreur lors de la génération du PDF" }, { status: 500 })
  }
}
