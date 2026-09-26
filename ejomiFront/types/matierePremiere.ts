import { MatierePremiereConsommation } from "./matierePremiereConsommation"

export interface MatierePremiere {
  id: string
  nom: string
  categorie?: string
  description?: string
  quantiteStock: number
  unite?: string
  prixAchat?: number
  consommations?: MatierePremiereConsommation[]
}

export interface MatierePremiereCreateData {
  nom: string
  categorie?: string
  description?: string
  quantiteStock?: number
  unite?: string
  prixAchat?: number
}

export interface MatierePremiereUpdateData extends Partial<MatierePremiereCreateData> {}
