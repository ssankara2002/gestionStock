import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification des utilisateurs sans rôle...\n');

  // Récupérer tous les utilisateurs
  const users = await prisma.user.findMany({
    include: {
      role: true,
    },
  });

  console.log(`📊 ${users.length} utilisateur(s) trouvé(s)\n`);

  // Trouver les rôles disponibles
  const adminRole = await prisma.role.findFirst({ where: { name: 'ADMIN' } });
  const clientRole = await prisma.role.findFirst({ where: { name: 'CLIENT' } });

  if (!adminRole) {
    console.error('❌ Rôle ADMIN introuvable ! Exécutez d\'abord seed-permissions.ts');
    return;
  }

  if (!clientRole) {
    console.log('⚠️  Rôle CLIENT introuvable, création...');
    const newClientRole = await prisma.role.create({
      data: {
        name: 'CLIENT',
        description: 'Client de l\'application',
      },
    });
    console.log(`✅ Rôle CLIENT créé (ID: ${newClientRole.id})\n`);
  }

  // Traiter chaque utilisateur
  for (const user of users) {
    console.log(`👤 ${user.nom} ${user.prenom} (${user.email})`);

    if (user.roleId && user.role) {
      console.log(`   ✓ Rôle déjà assigné: ${user.role.name}`);
    } else {
      // Premier utilisateur devient ADMIN, les autres deviennent CLIENT
      const isFirstUser = users.indexOf(user) === 0;
      const roleToAssign = isFirstUser ? adminRole : (clientRole || adminRole);

      await prisma.user.update({
        where: { id: user.id },
        data: { roleId: roleToAssign.id },
      });

      console.log(`   ✅ Rôle assigné: ${roleToAssign.name}`);
    }
    console.log('');
  }

  console.log('🎉 Opération terminée !');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
