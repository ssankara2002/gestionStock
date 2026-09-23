import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient, User } from '@prisma/client';
import { sendPasswordResetEmail } from './email.service.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'votre_clé_secrète';

if (JWT_SECRET === 'votre_clé_secrète') {
  console.warn("Attention: JWT_SECRET utilise une valeur par défaut.");
}

interface AuthResponse {
  token: string;
  user: any;
}

interface RegisterData {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  adresse?: string;
  tel?: string;
  role?: string;
  entrepriseId?: number;
}

interface EntrepriseData {
  nom: string;
  email: string;
  tel?: string;
  adresse?: string;
}

// Vérifie les credentials et retourne la liste des entreprises du user
const getEntreprises = async (email: string, password: string): Promise<any[]> => {
  const user = await prisma.user.findFirst({
    where: { email },
    include: {
      entreprise: true,
      entreprises: { include: { entreprise: true, role: true } },
    },
  });

  if (!user) throw new Error('Email ou mot de passe incorrect');
  if (!user.password) throw new Error('Email ou mot de passe incorrect');

  const passwordIsValid = await bcrypt.compare(password, user.password);
  if (!passwordIsValid) throw new Error('Email ou mot de passe incorrect');

  // Construire la liste unique d'entreprises : celle du champ direct + celles de UserEntreprise
  const map = new Map<number, any>();

  if (user.entreprise) {
    map.set(user.entreprise.id, { id: user.entreprise.id, nom: user.entreprise.nom, logo: (user.entreprise as any).logo });
  }

  for (const ue of user.entreprises) {
    if (!map.has(ue.entrepriseId)) {
      map.set(ue.entrepriseId, { id: ue.entrepriseId, nom: ue.entreprise.nom, logo: (ue.entreprise as any).logo });
    }
  }

  return Array.from(map.values());
};

