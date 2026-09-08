import type { Absence } from "./absence"
import { Approvisionnement } from "./approvisionnement"
import { Commande } from "./commande"
import { Conge } from "./conge"
import { Livraison } from "./livraison"
import { Production } from "./production"
import { SalairePaiement } from "./salairePaiement"
import { User } from "./user"

export interface Employe {
  id: number
  userId: number
  salaire: number
  dateEmbauche: string
  user?: User  // Relation avec l'utilisateur
  absences?: Absence[]
  conges?: Conge[]
  paiements?: SalairePaiement[]
  commandes?: Commande[]
  livraisons?: Livraison[]
  approvisionnements?: Approvisionnement[]
  productions?: Production[]
}

export interface EmployeCreateData {
  userId: number
  salaire: number
  dateEmbauche: string
}

export interface EmployeWithUserCreateData {
  // Données utilisateur
  nom: string
  prenom: string
  email?: string | null
  adresse: string
  tel?: string | null
  password?: string
  roleId?: string
  // Données employé
  salaire: number
  dateEmbauche: string
}

export interface EmployeUpdateData extends Partial<EmployeCreateData> {}

export interface EmployeWithUserUpdateData {
  // Données utilisateur
  nom?: string
  prenom?: string
  email?: string
  adresse?: string
  tel?: string
  password?: string
  roleId?: string
  // Données employé
  salaire?: number
  dateEmbauche?: string
}
