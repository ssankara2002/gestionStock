export interface Product {
  id: string
  libelle: string
  description: string
  quantite: number
  prixAchat: number
  prixVente: number
  image: string
  categorie: string
  dateCreation: string
  fournisseurId: string
}

export interface Fournisseur {
  id: string
  nom: string
  email: string
  telephone: string
  adresse: string
}

export interface Client {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string
  adresse: string
}

export interface Commande {
  id: string
  clientId: string
  produits: Array<{
    produitId: string
    quantite: number
    prix: number
  }>
  total: number
  statut: "en_attente" | "confirmee" | "livree" | "annulee"
  dateCommande: string
}