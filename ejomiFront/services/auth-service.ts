import { AuthResponse, LoginCredentials, RegisterData } from "../types/auth.js"
import apiClient from "./api-client"

export const authService = {
  login: (credentials: LoginCredentials & { entrepriseId?: number }) => apiClient.post<AuthResponse>("/auth/login", credentials),
  getEntreprises: (credentials: LoginCredentials) =>
    apiClient.post<{ entreprises: { id: number; nom: string; logo?: string }[] }>("/auth/login/entreprises", credentials),

  register: (userData: RegisterData) => apiClient.post<AuthResponse>("/auth/register", userData),

  registerEntreprise: (data: { entreprise: any; admin: any }) =>
    apiClient.post<AuthResponse>("/auth/register-entreprise", data),

  forgotPassword: (email: string) => apiClient.post("/auth/forgot-password", { email }),

  resetPassword: (token: string, newPassword: string) => apiClient.post("/auth/reset-password", { token, newPassword }),
}