const login = async (email: string, password: string, entrepriseId?: number): Promise<AuthResponse> => {
  const user = await prisma.user.findFirst({
    where: { email },
    include: {
      role: { include: { permissions: true } },
      employe: true,
      entreprise: true,
      entreprises: { include: { entreprise: true, role: { include: { permissions: true } } } },
    },
  });

  if (!user) throw new Error('Email ou mot de passe incorrect');
  if (!user.password) throw new Error('Email ou mot de passe incorrect');

  const passwordIsValid = await bcrypt.compare(password, user.password);
  if (!passwordIsValid) throw new Error('Email ou mot de passe incorrect');

  // Déterminer l'entreprise cible
  let targetEntrepriseId = entrepriseId ?? user.entrepriseId ?? undefined;

  // Si aucune entreprise explicite, auto-détecter si le user en a exactement une
  if (!targetEntrepriseId) {
    const allIds = new Set<number>();
    if (user.entrepriseId) allIds.add(user.entrepriseId);
    for (const ue of user.entreprises) allIds.add(ue.entrepriseId);
    if (allIds.size === 1) targetEntrepriseId = [...allIds][0];
  }

  // Résoudre le rôle pour cette entreprise
  let roleName = user.role?.name || 'CLIENT';
  let roleId = user.roleId;
  let resolvedEntrepriseId = targetEntrepriseId;

  if (targetEntrepriseId && user.role?.name !== 'SUPER_ADMIN') {
    // Chercher dans UserEntreprise d'abord (rôle spécifique à cette entreprise)
    const ue = user.entreprises.find(e => e.entrepriseId === targetEntrepriseId);
    if (ue?.role) {
      roleName = ue.role.name;
      roleId = ue.roleId;
    }
    resolvedEntrepriseId = targetEntrepriseId;
  }

  const token = jwt.sign(
    {
      id: user.id,
      userId: user.id,
      email: user.email,
      roleId,
      role: roleName,
      entrepriseId: resolvedEntrepriseId,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { password: _, ...userWithoutPassword } = user;
  return {
    token,
    user: {
      ...userWithoutPassword,
      roleId,
      entrepriseId: resolvedEntrepriseId,
      role: user.role
        ? { ...user.role, id: roleId, name: roleName }
        : { id: roleId, name: roleName },
    },
  };
};

// Inscription d'un employé/utilisateur dans une entreprise existante
const register = async (data: RegisterData): Promise<any> => {
  const { email, password, nom, prenom, adresse, tel, role = 'CLIENT', entrepriseId } = data;

  if (!email || !email.includes('@')) throw new Error('Veuillez fournir un email valide');
  if (password && password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères');
  if (!nom || nom.trim().length < 2) throw new Error('Le nom doit contenir au moins 2 caractères');
  if (!prenom || prenom.trim().length < 2) throw new Error('Le prénom doit contenir au moins 2 caractères');
  const existingUser = await prisma.user.findFirst({ where: { email } });
  if (existingUser) throw new Error('Un utilisateur avec cet email existe déjà');

  let hashedPassword: string | undefined;
  if (password && password.length > 0) {
    hashedPassword = await bcrypt.hash(password, 10);
  }

  // Trouver ou créer le rôle dans le contexte de l'entreprise
  let userRole = await prisma.role.findFirst({
    where: { name: role, entrepriseId: entrepriseId || null },
  });

  if (!userRole) {
    userRole = await prisma.role.create({
      data: { name: role, description: `Rôle ${role}`, entrepriseId: entrepriseId || null },
    });
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      nom,
      prenom,
      adresse: adresse || '',
      tel: tel || '',
      roleId: userRole.id,
      entrepriseId: entrepriseId || null,
    },
    include: { role: true, entreprise: true },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Inscription entreprise : crée l'entreprise + l'admin en une seule transaction
const registerEntreprise = async (entrepriseData: EntrepriseData, adminData: RegisterData): Promise<AuthResponse> => {
  const { nom: eNom, email: eEmail, tel: eTel, adresse: eAdresse } = entrepriseData;
  const { email, password, nom, prenom, tel, adresse } = adminData;

  if (!eNom || !eEmail) throw new Error('Nom et email de l\'entreprise requis');
  if (!email || !password || !nom || !prenom || !tel) throw new Error('Informations admin incomplètes');
  if (password.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères');

  const existingEntreprise = await prisma.entreprise.findUnique({ where: { email: eEmail } });
  if (existingEntreprise) throw new Error('Une entreprise avec cet email existe déjà');

  const existingUser = await prisma.user.findFirst({ where: { email } });
  if (existingUser) throw new Error('Un utilisateur avec cet email existe déjà');

  const hashedPassword = await bcrypt.hash(password, 10);

  // Transaction: entreprise + rôle ADMIN + user admin
  const result = await prisma.$transaction(async (tx) => {
    const entreprise = await tx.entreprise.create({
      data: {
        nom: eNom,
        email: eEmail,
        tel: eTel || null,
        adresse: eAdresse || null,
      },
    });

    const adminRole = await tx.role.create({
      data: {
        name: 'ADMIN',
        description: 'Administrateur de l\'entreprise',
        entrepriseId: entreprise.id,
      },
    });

    const user = await tx.user.create({
      data: {
        email,
        password: hashedPassword,
        nom,
        prenom,
        adresse: adresse || '',
        tel: tel || '',
        roleId: adminRole.id,
        entrepriseId: entreprise.id,
      },
      include: { role: true, entreprise: true },
    });

    return { user, entreprise };
  });

  const token = jwt.sign(
    {
      id: result.user.id,
      userId: result.user.id,
      email: result.user.email,
      roleId: result.user.roleId,
      role: 'ADMIN',
      entrepriseId: result.entreprise.id,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { password: _, ...userWithoutPassword } = result.user;
  return { token, user: userWithoutPassword };
};

const forgotPassword = async (email: string): Promise<void> => {
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) return;

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetPasswordToken: hashedToken, resetPasswordExpires },
  });

  await sendPasswordResetEmail(email, resetToken, `${user.prenom} ${user.nom}`);
};

const resetPassword = async (token: string, newPassword: string): Promise<void> => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { gt: new Date() },
    },
  });

  if (!user) throw new Error('Lien de réinitialisation invalide ou expiré');
  if (newPassword.length < 6) throw new Error('Le mot de passe doit contenir au moins 6 caractères');

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null },
  });
};

const authService = {
  login,
  getEntreprises,
  register,
  registerEntreprise,
  forgotPassword,
  resetPassword,
};

export default authService;
