import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface EmployeCreateData {
  userId: number;
  salaire: number;
  dateEmbauche: Date;
}

interface EmployeUpdateData {
  userId?: number;
  salaire?: number;
  dateEmbauche?: Date;
}

interface EmployeWithUserCreateData {
  nom: string;
  prenom: string;
  email?: string;
  adresse: string;
  tel: string;
  password?: string;
  roleId?: number;
  salaire: number;
  dateEmbauche: Date;
  entrepriseId?: number;
}

interface EmployeWithUserUpdateData {
  nom?: string;
  prenom?: string;
  email?: string;
  adresse?: string;
  tel?: string;
  password?: string;
  roleId?: number;
  salaire?: number;
  dateEmbauche?: Date;
}

const getAllEmployes = async (entrepriseId?: number) => {
  const where: any = entrepriseId ? { user: { entrepriseId } } : {};
  return await prisma.employe.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          tel: true,
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
      // absences: true,
      // conges: true,
      // paiements: true,
      // commandes: true,
      // livraisons: true,
      // approvisionnements: true,
      // productions: true,
    },
    orderBy: { user: { updatedAt: 'desc' } }
  });
};

const getEmployeById = async (id: number) => {
  return await prisma.employe.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          tel: true,
          adresse: true,
          roleId: true, // Assurer que roleId est toujours inclus
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  });
};

const createEmploye = async (data: EmployeCreateData) => {
  return await prisma.employe.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          tel: true,
        },
      },
    },
  });
};

const updateEmploye = async (id: number, data: EmployeUpdateData) => {
  return await prisma.employe.update({
    where: { id },
    data,
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          tel: true,
        },
      },
    },
  });
};

const deleteEmploye = async (id: number) => {
  return await prisma.employe.delete({
    where: { id },
  });
};

const getEmployeByUserId = async (userId: number) => {
  return await prisma.employe.findUnique({
    where: { userId },
    include: {
      user: true,
    },
  });
};

const createEmployeWithUser = async (data: EmployeWithUserCreateData) => {
  return await prisma.$transaction(async (tx) => {
    // Hacher le mot de passe s'il est fourni
    let hashedPassword: string | undefined;
    if (data.password && data.password.length > 0) {
      hashedPassword = await bcrypt.hash(data.password, 10);
    }

    const user = await tx.user.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        adresse: data.adresse,
        tel: data.tel,
        password: hashedPassword,
        roleId: data.roleId,
        entrepriseId: data.entrepriseId,
      },
    });

    const employe = await tx.employe.create({
      data: {
        userId: user.id,
        salaire: data.salaire,
        dateEmbauche: data.dateEmbauche,
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            tel: true,
            adresse: true,
          },
        },
      },
    });

    return employe;
  });
};

const getEmployeStatistics = async (entrepriseId?: number) => {
  const w = entrepriseId ? { user: { entrepriseId } } : {};
  const [total, totalSalaires, averageSalaire] = await Promise.all([
    prisma.employe.count({ where: w }),
    prisma.employe.aggregate({ where: w, _sum: { salaire: true } }),
    prisma.employe.aggregate({ where: w, _avg: { salaire: true } }),
  ]);

  return {
    totalEmployes: total,
    totalSalaires: totalSalaires._sum.salaire || 0,
    averageSalaire: averageSalaire._avg.salaire || 0,
  };
};

const updateEmployeWithUser = async (id: number, data: EmployeWithUserUpdateData) => {
  return await prisma.$transaction(async (tx) => {
    // Récupérer l'employé avec son utilisateur
    const employe = await tx.employe.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employe) {
      throw new Error('Employé introuvable');
    }

    // Préparer les données utilisateur à mettre à jour
    const userData: any = {};
    if (data.nom) userData.nom = data.nom;
    if (data.prenom) userData.prenom = data.prenom;
    if (data.email !== undefined) userData.email = data.email;
    if (data.adresse) userData.adresse = data.adresse;
    if (data.tel) userData.tel = data.tel;
    // Hacher le nouveau mot de passe s'il est fourni
    if (data.password && data.password.length > 0) {
      userData.password = await bcrypt.hash(data.password, 10);
    }
    if (data.roleId !== undefined) userData.roleId = data.roleId;

    // Mettre à jour l'utilisateur s'il y a des données utilisateur
    if (Object.keys(userData).length > 0) {
      await tx.user.update({
        where: { id: employe.userId },
        data: userData,
      });
    }

    // Préparer les données employé à mettre à jour
    const employeData: any = {};
    if (data.salaire) employeData.salaire = data.salaire;
    if (data.dateEmbauche) employeData.dateEmbauche = data.dateEmbauche;

    // Mettre à jour l'employé s'il y a des données employé
    if (Object.keys(employeData).length > 0) {
      await tx.employe.update({
        where: { id },
        data: employeData,
      });
    }

    // Retourner l'employé mis à jour avec les informations utilisateur
    return await tx.employe.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            tel: true,
            adresse: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });
  });
};

export default {
  getAllEmployes,
  getEmployeById,
  createEmploye,
  createEmployeWithUser,
  updateEmploye,
  updateEmployeWithUser,
  deleteEmploye,
  getEmployeByUserId,
  getEmployeStatistics,
};