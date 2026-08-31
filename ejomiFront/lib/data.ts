import type { Product, Fournisseur, Client, Commande } from "@/types/product"

// Sample products data
export const products: Product[] = [
  {
    id: "1",
    libelle: "Détecteur Gold Master",
    description:
      "Détecteur de métaux professionnel avec technologie de discrimination avancée, idéal pour la recherche d'or.",
    quantite: 15,
    prixAchat: 450,
    prixVente: 799,
    image: "/images/detector1.jpg",
    categorie: "Détecteurs professionnels",
    dateCreation: "2023-01-15",
    fournisseurId: "1",
  },
  {
    id: "2",
    libelle: "Pelle de prospection Premium",
    description: "Pelle robuste en acier inoxydable, spécialement conçue pour la prospection d'or.",
    quantite: 30,
    prixAchat: 25,
    prixVente: 49.99,
    image: "/images/shovel.jpg",
    categorie: "Outils",
    dateCreation: "2023-02-10",
    fournisseurId: "2",
  },
  {
    id: "3",
    libelle: "Détecteur sous-marin Aqua Gold",
    description:
      "Détecteur étanche jusqu'à 60m de profondeur, parfait pour la recherche d'or dans les rivières et océans.",
    quantite: 8,
    prixAchat: 650,
    prixVente: 1299,
    image: "/images/underwater-detector.jpg",
    categorie: "Détecteurs professionnels",
    dateCreation: "2023-03-05",
    fournisseurId: "1",
  },
  {
    id: "4",
    libelle: "Kit de batée pour orpaillage",
    description: "Kit complet pour débuter l'orpaillage, comprend une batée, une loupe et des flacons.",
    quantite: 25,
    prixAchat: 35,
    prixVente: 69.99,
    image: "/images/gold-pan-kit.jpg",
    categorie: "Kits",
    dateCreation: "2023-01-20",
    fournisseurId: "3",
  },
  {
    id: "5",
    libelle: "Détecteur Gold Finder 2000",
    description: "Notre modèle le plus avancé avec GPS intégré et cartographie du terrain.",
    quantite: 5,
    prixAchat: 850,
    prixVente: 1599,
    image: "/images/detector2.jpg",
    categorie: "Détecteurs professionnels",
    dateCreation: "2023-04-12",
    fournisseurId: "1",
  },
  {
    id: "6",
    libelle: "Casque audio pour détecteur",
    description: "Casque haute qualité pour une détection précise des signaux audio.",
    quantite: 20,
    prixAchat: 45,
    prixVente: 89.99,
    image: "/images/headphones.jpg",
    categorie: "Accessoires",
    dateCreation: "2023-02-28",
    fournisseurId: "2",
  },
]

// Sample suppliers data
export const fournisseurs: Fournisseur[] = [
  {
    id: "1",
    nom: "GoldTech Industries",
    email: "contact@goldtech.com",
    telephone: "+33 1 23 45 67 89",
    adresse: "15 Rue de l'Innovation, 75001 Paris",
  },
  {
    id: "2",
    nom: "Prospector Tools",
    email: "sales@prospectortools.com",
    telephone: "+33 1 98 76 54 32",
    adresse: "42 Avenue des Chercheurs, 69002 Lyon",
  },
  {
    id: "3",
    nom: "Mining Supplies Co.",
    email: "info@miningsupplies.com",
    telephone: "+33 4 56 78 90 12",
    adresse: "8 Boulevard des Mineurs, 13001 Marseille",
  },
]

// Sample clients data
export const clients: Client[] = [
  {
    id: "1",
    nom: "Jean Dupont",
    email: "jean.dupont@example.com",
    telephone: "+33 6 12 34 56 78",
    adresse: "23 Rue du Commerce, 75015 Paris",
    pointsFidelite: 120,
  },
  {
    id: "2",
    nom: "Marie Martin",
    email: "marie.martin@example.com",
    telephone: "+33 6 98 76 54 32",
    adresse: "7 Avenue des Fleurs, 69003 Lyon",
    pointsFidelite: 85,
  },
  {
    id: "3",
    nom: "Pierre Durand",
    email: "pierre.durand@example.com",
    telephone: "+33 6 45 67 89 01",
    adresse: "12 Boulevard de la Mer, 13008 Marseille",
    pointsFidelite: 210,
  },
]

// Sample commandes data
const commandes: Commande[] = [
  {
    id: "CMD-001",
    date: "2025-05-15",
    clientId: "1",
    vendeurId: "2",
    lignes: [
      { id: "1", produitId: "1", quantite: 1, prixUnitaire: 799, reduction: 0 },
      { id: "2", produitId: "6", quantite: 2, prixUnitaire: 89.99, reduction: 5 },
    ],
    montantTotal: 968.98,
    reduction: 0,
    statut: "payée",
  },
  {
    id: "CMD-002",
    date: "2025-05-14",
    clientId: "2",
    vendeurId: "2",
    lignes: [{ id: "3", produitId: "3", quantite: 1, prixUnitaire: 1299, reduction: 0 }],
    montantTotal: 1299,
    reduction: 0,
    statut: "en attente",
  },
  {
    id: "CMD-003",
    date: "2025-05-13",
    clientId: "3",
    vendeurId: "2",
    lignes: [
      { id: "4", produitId: "2", quantite: 2, prixUnitaire: 49.99, reduction: 0 },
      { id: "5", produitId: "4", quantite: 1, prixUnitaire: 69.99, reduction: 0 },
      { id: "6", produitId: "5", quantite: 1, prixUnitaire: 1599, reduction: 10 },
    ],
    montantTotal: 1709.97,
    reduction: 5,
    statut: "livrée",
  },
  {
    id: "CMD-004",
    date: "2025-05-12",
    clientId: "1",
    vendeurId: "2",
    lignes: [{ id: "7", produitId: "6", quantite: 3, prixUnitaire: 89.99, reduction: 0 }],
    montantTotal: 269.97,
    reduction: 0,
    statut: "payée",
  },
  {
    id: "CMD-005",
    date: "2025-05-10",
    clientId: "2",
    vendeurId: "2",
    lignes: [{ id: "8", produitId: "1", quantite: 1, prixUnitaire: 799, reduction: 5 }],
    montantTotal: 759.05,
    reduction: 0,
    statut: "annulée",
  },
]

// Function to get product by ID
export function getProduitById(id: string): Product | undefined {
  return products.find((product) => product.id === id)
}

// Function to get product by ID
export function getProductById(id: string): Product | undefined {
  return products.find((product) => product.id === id)
}

// Function to get supplier by ID
export function getFournisseurById(id: string): Fournisseur | undefined {
  return fournisseurs.find((fournisseur) => fournisseur.id === id)
}

// Function to get client by ID
export function getClientById(id: string): Client | undefined {
  return clients.find((client) => client.id === id)
}

// Function to get commande by ID
export function getCommandeById(id: string): Commande | undefined {
  return commandes.find((commande) => commande.id === id)
}

// Function to get products by category
export function getProductsByCategory(category: string): Product[] {
  return products.filter((product) => product.categorie === category)
}

// Function to get products by supplier
export function getProductsByFournisseur(fournisseurId: string): Product[] {
  return products.filter((product) => product.fournisseurId === fournisseurId)
}

// Function to get products with low stock
export function getProductsWithLowStock(threshold = 10): Product[] {
  return products.filter((product) => product.quantite <= threshold)
}
