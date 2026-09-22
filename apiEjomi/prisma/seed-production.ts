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
//   livraison: ['read', 'create', 'update', 'delete', 'export', 'assign'],
  approvisionnement: ['read', 'create', 'update', 'delete', 'export', 'validate'],
//   approvisionnement_matiere_premiere: ['read', 'create', 'update', 'delete'],
//   production: ['read', 'create', 'update', 'delete', 'export', 'statistics'],
//   matiere_premiere: ['read', 'create', 'update', 'delete', 'export'],
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

  // Les clients sont des utilisateurs portant le rôle CLIENT.
  for (const entreprise of entreprises) {
    const scopedPermissions = permissionsByScope.get(String(entreprise.id)) || [];
    const clientPermissions = scopedPermissions.filter(permission => [
      'client.read', 'client.update', 'user.read',
      'produit.read', 'commande.read', 'commande.create',
      'paiement.read', 'paiement.create',
    ].includes(permission.key));
    const clientRole = await ensureRole('CLIENT', entreprise.id);
    await prisma.role.update({
      where: { id: clientRole.id },
      data: { permissions: { set: clientPermissions.map(permission => ({ id: permission.id })) } },
    });
  }

  // Les caissiers peuvent consulter les ventes, les plats, les fournisseurs et les lots.
  for (const entreprise of entreprises) {
    const scopedPermissions = permissionsByScope.get(String(entreprise.id)) || [];
    const cashierPermissions = scopedPermissions.filter(permission => [
      'commande.read', 'commande.create', 'commande.update',
      'produit.read', 'plat.read', 'fournisseur.read', 'approvisionnement.read',
      'user.read', 'client.read',
    ].includes(permission.key));

    for (const roleName of ['CAISSIER', 'CAISSIERE']) {
      const role = await ensureRole(roleName, entreprise.id);
      await prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: {
            set: cashierPermissions.map(permission => ({ id: permission.id })),
          },
        },
      });
    }
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