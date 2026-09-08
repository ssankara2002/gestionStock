import type { Role } from "./role"
import type { Commande } from "./commande"
import type { Employe } from "./employe"

export interface User {
  id: number
  nom: string
  prenom: string
  email?: string | null
  adresse?: string
  tel?: string | null
  image?: string
  password?: string | null
  roleId?: number
  role?: Role
  commandes?: Commande[]
  employe?: Employe
}

export interface UserCreateData {
  nom: string
  prenom: string
  email?: string | null
  adresse?: string
  tel?: string | null
  password?: string
  roleId?: string
}

export interface UserUpdateData extends Partial<UserCreateData> {}
