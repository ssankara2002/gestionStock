import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Liste complète des permissions par ressource
const permissions = [
  // User permissions
  { key: 'user.read', description: 'Voir les utilisateurs' },
  { key: 'user.create', description: 'Créer un utilisateur' },
  { key: 'user.update', description: 'Modifier un utilisateur' },
  { key: 'user.delete', description: 'Supprimer un utilisateur' },

  // Role permissions
  { key: 'role.read', description: 'Voir les rôles' },
  { key: 'role.create', description: 'Créer un rôle' },
  { key: 'role.update', description: 'Modifier un rôle' },
  { key: 'role.delete', description: 'Supprimer un rôle' },
  { key: 'role.assign_permissions', description: 'Assigner des permissions aux rôles' },

  // Permission permissions
  { key: 'permission.read', description: 'Voir les permissions' },
  { key: 'permission.create', description: 'Créer une permission' },
  { key: 'permission.update', description: 'Modifier une permission' },
  { key: 'permission.delete', description: 'Supprimer une permission' },

  // Employe permissions
  { key: 'employe.read', description: 'Voir les employés' },
  { key: 'employe.create', description: 'Créer un employé' },
  { key: 'employe.update', description: 'Modifier un employé' },
  { key: 'employe.delete', description: 'Supprimer un employé' },
  { key: 'employe.export', description: 'Exporter les données employés' },

  // Absence permissions
  { key: 'absence.read', description: 'Voir les absences' },
  { key: 'absence.create', description: 'Créer une absence' },
  { key: 'absence.update', description: 'Modifier une absence' },
  { key: 'absence.delete', description: 'Supprimer une absence' },
  { key: 'absence.statistics', description: 'Voir les statistiques d\'absences' },

  // Conge permissions
  { key: 'conge.read', description: 'Voir les congés' },
  { key: 'conge.create', description: 'Créer un congé' },
  { key: 'conge.update', description: 'Modifier un congé' },
  { key: 'conge.delete', description: 'Supprimer un congé' },

  // Produit permissions
  { key: 'produit.read', description: 'Voir les produits' },
  { key: 'produit.create', description: 'Créer un produit' },
  { key: 'produit.update', description: 'Modifier un produit' },
  { key: 'produit.delete', description: 'Supprimer un produit' },

  // Plat permissions
  { key: 'plat.read', description: 'Voir les plats et préparations' },
  { key: 'plat.create', description: 'Créer un plat' },
  { key: 'plat.update', description: 'Modifier un plat / enregistrer une préparation' },
  { key: 'plat.delete', description: 'Supprimer un plat' },

  // Commande permissions
  { key: 'commande.read', description: 'Voir les commandes / ventes' },
  { key: 'commande.create', description: 'Créer une commande / vente' },
  { key: 'commande.update', description: 'Modifier une commande' },
  { key: 'commande.delete', description: 'Supprimer une commande' },

  // Paiement permissions
  { key: 'paiement.read', description: 'Voir les paiements' },
  { key: 'paiement.create', description: 'Créer un paiement' },
  { key: 'paiement.update', description: 'Modifier un paiement' },
  { key: 'paiement.delete', description: 'Supprimer un paiement' },

  // Livraison permissions
  { key: 'livraison.read', description: 'Voir les livraisons' },
  { key: 'livraison.create', description: 'Créer une livraison' },
  { key: 'livraison.update', description: 'Modifier une livraison' },
  { key: 'livraison.delete', description: 'Supprimer une livraison' },
  { key: 'livraison.assign', description: 'Assigner une livraison' },

  // Fournisseur permissions
  { key: 'fournisseur.read', description: 'Voir les fournisseurs' },
  { key: 'fournisseur.create', description: 'Créer un fournisseur' },
  { key: 'fournisseur.update', description: 'Modifier un fournisseur' },
  { key: 'fournisseur.delete', description: 'Supprimer un fournisseur' },

  // Approvisionnement produits permissions
  { key: 'approvisionnement.read', description: 'Voir les approvisionnements produits' },
  { key: 'approvisionnement.create', description: 'Créer un approvisionnement produits' },
  { key: 'approvisionnement.update', description: 'Modifier un approvisionnement produits' },
  { key: 'approvisionnement.delete', description: 'Supprimer un approvisionnement produits' },

  // Approvisionnement matières premières permissions
  { key: 'approvisionnement_matiere_premiere.read', description: 'Voir les approvisionnements ingrédients' },
  { key: 'approvisionnement_matiere_premiere.create', description: 'Créer un approvisionnement ingrédients' },
  { key: 'approvisionnement_matiere_premiere.update', description: 'Modifier un approvisionnement ingrédients' },
  { key: 'approvisionnement_matiere_premiere.delete', description: 'Supprimer un approvisionnement ingrédients' },

  // Matière première (ingrédients) permissions
  { key: 'matiere_premiere.read', description: 'Voir les ingrédients' },
  { key: 'matiere_premiere.create', description: 'Créer un ingrédient' },
  { key: 'matiere_premiere.update', description: 'Modifier un ingrédient / inventaire ingrédients' },
  { key: 'matiere_premiere.delete', description: 'Supprimer un ingrédient' },

  // Lot de stock permissions
  { key: 'lot_stock.read', description: 'Voir les lots de stock et le rapport des lots' },
  { key: 'lot_stock.update', description: 'Modifier un lot de stock' },
  { key: 'lot_stock.delete', description: 'Supprimer un lot de stock' },

  // Transfert de stock permissions
  { key: 'transfert.read', description: 'Voir les transferts de stock' },
  { key: 'transfert.create', description: 'Créer un transfert de stock' },
  { key: 'transfert.update', description: 'Modifier un transfert' },
  { key: 'transfert.delete', description: 'Supprimer un transfert' },

  // Inventaire permissions
  { key: 'inventaire.read', description: 'Voir les inventaires' },
  { key: 'inventaire.create', description: 'Créer / valider un inventaire' },
  { key: 'inventaire.update', description: 'Modifier un inventaire' },
  { key: 'inventaire.delete', description: 'Supprimer un inventaire' },

  // Transaction / bilan permissions
  { key: 'transaction.read', description: 'Voir les transactions et le bilan financier' },
  { key: 'transaction.create', description: 'Créer une transaction' },
  { key: 'transaction.update', description: 'Modifier une transaction' },
  { key: 'transaction.delete', description: 'Supprimer une transaction' },

  // Contact permissions
  { key: 'contact.read', description: 'Voir les messages / contacts' },
  { key: 'contact.create', description: 'Créer un contact' },
  { key: 'contact.update', description: 'Modifier un contact' },
  { key: 'contact.delete', description: 'Supprimer un contact' },

  // Salaire paiement permissions
  { key: 'salaire_paiement.read', description: 'Voir les paiements de salaires' },
  { key: 'salaire_paiement.create', description: 'Créer un paiement de salaire' },
  { key: 'salaire_paiement.update', description: 'Modifier un paiement de salaire' },
  { key: 'salaire_paiement.delete', description: 'Supprimer un paiement de salaire' },
  { key: 'salaire_paiement.export', description: 'Exporter / télécharger bulletin de paie' },

  // Dashboard
  { key: 'dashboard.read', description: 'Voir le tableau de bord' },
];

