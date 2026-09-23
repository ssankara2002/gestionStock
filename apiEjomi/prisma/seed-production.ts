import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const permissionGroups: Record<string, string[]> = {
  user: ['read', 'create', 'update', 'delete', 'archive'],
  role: ['read', 'create', 'update', 'delete', 'assign_permissions'],
  permission: ['read', 'create', 'update', 'delete'],
  employe: ['read', 'create', 'update', 'delete', 'export', 'statistics'],
  fournisseur: ['read', 'create', 'update', 'delete', 'export'],
  produit: ['read', 'create', 'update', 'delete', 'export', 'statistics'],
  plat: ['read', 'create', 'update', 'delete'],
  commande: ['read', 'create', 'update', 'delete', 'export', 'statistics', 'validate'],
  paiement: ['read', 'create', 'update', 'delete', 'export', 'statistics', 'validate'],
  livraison: ['read', 'create', 'update', 'delete', 'assign'],
  transfert: ['read', 'create', 'update', 'delete'],
  approvisionnement: ['read', 'create', 'update', 'delete', 'export', 'validate'],
  approvisionnement_matiere_premiere: ['read', 'create', 'update', 'delete'],
  production: ['read', 'create', 'update', 'delete', 'export', 'statistics'],
  matiere_premiere: ['read', 'create', 'update', 'delete', 'export'],
  absence: ['read', 'create', 'update', 'delete', 'export', 'statistics'],
  client: ['read', 'create', 'update', 'delete', 'export', 'statistics'],
  conge: ['read', 'create', 'update', 'delete', 'approve', 'reject', 'export'],
  salaire_paiement: ['read', 'create', 'update', 'delete', 'export'],
  transaction: ['read', 'create', 'update', 'delete', 'export', 'statistics'],
  inventaire: ['read', 'create', 'statistics'],
  contact: ['read', 'update', 'delete'],
  entreprise: ['read', 'create', 'update', 'delete', 'manage_admin'],
};

const roleNames = [
  'SUPER_ADMIN',
];

async function ensureRole(name: string, entrepriseId: number | null) {
  const role = await prisma.role.findFirst({ where: { name, entrepriseId } });
  if (role) {
    return role;
  }

  return prisma.role.create({
    data: {
      name,
      description: name === 'SUPER_ADMIN'
        ? 'Super administrateur global avec tous les droits'
        : name === 'ADMIN'
          ? 'Administrateur avec tous les droits'
          : `Rôle ${name}`,
      entrepriseId,
    },
  });
}

async function ensurePermission(key: string, entrepriseId: number | null) {
  const existing = await prisma.permission.findFirst({
    where: { key, entrepriseId },
  });

  if (existing) {
    return prisma.permission.update({
      where: { id: existing.id },
      data: { description: key },
    });
  }

  return prisma.permission.create({
    data: { key, description: key, entrepriseId },
  });
}

