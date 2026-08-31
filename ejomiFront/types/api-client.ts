import axios from "axios"

// Création de l'instance Axios avec la configuration de base
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
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
    return config
  },
  (error) => Promise.reject(error),
)

// Intercepteur de réponse : gestion des erreurs globales (déconnexion auto en cas de 401 si besoin)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Désactivé pour permettre la gestion des erreurs de login sans redirection automatique
    // La redirection sera gérée manuellement dans les composants appropriés
    /*
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    */

    return Promise.reject(error)
  },
)

export default apiClient
