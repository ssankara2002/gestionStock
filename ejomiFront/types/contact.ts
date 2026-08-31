export type ContactStatut = 'NON_LU' | 'LU' | 'TRAITE' | 'ARCHIVE'

export interface Contact {
  id: number
  nom: string
  email: string
  sujet: string
  message: string
  statut: ContactStatut
  dateEnvoi: string
  reponse?: string
  dateReponse?: string
}

export interface ContactCreateData {
  nom: string
  email: string
  sujet: string
  message: string
}

export interface ContactUpdateData {
  statut?: ContactStatut
  reponse?: string
}

export interface ContactStatistics {
  total: number
  nonLu: number
  lu: number
  traite: number
  archive: number
}