async function main() {
  console.log('🌱 Seed de production : permissions, rôles et admin uniquement');

  const misspelledCashierRoles = await prisma.role.findMany({
    where: { name: 'CASSIER' },
    select: { id: true },
  });
  for (const role of misspelledCashierRoles) {
    const [userCount, entrepriseUserCount] = await Promise.all([
      prisma.user.count({ where: { roleId: role.id } }),
      prisma.userEntreprise.count({ where: { roleId: role.id } }),
    ]);
    if (userCount === 0 && entrepriseUserCount === 0) {
      await prisma.role.delete({ where: { id: role.id } });
    }
  }

  const permissionKeys = Object.entries(permissionGroups).flatMap(([resource, actions]) =>
    actions.map(action => `${resource}.${action}`),
  );

  const entreprises = await prisma.entreprise.findMany({ select: { id: true } });
  const scopes: (number | null)[] = entreprises.length > 0
    ? [null, ...entreprises.map(entreprise => entreprise.id)]
    : [null];

  const permissionsByScope = new Map<string, any[]>();
  for (const entrepriseId of scopes) {
    const permissions = [];
    for (const key of permissionKeys) {
      permissions.push(await ensurePermission(key, entrepriseId));
    }
    permissionsByScope.set(String(entrepriseId), permissions);
  }

  // Seuls deux rôles par entreprise : ADMIN (tous les droits) et CAISSIER
  const rolePermissions: Record<string, string[]> = {
    ADMIN: permissionKeys,
    CAISSIER: [
      'commande.read', 'commande.create', 'commande.update',
      'paiement.read', 'paiement.create', 'paiement.update',
      'produit.read',
      'plat.read',
      'client.read', 'client.create',
      'user.read',
    ],
  };

  // Noms des rôles à conserver — supprimer tout autre rôle d'entreprise
  const rolesAConserver = Object.keys(rolePermissions);

  for (const entreprise of entreprises) {
    const scopedPermissions = permissionsByScope.get(String(entreprise.id)) || [];

    // Supprimer les rôles qui ne font plus partie de la liste
    const rolesExistants = await prisma.role.findMany({ where: { entrepriseId: entreprise.id } });
    for (const role of rolesExistants) {
      if (!rolesAConserver.includes(role.name)) {
        // Détacher les utilisateurs avant suppression
        await prisma.user.updateMany({ where: { roleId: role.id }, data: { roleId: null } });
        await prisma.userEntreprise.updateMany({ where: { roleId: role.id }, data: { roleId: null } });
        await prisma.role.delete({ where: { id: role.id } });
        console.log(`🗑️  Rôle supprimé : ${role.name} (entreprise ${entreprise.id})`);
      }
    }

    // Créer/mettre à jour ADMIN et CAISSIER
    for (const [roleName, keys] of Object.entries(rolePermissions)) {
      const role = await ensureRole(roleName, entreprise.id);
      const perms = scopedPermissions.filter(p => keys.includes(p.key));
      await prisma.role.update({
        where: { id: role.id },
        data: { permissions: { set: perms.map(p => ({ id: p.id })) } },
      });
    }
    console.log(`✅ Rôles synchronisés pour l'entreprise ${entreprise.id} : ADMIN, CAISSIER`);
  }

  const adminRoles = [];
  for (const entrepriseId of [null]) {
    for (const roleName of roleNames) {
      const role = await ensureRole(roleName, entrepriseId);
      if (roleName === 'SUPER_ADMIN') {
        adminRoles.push(role);
        await prisma.role.update({
          where: { id: role.id },
          data: {
            permissions: {
              set: (permissionsByScope.get(String(entrepriseId)) || []).map(permission => ({ id: permission.id })),
            },
          },
        });
      }
    }
  }

  const email = process.env.ADMIN_EMAIL || 'admin@maquis.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const firstEntrepriseId = entreprises[0]?.id ?? null;
  const primaryRole = adminRoles.find(role => role.name === 'SUPER_ADMIN' && role.entrepriseId === null);

  if (!primaryRole) {
    throw new Error('Impossible de créer le rôle SUPER_ADMIN');
  }

  const existingAdmin = await prisma.user.findFirst({ where: { email } });
  const admin = existingAdmin
    ? await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          password: await bcrypt.hash(password, 12),
          nom: process.env.ADMIN_NOM || 'Admin',
          prenom: process.env.ADMIN_PRENOM || 'Maquis',
          adresse: process.env.ADMIN_ADRESSE || 'À configurer',
          roleId: primaryRole.id,
          entrepriseId: firstEntrepriseId,
        },
      })
    : await prisma.user.create({
        data: {
          email,
          password: await bcrypt.hash(password, 12),
          nom: process.env.ADMIN_NOM || 'Admin',
          prenom: process.env.ADMIN_PRENOM || 'Maquis',
          adresse: process.env.ADMIN_ADRESSE || 'À configurer',
          roleId: primaryRole.id,
          entrepriseId: firstEntrepriseId,
        },
      });

  for (const entreprise of entreprises) {
    const role = adminRoles.find(candidate => candidate.entrepriseId === entreprise.id);
    if (!role) continue;

    await prisma.userEntreprise.upsert({
      where: { userId_entrepriseId: { userId: admin.id, entrepriseId: entreprise.id } },
      update: { roleId: role.id },
      create: { userId: admin.id, entrepriseId: entreprise.id, roleId: role.id },
    });
  }

  console.log(`✅ ${permissionKeys.length * scopes.length} permissions synchronisées`);
  console.log('✅ Rôle SUPER_ADMIN global synchronisé');
  console.log(`✅ Admin : ${email}`);
}

main()
  .catch(error => {
    console.error('❌ Seed de production échoué:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });