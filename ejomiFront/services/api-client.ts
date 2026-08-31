import axios from "axios"

// Création de l'instance Axios avec la configuration de base
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  headers: {
    "Content-Type": "application/json",
  },
})

// Intercepteur de requête : ajoute le token d'authentification à chaque requête si présent
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    // If the request body is a FormData, remove any existing Content-Type header
    // so the browser/axios can set the correct multipart boundary automatically.
    if (config.data && typeof FormData !== 'undefined' && config.data instanceof FormData) {
      if (config.headers) {
        // headers can be a plain object or AxiosHeaders; delete both common keys
        delete (config.headers as any)['Content-Type']
        delete (config.headers as any)['content-type']
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Intercepteur de réponse : gère les erreurs globales comme les tokens expirés
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        const hadToken = !!localStorage.getItem("token")
        localStorage.removeItem("token")
        // Rediriger vers login uniquement si l'utilisateur avait un token (session expirée)
        if (hadToken) {
          console.warn("Token expiré ou invalide. Déconnexion.")
          window.location.href = "/auth/login"
        }
      }
    }
    return Promise.reject(error)
  },
)
export default apiClient
