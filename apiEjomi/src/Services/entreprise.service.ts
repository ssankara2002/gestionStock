import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const getAll = async () => {
  return prisma.entreprise.findMany({
    select: {
      id: true,
      nom: true,
      email: true,
      tel: true,
      adresse: true,
      logo: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

const getById = async (id: number) => {
  return prisma.entreprise.findUnique({
    where: { id },
    select: {
      id: true,
      nom: true,
      email: true,
      tel: true,
      adresse: true,
      logo: true,
      geolocalisation: true,
      histoire: true,
      mission: true,
      vision: true,
      valeur: true,
      heroTitre: true,
      heroSousTitre: true,
      heroImage: true,
      jourouverture: true,
      heureouverture: true,
      jourfermeture: true,
      heurefermeture: true,
      facebook: true,
      instagram: true,
      twitter: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
  });
};

const create = async (entrepriseData: any, adminData: any) => {
  const {
    nom, email, tel, adresse, logo, geolocalisation, siteWeb,
    heroTitre, heroSousTitre, heroImage,
    histoire, mission, vision, valeur,
    facebook, instagram, twitter,
    jourouverture, heureouverture, jourfermeture, heurefermeture,
  } = entrepriseData;
  const { nom: aNom, prenom, email: aEmail, password, tel: aTel, adresse: aAdresse } = adminData;

  if (!nom || !email) throw new Error('Nom et email de l\'entreprise requis');
  if (!aNom || !prenom || !aEmail || !password) throw new Error('Informations admin incomplètes');
  if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères');

  const existingEntreprise = await prisma.entreprise.findUnique({ where: { email } });
  if (existingEntreprise) throw new Error('Une entreprise avec cet email existe déjà');

  const existingUser = await prisma.user.findUnique({ where: { email: aEmail } });
  if (existingUser) throw new Error('Un utilisateur avec cet email existe déjà');

  const hashedPassword = await bcrypt.hash(password, 12);

  return prisma.$transaction(async (tx) => {
    const entreprise = await tx.entreprise.create({
      data: {
        nom, email,
        tel: tel || null,
        adresse: adresse || null,
        logo: logo || null,
        geolocalisation: geolocalisation || null,
        heroTitre: heroTitre || 'Bienvenue',
        heroSousTitre: heroSousTitre || 'Gérez votre stock efficacement',
        heroImage: heroImage || null,
        histoire: histoire || null,
        mission: mission || null,
        vision: vision || null,
        valeur: valeur || null,
        facebook: facebook || null,
        instagram: instagram || null,
        twitter: twitter || null,
        jourouverture: Array.isArray(jourouverture) ? jourouverture : [],
        heureouverture: Array.isArray(heureouverture) ? heureouverture : [],
        jourfermeture: Array.isArray(jourfermeture) ? jourfermeture : [],
        heurefermeture: Array.isArray(heurefermeture) ? heurefermeture : [],
      },
    });

    const adminRole = await tx.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrateur de l\'entreprise',
        entrepriseId: entreprise.id,
      },
    });

    // Ajouter toutes les permissions au rôle ADMIN
    const permissions = await tx.permission.findMany();
    await tx.role.update({
      where: { id: adminRole.id },
      data: { permissions: { connect: permissions.map((p) => ({ id: p.id })) } },
    });

    // Créer les autres rôles de base pour l'entreprise
    const autresRoles = [
      { name: 'DIRECTEUR_GENERAL', description: 'Directeur général' },
      { name: 'GERANT', description: 'Gérant' },
      { name: 'VENDEUR', description: 'Vendeur' },
      { name: 'SECRETAIRE', description: 'Secrétaire' },
      { name: 'MAGASINIER', description: 'Magasinier' },
      { name: 'CLIENT', description: 'Client' },
    ];
    for (const r of autresRoles) {
      await tx.role.create({ data: { ...r, entrepriseId: entreprise.id } });
    }

    const admin = await tx.user.create({
      data: {
        nom: aNom,
        prenom,
        email: aEmail,
        password: hashedPassword,
        tel: aTel || '',
        adresse: aAdresse || '',
        roleId: adminRole.id,
        entrepriseId: entreprise.id,
        employe: {
          create: { salaire: 0, dateEmbauche: new Date() },
        },
      },
    });

    return { entreprise, admin };
  });
};

const update = async (id: number, data: any) => {
  const allowed = [
    'nom', 'email', 'tel', 'adresse', 'logo', 'geolocalisation',
    'histoire', 'mission', 'vision', 'valeur',
    'heroTitre', 'heroSousTitre', 'heroImage',
    'jourouverture', 'heureouverture', 'jourfermeture', 'heurefermeture',
    'facebook', 'instagram', 'twitter',
  ];
  const filtered: any = {};
  for (const key of allowed) {
    if (data[key] !== undefined) filtered[key] = data[key];
  }
  return prisma.entreprise.update({ where: { id }, data: filtered });
};

const deleteEntreprise = async (id: number) => {
  return prisma.entreprise.delete({ where: { id } });
};

export default { getAll, getById, create, update, deleteEntreprise };
