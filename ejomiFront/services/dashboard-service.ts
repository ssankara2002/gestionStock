import apiClient from "./api-client"

export interface ProduitProchesPeremption {
  produitId: number | null
  libelle: string
  image: string | null
  prixDeVenteUnitaire: number
  stockBoutique: number
  stockMagasin: number
  quantite: number
  datePeremption: string
  joursRestants: number
  fournisseur: string | null
}

export interface DashboardStats {
  // Ventes (gardé pour compatibilité)
  sales: {
    today: number
    yesterday: number
    weekTotal: number
    monthTotal: number
    monthlyTarget: number
    percentChange: number
  }
  // Données pour les graphiques de ventes
  salesChartData: {
    week: Array<{ date: string; count: number; total: number }>
    month: Array<{ date: string; count: number; total: number }>
    year: Array<{ month: number; count: number; total: number }>
  }
  // Productions
  production: {
    totalProductions: number
    quantiteTotale: number
    valeurTotale: number
    percentChange: number
  }
  // Inventaire
  inventory: {
    totalProducts: number
    lowStockCount: number
    totalValue: number
    percentChange: number
  }
  // Clients
  customers: {
    totalCustomers: number
    newThisMonth: number
    percentChange: number
  }
  // Commandes
  orders: {
    totalOrders: number
    pendingOrders: number
    completedOrders: number
    percentChange: number
  }
  // Commandes récentes
  recentOrders: Array<{
    id: number
    clientName: string
    date: string
    amount: number
    status: string
  }>
  // Produits proches péremption (≤ 30 jours)
  produitsProchesPeremption: ProduitProchesPeremption[]
  // Produits en rupture
  lowStockProducts: Array<{
    id: number
    libelle: string
    stockBoutique: number
    stockMagasin: number
    prixDeVenteUnitaire: number
  }>
  lowStockMagasinProducts: Array<{
    id: number
    libelle: string
    stockMagasin: number
    stockBoutique: number
    prixDeVenteUnitaire: number
  }>
  // Top produits commandés
  topSellingProducts: Array<{
    id: number
    name: string
    sales: number // Quantité commandée
    revenue: number // Valeur des commandes
    image: string | null
  }>
  // Employés
  employees: {
    total: number
    present: number
    absent: number
  }
  // Transactions
  transactions: {
    totalRevenue: number
    totalExpenses: number
    balance: number
  }
  // Paiements
  payments: {
    totalPaiements: number
    totalCreances: number
    totalPaiementsCeMois: number
    totalDepenses: number
    balance: number
  }
}

