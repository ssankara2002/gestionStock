// import { Role } from "@/types/role" // Éviter la dépendance circulaire

export interface Permission {
  id: number
  key: string
  description?: string | null
  roles?: any[] // Éviter la dépendance circulaire
}

export interface PermissionCreateData {
  key: string
  description?: string | null
}

export interface PermissionUpdateData extends Partial<PermissionCreateData> {}
