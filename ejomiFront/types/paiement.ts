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
  CARTE_BANCAIRE = "CARTE_BANCAIRE",
  MOBILE_MONEY = "MOBILE_MONEY",
  FLOOZ = "FLOOZ",
  T_MONEY = "T_MONEY",
  MONERO = "MONERO",
  AUTRE = "AUTRE",
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
