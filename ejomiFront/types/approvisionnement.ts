import type { Fournisseur } from "./fournisseur"
import type { Employe } from "./employe"
import type { Transaction } from "./transaction"
import { LigneApprovisionnement } from "./ligneApprovisionnement"

export interface Approvisionnement {
  id: number
  dateApprovisionnement: string
  montant: number
  fournisseurId: number
  fournisseur?: Fournisseur
  employeId: number
  employe?: Employe
  lignes?: LigneApprovisionnement[]
  transactions?: Transaction[]
}

export interface LigneApprovisionnementInput {
  produitId: number
  quantite: number
  prixUnitaire: number
  montant: number
  dateFabrication?: string
  datePeremption?: string
}

export interface ApprovisionnementCreateData {
  fournisseurId: number
  lignes: LigneApprovisionnementInput[]
}

export interface ApprovisionnementUpdateData {
  fournisseurId?: number
  employeId?: number
  lignes?: LigneApprovisionnementInput[]
}
