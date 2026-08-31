import type { Production } from "./production"
import type { MatierePremiere } from "./matierePremiere"

export interface MatierePremiereConsommation {
  id: string
  productionId: string
  production?: Production
  matierePremiereId: string
  matierePremiere?: MatierePremiere
  quantite: number
}

export interface MatierePremiereConsommationCreateData {
  productionId: string
  matierePremiereId: string
  quantite: number
}

export interface MatierePremiereConsommationUpdateData extends Partial<MatierePremiereConsommationCreateData> {}