async function main() {
  console.log('🌱 Début du seeding des permissions...');

  // Créer toutes les permissions (entrepriseId null = permission globale)
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { key_entrepriseId: { key: permission.key, entrepriseId: null as any } },
      update: { description: permission.description },
      create: { ...permission, entrepriseId: null },
    });
  }

  console.log(`✅ ${permissions.length} permissions créées/mises à jour`);

  // Trouver ou créer le rôle ADMIN
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Administrateur avec tous les droits',
    },
  });

  console.log(`✅ Rôle ADMIN trouvé/créé (ID: ${adminRole.id})`);

  // Récupérer toutes les permissions
  const allPermissions = await prisma.permission.findMany();

  // Assigner TOUTES les permissions au rôle ADMIN
  await prisma.role.update({
    where: { id: adminRole.id },
    data: {
      permissions: {
        set: allPermissions.map(p => ({ id: p.id })),
      },
    },
  });

  console.log(`✅ ${allPermissions.length} permissions assignées au rôle ADMIN`);

  // Créer d'autres rôles par défaut
  const gerantRole = await prisma.role.upsert({
    where: { name: 'GERANT' },
    update: {},
    create: {
      name: 'GERANT',
      description: 'Gérant avec accès à la gestion quotidienne',
    },
  });

  const vendeurRole = await prisma.role.upsert({
    where: { name: 'VENDEUR' },
    update: {},
    create: {
      name: 'VENDEUR',
      description: 'Vendeur avec accès aux ventes',
    },
  });

  const magasinierRole = await prisma.role.upsert({
    where: { name: 'MAGASINIER' },
    update: {},
    create: {
      name: 'MAGASINIER',
      description: 'Magasinier avec accès au stock',
    },
  });

  const secretaireRole = await prisma.role.upsert({
    where: { name: 'SECRETAIRE' },
    update: {},
    create: {
      name: 'SECRETAIRE',
      description: 'Secrétaire avec accès aux ventes et approvisionnements',
    },
  });

  // Configurer les permissions pour SECRETAIRE
  const secretairePermissions = [
    // Ventes (Commandes, Clients, Paiements, Livraisons)
    'commande.read', 'commande.create', 'commande.update', 'commande.delete',
    'paiement.read', 'paiement.create', 'paiement.update', 'paiement.delete',
    'livraison.read', 'livraison.create', 'livraison.update', 'livraison.delete',
    'user.read', 'user.create', 'user.update', // Gestion clients

    // Approvisionnements
    'approvisionnement.read', 'approvisionnement.create', 'approvisionnement.update', 'approvisionnement.delete',
    'fournisseur.read', 'fournisseur.create', 'fournisseur.update', 'fournisseur.delete',

    // Produits (lecture uniquement pour les ventes/appro)
    'produit.read',
  ];

  const secretairePermissionRecords = await prisma.permission.findMany({
    where: { key: { in: secretairePermissions } },
  });

  await prisma.role.update({
    where: { id: secretaireRole.id },
    data: {
      permissions: {
        set: secretairePermissionRecords.map(p => ({ id: p.id })),
      },
    },
  });

  console.log('✅ Rôles par défaut créés : ADMIN, GERANT, VENDEUR, MAGASINIER, SECRETAIRE');
  console.log(`✅ ${secretairePermissionRecords.length} permissions assignées au rôle SECRETAIRE`);
//hhhhhhhhhhhhhhhhhh
  console.log('\n🎉 Seeding terminé avec succès !');
  console.log('\n📊 Résumé :');
  console.log(`   - Permissions créées : ${permissions.length}`);
  console.log(`   - Rôle ADMIN : ${allPermissions.length} permissions`);
  console.log(`   - Rôle SECRETAIRE : ${secretairePermissionRecords.length} permissions`);
  console.log(`   - Autres rôles : 0 permission (à configurer manuellement)`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
