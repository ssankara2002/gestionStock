// import type { User } from "./user" // Éviter la dépendance circulaire
import type { Permission } from "./permission"

export interface Role {
  id: number
  name: string
  description?: string | null
  users?: any[] // Éviter la dépendance circulaire
  permissions?: Permission[]
}

export interface RoleCreateData {
  name: string
  description?: string | null
}

export interface RoleUpdateData extends Partial<RoleCreateData> {}
