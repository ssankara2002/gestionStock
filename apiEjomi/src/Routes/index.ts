import { Router } from 'express';

// Import existing routes
import authRoutes from './auth.route';
import entrepriseRoutes from './entreprise.route';
import roleRoutes from './role.route';
import permissionRoutes from './permission.route';

// Import new CRUD routes
import userRoutes from './user.route';
import employeRoutes from './employe.route';
import fournisseurRoutes from './fournisseur.route';
import produitRoutes from './produit.route';
import platRoutes from './plat.route';
import commandeRoutes from './commande.route';
import transactionRoutes from './transaction.route';
import absenceRoutes from './absence.route';
import congeRoutes from './conge.route';
import approvisionnementRoutes from './approvisionnement.route';
import productionRoutes from './production.route';
import matierePremiereRoutes from './matiere_premiere.route';
import matierePremiereConsommationRoutes from './matiere_premiere_consommation.route';
import inventaireRoutes from './inventaire.route';
import contactRoutes from './contact.route';
import approvisionnementMatierePremiereRoutes from './approvisionnement_matiere_premiere.route';
import livraisonRoutes from './livraison.route';
import paiementRoutes from './paiement.route';
import salairePaiementRoutes from './salaire-paiement.routes';
import transfertRoutes from './transfert.route';
import lotRoutes from './lot.route';
import bilanRoutes from './bilan.route';

const router = Router();

// Authentication routes
router.use('/auth', authRoutes);
router.use('/entreprise', entrepriseRoutes);

// User management routes
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);

// Business model routes
router.use('/employes', employeRoutes);
router.use('/fournisseurs', fournisseurRoutes);
router.use('/produits', produitRoutes);
router.use('/plats', platRoutes);
router.use('/commandes', commandeRoutes);
router.use('/transactions', transactionRoutes);
router.use('/absences', absenceRoutes);
router.use('/conges', congeRoutes);
router.use('/approvisionnements', approvisionnementRoutes);
router.use('/productions', productionRoutes);
router.use('/matieres-premieres', matierePremiereRoutes);
router.use('/consommations', matierePremiereConsommationRoutes);
router.use('/inventaire', inventaireRoutes);
router.use('/approvisionnements-matieres-premieres', approvisionnementMatierePremiereRoutes);
router.use('/contacts', contactRoutes);
router.use('/livraisons', livraisonRoutes);
router.use('/paiements', paiementRoutes);
router.use('/salaire-paiements', salairePaiementRoutes);
router.use('/transferts', transfertRoutes);
router.use('/lots', lotRoutes);
router.use('/bilan', bilanRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// API info route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bienvenue sur l\'API Ejomi',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      roles: '/api/roles',
      permissions: '/api/permissions',
      employes: '/api/employes',
      fournisseurs: '/api/fournisseurs',
      produits: '/api/produits',
      commandes: '/api/commandes',
      transactions: '/api/transactions',
      absences: '/api/absences',
      conges: '/api/conges',
      approvisionnements: '/api/approvisionnements',
      productions: '/api/productions',
      matieresPremiere: '/api/matieres-premieres',
      consommations: '/api/consommations',
      approvisionnementsMatierePremiere: '/api/approvisionnements-matieres-premieres',
      inventaire: '/api/inventaire',
      contacts: '/api/contacts',
      livraisons: '/api/livraisons'
    }
  });
});

export default router;