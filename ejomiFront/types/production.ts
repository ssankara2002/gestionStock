import type { Produit } from "./produit"
import type { Employe } from "./employe"
import { MatierePremiereConsommation } from "./matierePremiereConsommation"

export interface Production {
  id: string
  produitId: string
  produit?: Produit
  quantiteFabriquee: number
  dateProduction: string
  employeId: string
  employe?: Employe
  lot?: string
  consommations?: MatierePremiereConsommation[]
}

export interface ProductionCreateData {
  produitId: string
  quantiteFabriquee: number
  dateProduction: string
  employeId: string
  lot?: string
}

export interface ProductionUpdateData extends Partial<ProductionCreateData> {}
