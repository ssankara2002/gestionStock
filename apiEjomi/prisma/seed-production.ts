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
  commande: ['read', 'create', 'update', 'delete', 'export', 'statistics', 'validate'],
  paiement: ['read', 'create', 'update', 'delete', 'export', 'statistics', 'validate'],
//   livraison: ['read', 'create', 'update', 'delete', 'export', 'assign'],
  approvisionnement: ['read', 'create', 'update', 'delete', 'export', 'validate'],
//   approvisionnement_matiere_premiere: ['read', 'create', 'update', 'delete'],
//   production: ['read', 'create', 'update', 'delete', 'export', 'statistics'],
//   matiere_premiere: ['read', 'create', 'update', 'delete', 'export'],
  absence: ['read', 'create', 'update', 'delete', 'export', 'statistics'],
  conge: ['read', 'create', 'update', 'delete', 'approve', 'reject', 'export'],
  salaire_paiement: ['read', 'create', 'update', 'delete', 'export'],
  transaction: ['read', 'create', 'update', 'delete', 'export', 'statistics'],
  inventaire: ['read', 'create', 'statistics'],
  contact: ['read', 'update', 'delete'],
  entreprise: ['read', 'create', 'update', 'delete', 'manage_admin'],
};

const roleNames = [
  'ADMIN',
  'DIRECTEUR_GENERAL',
  'GERANT',
  'VENDEUR',
  'MAGASINIER',
  'SECRETAIRE',
  'CLIENT',
];

async function ensureRole(name: string, entrepriseId: number | null) {
  const role = await prisma.role.findFirst({ where: { name, entrepriseId } });
  if (role) {
    return role;
  }

  return prisma.role.create({
    data: {
      name,
      description: name === 'ADMIN' ? 'Administrateur avec tous les droits' : `Rôle ${name}`,
      entrepriseId,
    },
  });
}

async function main() {
  console.log('🌱 Seed de production : permissions, rôles et admin uniquement');

  const permissionKeys = Object.entries(permissionGroups).flatMap(([resource, actions]) =>
    actions.map(action => `${resource}.${action}`),
  );

  const permissions = [];
  for (const key of permissionKeys) {
    permissions.push(await prisma.permission.upsert({
      where: { key },
      update: { description: key },
      create: { key, description: key },
    }));
  }

  const entreprises = await prisma.entreprise.findMany({ select: { id: true } });
  const scopes: (number | null)[] = entreprises.length > 0
    ? [null, ...entreprises.map(entreprise => entreprise.id)]
    : [null];

  const adminRoles = [];
  for (const entrepriseId of scopes) {
    for (const roleName of roleNames) {
      const role = await ensureRole(roleName, entrepriseId);
      if (roleName === 'ADMIN') {
        adminRoles.push(role);
        await prisma.role.update({
          where: { id: role.id },
          data: { permissions: { set: permissions.map(permission => ({ id: permission.id })) } },
        });
      }
    }
  }

  const email = process.env.ADMIN_EMAIL || 'admin@maquis.com';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const firstEntrepriseId = entreprises[0]?.id ?? null;
  const primaryRole = adminRoles.find(role => role.entrepriseId === firstEntrepriseId)
    || adminRoles.find(role => role.entrepriseId === null);

  if (!primaryRole) {
    throw new Error('Impossible de créer le rôle ADMIN');
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

  console.log(`✅ ${permissions.length} permissions synchronisées`);
  console.log(`✅ ${roleNames.length} rôles synchronisés par périmètre`);
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