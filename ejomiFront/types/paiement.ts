export interface Paiement {
  id: string
  modePaiement: string
  montantPaye: number
  creances: number
  ligneFormation?: {
    id: string
    typeClient: string
    participant?: {
      id: string
      type: string
      user?: {
        name: string
        prenom: string
      }
    }
  }
  marche?: {
    id: string
    typeDeBesoin: string
    structure?: {
      id: string
      typeStructure: string
    }
  }
  createdAt: string
  updatedAt?: string
}

export enum ModePaiement {
  ESPECES = "ESPECES",
  ORANGE_MONEY = "ORANGE_MONEY",
  MOOV_MONEY = "MOOV_MONEY",
  WAVE = "WAVE",
  TELECEL_MONEY = "TELECEL_MONEY",
  CARTE_BANCAIRE = "CARTE_BANCAIRE",
  MOBILE_MONEY = "MOBILE_MONEY",
  FLOOZ = "FLOOZ",
  T_MONEY = "T_MONEY",
  MONERO = "MONERO",
  AUTRE = "AUTRE",
}

// Modes proposés pour l'encaissement des commandes
export const MODES_PAIEMENT_COMMANDE = [
  { value: ModePaiement.ESPECES, label: "Espèces" },
  { value: ModePaiement.ORANGE_MONEY, label: "Orange Money" },
  { value: ModePaiement.MOOV_MONEY, label: "Moov Money" },
  { value: ModePaiement.WAVE, label: "Wave" },
  { value: ModePaiement.TELECEL_MONEY, label: "Telecel Money" },
]

export const MODE_PAIEMENT_LABELS: Record<string, string> = {
  ESPECES: "Espèces",
  ORANGE_MONEY: "Orange Money",
  MOOV_MONEY: "Moov Money",
  WAVE: "Wave",
  TELECEL_MONEY: "Telecel Money",
  CARTE_BANCAIRE: "Carte Bancaire",
  MOBILE_MONEY: "Mobile Money",
  FLOOZ: "FLOOZ",
  T_MONEY: "T-MONEY",
  MONERO: "MONERO",
  AUTRE: "Avoir / Crédit",
}

export interface PaiementCreateData {
  modePaiement: string
  montantPaye: number
  creances: number
  ligneFormationId?: string
  marcheId?: string
  observations?: string
}

export interface PaiementUpdateData extends Partial<PaiementCreateData> {}
