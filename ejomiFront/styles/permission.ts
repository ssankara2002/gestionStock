import { Role } from "@/types/role"

export interface Permission {
  id: string
  key: string
  description?: string | null
  roles?: Role[]
}

export interface PermissionCreateData {
  key: string
  description?: string | null
}

export interface PermissionUpdateData extends Partial<PermissionCreateData> {}