class DashboardService {
  /**
   * Récupère toutes les statistiques du dashboard
   */
  async getStats(): Promise<{ data: DashboardStats }> {
    try {
      // Récupérer toutes les données en parallèle
      const [
        commandesStats,
        produitsStats,
        clientsResponse,
        commandesRecentes,
        employesStats,
        transactionsStats,
        absencesStats,
        productionsStats,
        paiementsStats,
        peremptionStats,
      ] = await Promise.all([
        apiClient.get("/commandes/statistics"),
        apiClient.get("/produits/statistics"),
        apiClient.get("/users?role=CLIENT"),
        apiClient.get("/commandes?page=1&limit=5"),
        apiClient.get("/employes/statistics"),
        apiClient.get("/transactions/statistics"),
        apiClient.get("/absences/statistics"),
        apiClient.get("/productions/statistics"),
        apiClient.get("/paiements/statistics"),
        apiClient.get("/produits/peremption"),
      ])

      // Extraire les données
      const commandesData = commandesStats.data.data || {}
      const produitsData = produitsStats.data.data || {}
      const clientsData = clientsResponse.data.data || []
      const commandesRecentesData = commandesRecentes.data.data || []
      const employesData = employesStats.data.data || {}
      const transactionsData = transactionsStats.data.data || {}
      const absencesData = absencesStats.data.data || {}
      const productionsData = productionsStats.data.data || {}
      const paiementsData = paiementsStats.data.data || {}
      const produitsProchesPeremption: ProduitProchesPeremption[] = peremptionStats.data.data || []

      // Calculer les statistiques de ventes
      const totalVentes = commandesData.totalMontant || 0
      const objectifMensuel = 500000 // Objectif fixe, à adapter selon vos besoins

      // Calculer le nombre de clients ce mois-ci et mois précédent
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

      const newClientsThisMonth = Array.isArray(clientsData)
        ? clientsData.filter((c: any) => {
            const createdDate = new Date(c.createdAt)
            return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear
          }).length
        : 0

      const newClientsLastMonth = Array.isArray(clientsData)
        ? clientsData.filter((c: any) => {
            const createdDate = new Date(c.createdAt)
            return createdDate.getMonth() === lastMonth && createdDate.getFullYear() === lastMonthYear
          }).length
        : 0

      const clientsPercentChange = newClientsLastMonth > 0
        ? ((newClientsThisMonth - newClientsLastMonth) / newClientsLastMonth) * 100
        : 0

      const mapStockFaible = (p: any, lieu: 'boutique' | 'magasin') => ({
        id: p.produit?.id ?? p.id,
        libelle: p.produit?.libelle ?? p.libelle,
        stockBoutique: lieu === 'boutique' ? (p.quantite ?? 0) : (p.produit?.stockBoutique?.quantite ?? 0),
        stockMagasin: lieu === 'magasin' ? (p.quantite ?? 0) : (p.produit?.stockMagasin?.quantite ?? 0),
        prixDeVenteUnitaire: p.produit?.prixDeVenteUnitaire ?? p.prixDeVenteUnitaire ?? 0,
      })
      const lowStockProducts = (produitsData.produitsStockFaible || []).map((p: any) => mapStockFaible(p, 'boutique'))
      const lowStockMagasinProducts = (produitsData.produitsStockFaibleMagasin || []).map((p: any) => mapStockFaible(p, 'magasin'))

      // Construire les commandes récentes
      const recentOrders = commandesRecentesData.map((cmd: any) => ({
        id: cmd.id,
        clientName: cmd.client ? `${cmd.client.prenom} ${cmd.client.nom}` : "Client inconnu",
        date: cmd.dateCommande,
        amount: cmd.montant,
        status: cmd.statut
      }))

      // Top produits commandés (basé sur les lignes de commandes)
      const topSellingProducts = (commandesData.topProduits || []).slice(0, 3).map((p: any) => ({
        id: p.produitId || p.id,
        name: p.produit?.libelle || p.libelle || "Produit inconnu",
        sales: p.quantiteCommandee || p.totalCommandes || 0,
        revenue: p.montantTotal || ((p.quantiteCommandee || 0) * (p.produit?.prixDeVenteUnitaire || 0)),
        image: p.produit?.image || p.image || null
      }))

      // Fallback : si pas de données de commandes, utiliser les produits en stock
      const finalTopProducts = topSellingProducts.length > 0
        ? topSellingProducts
        : (produitsData.topProduits || []).slice(0, 3).map((p: any) => ({
            id: p.id,
            name: p.libelle,
            sales: p.quantiteStock || 0,
            revenue: (p.quantiteStock || 0) * (p.prixDeVenteUnitaire || 0),
            image: p.image
          }))

      const dashboardStats: DashboardStats = {
        sales: {
          today: commandesData.ventesToday || 0,
          yesterday: commandesData.ventesYesterday || 0,
          weekTotal: commandesData.ventesWeek || 0,
          monthTotal: totalVentes,
          monthlyTarget: objectifMensuel,
          percentChange: commandesData.percentChange || 0
        },
        salesChartData: {
          week: (commandesData.chartsData?.week || []).map((item: any) => ({
            date: item.date,
            count: item.count || 0,
            total: item.total || 0,
          })),
          month: (commandesData.chartsData?.month || []).map((item: any) => ({
            date: item.date,
            count: item.count || 0,
            total: item.total || 0,
          })),
          year: (commandesData.chartsData?.year || []).map((item: any) => ({
            month: item.month || 0,
            count: item.count || 0,
            total: item.total || 0,
          })),
        },
        production: {
          totalProductions: productionsData.totalProductions || 0,
          quantiteTotale: productionsData.quantiteTotale || 0,
          valeurTotale: productionsData.valeurTotale || 0,
          percentChange: productionsData.percentChange || 0
        },
        inventory: {
          totalProducts: produitsData.totalProduits || 0,
          lowStockCount: lowStockProducts.length,
          totalValue: produitsData.valeurTotale || 0,
          percentChange: produitsData.percentChange || 0
        },
        customers: {
          totalCustomers: Array.isArray(clientsData) ? clientsData.length : 0,
          newThisMonth: newClientsThisMonth,
          percentChange: Math.round(clientsPercentChange * 10) / 10
        },
        orders: {
          totalOrders: commandesData.totalCommandes || 0,
          pendingOrders: commandesData.commandesEnAttente || 0,
          completedOrders: commandesData.commandesPayees || 0,
          percentChange: commandesData.percentChange || 0
        },
        recentOrders,
        produitsProchesPeremption,
        lowStockProducts,
        lowStockMagasinProducts,
        topSellingProducts: finalTopProducts,
        employees: {
          total: employesData.totalEmployes || 0,
          present: (employesData.totalEmployes || 0) - (absencesData.absencesToday || 0),
          absent: absencesData.absencesToday || 0
        },
        transactions: {
          totalRevenue: transactionsData.totalEntrees || 0,
          totalExpenses: transactionsData.totalSorties || 0,
          balance: (transactionsData.totalEntrees || 0) - (transactionsData.totalSorties || 0)
        },
        payments: {
          totalPaiements: paiementsData.totalPaiements || 0,
          totalCreances: paiementsData.totalCreances || 0,
          totalPaiementsCeMois: paiementsData.totalPaiementsCeMois || 0,
          totalDepenses: paiementsData.totalDepenses || 0,
          balance: paiementsData.balance || 0
        }
      }

      return { data: dashboardStats }
    } catch (error) {
      console.error("Erreur lors de la récupération des stats du dashboard:", error)
      throw error
    }
  }

  /**
   * Récupère les statistiques RH (employés, absences, congés)
   */
  async getHRStats() {
    try {
      const [employesStats, absencesStats, congesStats] = await Promise.all([
        apiClient.get("/employes/statistics"),
        apiClient.get("/absences/statistics"),
        apiClient.get("/conges/statistics")
      ])

      return {
        data: {
          employes: employesStats.data.data,
          absences: absencesStats.data.data,
          conges: congesStats.data.data
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des stats RH:", error)
      throw error
    }
  }

  /**
   * Récupère les statistiques de production
   */
  async getProductionStats() {
    try {
      const [productionStats, matieresStats] = await Promise.all([
        apiClient.get("/productions/statistics"),
        apiClient.get("/matieres-premieres/statistics")
      ])

      return {
        data: {
          production: productionStats.data.data,
          matieresPremières: matieresStats.data.data
        }
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des stats de production:", error)
      throw error
    }
  }
}

export const dashboardService = new DashboardService()
