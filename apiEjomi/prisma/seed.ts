import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...');

  // ============================================
  // 1. CRÉATION DES RÔLES
  // ============================================

  console.log('📝 Création des rôles...');

  const roles = [
    { name: 'ADMIN', description: 'Administrateur système avec tous les droits' },
    { name: 'DIRECTEUR_GENERAL', description: 'Directeur général - Gestion complète de l\'entreprise' },
    { name: 'VENDEUR', description: 'Vendeur - Gestion des ventes et commandes clients' },
    { name: 'SECRETAIRE', description: 'Secrétaire - Gestion administrative et saisie' },
    { name: 'GERANT', description: 'Gérant - Supervision générale des opérations' },
    { name: 'CLIENT', description: 'Client - Consultation et commandes' },
    { name: 'MAGASINIER', description: 'Magasinier - Gestion des stocks et approvisionnements' },
  ];

  const createdRoles = [];
  for (const roleData of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleData.name },
      update: {},
      create: roleData
    });
    createdRoles.push(role);
    console.log(`✅ Rôle créé: ${role.name}`);
  }

  // ============================================
  // 2. CRÉATION DES PERMISSIONS
  // ============================================

  console.log('🔐 Création des permissions...');

  const permissions = [
    // Permissions Utilisateurs
    { key: 'user.read', description: 'Consulter les utilisateurs' },
    { key: 'user.create', description: 'Créer des utilisateurs' },
    { key: 'user.update', description: 'Modifier les utilisateurs' },
    { key: 'user.delete', description: 'Supprimer les utilisateurs' },
    { key: 'user.archive', description: 'Archiver les utilisateurs' },

    // Permissions Rôles
    { key: 'role.read', description: 'Consulter les rôles' },
    { key: 'role.create', description: 'Créer des rôles' },
    { key: 'role.update', description: 'Modifier les rôles' },
    { key: 'role.delete', description: 'Supprimer les rôles' },
    { key: 'role.assign_permissions', description: 'Assigner des permissions aux rôles' },

    // Permissions de base
    { key: 'permission.read', description: 'Consulter les permissions' },
    { key: 'permission.create', description: 'Créer des permissions' },
    { key: 'permission.update', description: 'Modifier les permissions' },
    { key: 'permission.delete', description: 'Supprimer les permissions' },

    // Permissions Employés
    { key: 'employe.read', description: 'Consulter les employés' },
    { key: 'employe.create', description: 'Créer des employés' },
    { key: 'employe.update', description: 'Modifier les employés' },
    { key: 'employe.delete', description: 'Supprimer les employés' },
    { key: 'employe.export', description: 'Exporter les employés' },
    { key: 'employe.statistics', description: 'Voir les statistiques des employés' },

    // Permissions Fournisseurs
    { key: 'fournisseur.read', description: 'Consulter les fournisseurs' },
    { key: 'fournisseur.create', description: 'Créer des fournisseurs' },
    { key: 'fournisseur.update', description: 'Modifier les fournisseurs' },
    { key: 'fournisseur.delete', description: 'Supprimer les fournisseurs' },
    { key: 'fournisseur.export', description: 'Exporter les fournisseurs' },

    // Permissions Produits
    { key: 'produit.read', description: 'Consulter les produits' },
    { key: 'produit.create', description: 'Créer des produits' },
    { key: 'produit.update', description: 'Modifier les produits' },
    { key: 'produit.delete', description: 'Supprimer les produits' },
    { key: 'produit.export', description: 'Exporter les produits' },
    { key: 'produit.statistics', description: 'Voir les statistiques des produits' },

    // Permissions Commandes
    { key: 'commande.read', description: 'Consulter les commandes' },
    { key: 'commande.create', description: 'Créer des commandes' },
    { key: 'commande.update', description: 'Modifier les commandes' },
    { key: 'commande.delete', description: 'Supprimer les commandes' },
    { key: 'commande.export', description: 'Exporter les commandes' },
    { key: 'commande.statistics', description: 'Voir les statistiques des commandes' },
    { key: 'commande.validate', description: 'Valider les commandes' },

    // Permissions Paiements
    { key: 'paiement.read', description: 'Consulter les paiements' },
    { key: 'paiement.create', description: 'Enregistrer des paiements' },
    { key: 'paiement.update', description: 'Modifier des paiements' },
    { key: 'paiement.delete', description: 'Supprimer des paiements' },
    { key: 'paiement.export', description: 'Exporter des paiements' },
    { key: 'paiement.statistics', description: 'Voir les statistiques de paiements' },
    { key: 'paiement.validate', description: 'Valider les paiements' },

    // Permissions Livraisons
    { key: 'livraison.read', description: 'Consulter les livraisons' },
    { key: 'livraison.create', description: 'Créer des livraisons' },
    { key: 'livraison.update', description: 'Modifier les livraisons' },
    { key: 'livraison.delete', description: 'Supprimer les livraisons' },
    { key: 'livraison.export', description: 'Exporter les livraisons' },
    { key: 'livraison.assign', description: 'Assigner des livreurs' },

    // Permissions Approvisionnements
    { key: 'approvisionnement.read', description: 'Consulter les approvisionnements' },
    { key: 'approvisionnement.create', description: 'Créer des approvisionnements' },
    { key: 'approvisionnement.update', description: 'Modifier les approvisionnements' },
    { key: 'approvisionnement.delete', description: 'Supprimer les approvisionnements' },
    { key: 'approvisionnement.export', description: 'Exporter les approvisionnements' },
    { key: 'approvisionnement.validate', description: 'Valider les approvisionnements' },

    // Permissions Approvisionnements Matières Premières
    { key: 'approvisionnement_matiere_premiere.read', description: 'Consulter les approvisionnements de matières premières' },
    { key: 'approvisionnement_matiere_premiere.create', description: 'Créer des approvisionnements de matières premières' },
    { key: 'approvisionnement_matiere_premiere.update', description: 'Modifier les approvisionnements de matières premières' },
    { key: 'approvisionnement_matiere_premiere.delete', description: 'Supprimer les approvisionnements de matières premières' },

    // Permissions Production
    { key: 'production.read', description: 'Consulter les productions' },
    { key: 'production.create', description: 'Créer des productions' },
    { key: 'production.update', description: 'Modifier les productions' },
    { key: 'production.delete', description: 'Supprimer les productions' },
    { key: 'production.export', description: 'Exporter les productions' },
    { key: 'production.statistics', description: 'Voir les statistiques de production' },

    // Permissions Matières Premières
    { key: 'matiere_premiere.read', description: 'Consulter les matières premières' },
    { key: 'matiere_premiere.create', description: 'Créer des matières premières' },
    { key: 'matiere_premiere.update', description: 'Modifier les matières premières' },
    { key: 'matiere_premiere.delete', description: 'Supprimer les matières premières' },
    { key: 'matiere_premiere.export', description: 'Exporter les matières premières' },

    // Permissions Absences
    { key: 'absence.read', description: 'Consulter des absences' },
    { key: 'absence.create', description: 'Enregistrer des absences' },
    { key: 'absence.update', description: 'Modifier des absences' },
    { key: 'absence.delete', description: 'Supprimer des absences' },
    { key: 'absence.export', description: 'Exporter des absences' },
    { key: 'absence.statistics', description: 'Voir les statistiques d\'absences' },

    // Permissions Congés
    { key: 'conge.read', description: 'Consulter les congés' },
    { key: 'conge.create', description: 'Demander des congés' },
    { key: 'conge.update', description: 'Modifier les congés' },
    { key: 'conge.delete', description: 'Supprimer les congés' },
    { key: 'conge.approve', description: 'Approuver les congés' },
    { key: 'conge.reject', description: 'Rejeter les congés' },
    { key: 'conge.export', description: 'Exporter les congés' },

    // Permissions Paiements Salaires
    { key: 'salaire_paiement.read', description: 'Consulter les paiements de salaires' },
    { key: 'salaire_paiement.create', description: 'Créer des paiements de salaires' },
    { key: 'salaire_paiement.update', description: 'Modifier les paiements de salaires' },
    { key: 'salaire_paiement.delete', description: 'Supprimer les paiements de salaires' },
    { key: 'salaire_paiement.export', description: 'Exporter les paiements de salaires' },

    // Permissions Transactions
    { key: 'transaction.read', description: 'Consulter les transactions' },
    { key: 'transaction.create', description: 'Créer des transactions' },
    { key: 'transaction.update', description: 'Modifier les transactions' },
    { key: 'transaction.delete', description: 'Supprimer les transactions' },
    { key: 'transaction.export', description: 'Exporter les transactions' },
    { key: 'transaction.statistics', description: 'Voir les statistiques des transactions' },

    // Permissions Inventaire
    { key: 'inventaire.read', description: 'Consulter l\'historique des inventaires' },
    { key: 'inventaire.create', description: 'Effectuer des inventaires et ajuster les stocks' },
    { key: 'inventaire.statistics', description: 'Voir les statistiques d\'inventaire' },

    // Permissions Contact
    { key: 'contact.read', description: 'Consulter les messages de contact' },
    { key: 'contact.update', description: 'Mettre à jour les messages de contact' },
    { key: 'contact.delete', description: 'Supprimer les messages de contact' },

    // Ajouter d'autres permissions selon les besoins

  ];

  const createdPermissions: any[] = [];
  for (const permissionData of permissions) {
    const permission = await prisma.permission.upsert({
      where: { key: permissionData.key },
      update: {},
      create: permissionData
    });
    createdPermissions.push(permission);
  }
  console.log(`✅ ${createdPermissions.length} permissions créées`);

  // ============================================
  // 3. ATTRIBUTION DES PERMISSIONS AUX RÔLES
  // ============================================

  console.log('🔗 Attribution des permissions aux rôles...');

  // ADMIN : Toutes les permissions
  const adminRole = createdRoles.find(r => r.name === 'ADMIN')!;
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        connect: createdPermissions.map(p => ({ id: p.id }))
      }
    }
  });
  console.log(`✅ ADMIN: ${createdPermissions.length} permissions assignées`);

  // DIRECTEUR_GENERAL : Gestion complète de l'entreprise (quasi toutes les permissions sauf suppressions critiques)
  const directeurRole = createdRoles.find(r => r.name === 'DIRECTEUR_GENERAL')!;
  const directeurPermissions = [
    // Gestion des utilisateurs et rôles
    'user.read', 'user.create', 'user.update', , 'user.archive',

    'role.read', 'role.create', 'role.update', , 'role.assign_permissions',

    'permission.read', 'permission.create', 'permission.update', 
    // Gestion des employés
    'employe.read', 'employe.create', 'employe.update', 'employe.export', 'employe.statistics',
    // Gestion des fournisseurs
    'fournisseur.read', 'fournisseur.create', 'fournisseur.update',  'fournisseur.export',
    // Gestion des produits
    'produit.read', 'produit.create', 'produit.update',  'produit.export', 'produit.statistics',
    // Gestion des commandes
    'commande.read', 'commande.create', 'commande.update',  'commande.export', 'commande.statistics', 'commande.validate',
    // Gestion des paiements
    'paiement.read', 'paiement.create', 'paiement.update', , 'paiement.export', 'paiement.statistics', 'paiement.validate',
    // Gestion des livraisons
    'livraison.read', 'livraison.create', 'livraison.update',  'livraison.export', 'livraison.assign',
    // Gestion des approvisionnements
    'approvisionnement.read', 'approvisionnement.create', 'approvisionnement.update',  'approvisionnement.export', 'approvisionnement.validate',
    'approvisionnement_matiere_premiere.read', 'approvisionnement_matiere_premiere.create', 'approvisionnement_matiere_premiere.update', 'approvisionnement_matiere_pre',
    // Gestion de la production
    'production.read', 'production.create', 'production.update', 'production.export', 'production.statistics',
    // Gestion des matières premières
    'matiere_premiere.read', 'matiere_premiere.create', 'matiere_premiere.update',  'matiere_premiere.export',
    // Gestion financière
    'transaction.read', 'transaction.create', 'transaction.update',  'transaction.export', 'transaction.statistics',
    'salaire_paiement.read', 'salaire_paiement.create', 'salaire_paiement.update', 'salaire_paiement.export',
    // Gestion RH
    'absence.read', 'absence.create', 'absence.update', 'absence.export', 'absence.statistics',
    'conge.read', 'conge.create', 'conge.update', 'conge.approve', 'conge.reject', 'conge.export',
    // Inventaire
    'inventaire.read', 'inventaire.create', 'inventaire.statistics',
    // Contact
    'contact.read', 'contact.update', 
  ];

  const directeurPermissionsObjects = directeurPermissions
    .map(key => createdPermissions.find(p => p.key === key))
    .filter(p => p !== undefined);

  await prisma.role.update({
    where: { id: directeurRole.id },
    data: {
      permissions: {
        connect: directeurPermissionsObjects.map(p => ({ id: p!.id }))
      }
    }
  });
  console.log(`✅ DIRECTEUR_GENERAL: ${directeurPermissionsObjects.length} permissions assignées`);

  // VENDEUR : Gestion des ventes
  const vendeurRole = createdRoles.find(r => r.name === 'VENDEUR')!;
  const vendeurPermissions = [
    'commande.read', 'commande.create', 'commande.update', 'commande.export', 'commande.validate',
    'produit.read',
    'paiement.read', 'paiement.create', 'paiement.update',
    'livraison.read', 'livraison.create', 'livraison.update',
    'user.read', 'user.create', 'user.update', 'user.archive',
    'contact.read', 'contact.update', 'contact.delete',
    'inventaire.read', 'inventaire.create', 'inventaire.update', 'inventaire.statistics',

  ];

  const vendeurPermissionsObjects = vendeurPermissions
    .map(key => createdPermissions.find(p => p.key === key))
    .filter(p => p !== undefined);

  await prisma.role.update({
    where: { id: vendeurRole.id },
    data: {
      permissions: {
        connect: vendeurPermissionsObjects.map(p => ({ id: p!.id }))
      }
    }
  });
  console.log(`✅ VENDEUR: ${vendeurPermissionsObjects.length} permissions assignées`);

  // SECRETAIRE : Gestion administrative, ventes et approvisionnements
  const secretaireRole = createdRoles.find(r => r.name === 'SECRETAIRE')!;
  const secretairePermissions = [
    // Gestion des ventes
    'commande.read', 'commande.create', 'commande.update', 'commande.delete', 'commande.export',
    'paiement.read', 'paiement.create', 'paiement.update', 'paiement.delete', 'paiement.export',
    'livraison.read', 'livraison.create', 'livraison.update', 'livraison.delete', 'livraison.export',

    // Gestion des approvisionnements
    'approvisionnement.read', 'approvisionnement.create', 'approvisionnement.update', 'approvisionnement.delete', 'approvisionnement.export',
    'fournisseur.read', 'fournisseur.create', 'fournisseur.update', 'fournisseur.delete', 'fournisseur.export',

    // Gestion administrative
    'user.read', 'user.create', 'user.update',
    'employe.read', 'employe.update',
    'produit.read',
    'transaction.read', 'transaction.create', 'transaction.update', 'transaction.export',
    'absence.read', 'absence.create', 'absence.update', 'absence.export', 'absence.statistics',
    'conge.read', 'conge.create', 'conge.update', 'conge.approve', 'conge.reject', 'conge.export',
    'production.read', 'production.statistics',
  ];

  const secretairePermissionsObjects = secretairePermissions
    .map(key => createdPermissions.find(p => p.key === key))
    .filter(p => p !== undefined);

  await prisma.role.update({
    where: { id: secretaireRole.id },
    data: {
      permissions: {
        connect: secretairePermissionsObjects.map(p => ({ id: p!.id }))
      }
    }
  });
  console.log(`✅ SECRETAIRE: ${secretairePermissionsObjects.length} permissions assignées`);

  // GERANT : Supervision générale
  const gerantRole = createdRoles.find(r => r.name === 'GERANT')!;
  const gerantPermissions = [
    // Gestion des utilisateurs et rôles
    'user.read', 'user.create', 'user.update', , 'user.archive',

    'role.read', 'role.create', 'role.update', , 'role.assign_permissions',
    
    'permission.read', 'permission.create', 'permission.update', 
    // Gestion des employés
    'employe.read', 'employe.create', 'employe.update', 'employe.export', 'employe.statistics',
    // Gestion des fournisseurs
    'fournisseur.read', 'fournisseur.create', 'fournisseur.update',  'fournisseur.export',
    // Gestion des produits
    'produit.read', 'produit.create', 'produit.update',  'produit.export', 'produit.statistics',
    // Gestion des commandes
    'commande.read', 'commande.create', 'commande.update',  'commande.export', 'commande.statistics', 'commande.validate',
    // Gestion des paiements
    'paiement.read', 'paiement.create', 'paiement.update', , 'paiement.export', 'paiement.statistics', 'paiement.validate',
    // Gestion des livraisons
    'livraison.read', 'livraison.create', 'livraison.update',  'livraison.export', 'livraison.assign',
    // Gestion des approvisionnements
    'approvisionnement.read', 'approvisionnement.create', 'approvisionnement.update',  'approvisionnement.export', 'approvisionnement.validate',
    'approvisionnement_matiere_premiere.read', 'approvisionnement_matiere_premiere.create', 'approvisionnement_matiere_premiere.update', 'approvisionnement_matiere_pre',
    // Gestion de la production
    'production.read', 'production.create', 'production.update', 'production.export', 'production.statistics',
    // Gestion des matières premières
    'matiere_premiere.read', 'matiere_premiere.create', 'matiere_premiere.update',  'matiere_premiere.export',
    // Gestion financière
    'transaction.read', 'transaction.create', 'transaction.update',  'transaction.export', 'transaction.statistics',
    'salaire_paiement.read', 'salaire_paiement.create', 'salaire_paiement.update', 'salaire_paiement.export',
    // Gestion RH
    'absence.read', 'absence.create', 'absence.update', 'absence.export', 'absence.statistics',
    'conge.read', 'conge.create', 'conge.update', 'conge.approve', 'conge.reject', 'conge.export',
    // Inventaire
    'inventaire.read', 'inventaire.create', 'inventaire.statistics',
    // Contact
    'contact.read', 'contact.update', 
    
  ];

  const gerantPermissionsObjects = gerantPermissions
    .map(key => createdPermissions.find(p => p.key === key))
    .filter(p => p !== undefined);

  await prisma.role.update({
    where: { id: gerantRole.id },
    data: {
      permissions: {
        connect: gerantPermissionsObjects.map(p => ({ id: p!.id }))
      }
    }
  });
  console.log(`✅ GERANT: ${gerantPermissionsObjects.length} permissions assignées`);

  // CLIENT : Consultation et commandes
  const clientRole = createdRoles.find(r => r.name === 'CLIENT')!;
  const clientPermissions = [
    'produit.read',
    'commande.read', 'commande.create',
    'paiement.read', 'paiement.create'
  ];

  const clientPermissionsObjects = clientPermissions
    .map(key => createdPermissions.find(p => p.key === key))
    .filter(p => p !== undefined);

  await prisma.role.update({
    where: { id: clientRole.id },
    data: {
      permissions: {
        connect: clientPermissionsObjects.map(p => ({ id: p!.id }))
      }
    }
  });
  console.log(`✅ CLIENT: ${clientPermissionsObjects.length} permissions assignées`);

  // MAGASINIER : Gestion des stocks
  const magasinierRole = createdRoles.find(r => r.name === 'MAGASINIER')!;
  const magasinierPermissions = [
    'produit.read', 'produit.create', 'produit.update',
    'matiere_premiere.read', 'matiere_premiere.create', 'matiere_premiere.update',
    'approvisionnement.read', 'approvisionnement.create', 'approvisionnement.update',
    'approvisionnement_matiere_premiere.read', 'approvisionnement_matiere_premiere.create', 'approvisionnement_matiere_premiere.update',
    'production.read', 'production.create', 'production.update',
    'fournisseur.read', 'fournisseur.create', 'fournisseur.update',
    'livraison.read', 'livraison.update', 'livraison.assign',
    'inventaire.read', 'inventaire.create', 'inventaire.update', 'inventaire.statistics',
  ];

  const magasinierPermissionsObjects = magasinierPermissions
    .map(key => createdPermissions.find(p => p.key === key))
    .filter(p => p !== undefined);

  await prisma.role.update({
    where: { id: magasinierRole.id },
    data: {
      permissions: {
        connect: magasinierPermissionsObjects.map(p => ({ id: p!.id }))
      }
    }
  });
  console.log(`✅ MAGASINIER: ${magasinierPermissionsObjects.length} permissions assignées`);

  // ============================================
  // 4. CRÉATION D'UN UTILISATEUR ADMIN PAR DÉFAUT
  // ============================================

  console.log('👤 Création de l\'utilisateur admin par défaut...');

  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@ejomi.com' },
    include: { employe: true }
  });

  if (adminUser) {
    console.log('✅ Utilisateur admin existe déjà:', adminUser.email);

    // Vérifier si l'admin a un compte employé
    if (!adminUser.employe) {
      console.log('⚠️  L\'admin n\'a pas de compte employé, création en cours...');
      await prisma.employe.create({
        data: {
          userId: adminUser.id,
          salaire: 0,
          dateEmbauche: new Date()
        }
      });
      console.log('✅ Compte employé créé pour l\'admin');
    } else {
      console.log('✅ L\'admin a déjà un compte employé');
    }
  } else {
    const hashedPassword = await bcrypt.hash('admin123', 12);

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@ejomi.com',
        password: hashedPassword,
        nom: 'Admin',
        prenom: 'System',
        adresse: 'Siège social',
        tel: '00000000',
        role: {
          connect: { id: adminRole.id }
        },
        employe: {
          create: {
            salaire: 0,
            dateEmbauche: new Date()
          }
        }
      }
    });

    console.log(`✅ Utilisateur admin créé avec compte employé: ${adminUser.email}`);
  }

  // ============================================
  // 5. AFFICHAGE DU RÉSUMÉ
  // ============================================

  console.log('\n📊 RÉSUMÉ DU SEED:');
  console.log(`• ${createdRoles.length} rôles créés`);
  console.log(`• ${createdPermissions.length} permissions créées`);
  console.log('• Attribution des permissions terminée');
  console.log('• Utilisateur admin vérifié/créé');

  console.log('\n🔐 COMPTE ADMIN PAR DÉFAUT:');
  console.log('Email: admin@ejomi.com');
  console.log('Mot de passe: admin123');

  console.log('\n✅ Seed terminé avec succès!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Erreur lors du seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });