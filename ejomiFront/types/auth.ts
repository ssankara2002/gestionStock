import type { User } from './user';

export interface AuthResponse {
  token: string
  user: User
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  nom: string
  prenom: string
  email: string
  password: string
  tel?: string
  adresse?: string
  role?: string
}
