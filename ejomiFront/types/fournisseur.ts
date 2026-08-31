
export interface Fournisseur {
  id: number
  nom: string
  prenom: string
  email?: string
  tel: string
  adresse: string
  createdAt?: string
  updatedAt?: string
}

export interface FournisseurCreateData {
  nom: string
  prenom: string
  email?: string
  tel: string
  adresse: string
}

export interface FournisseurUpdateData extends Partial<FournisseurCreateData> {}