import { Request, Response } from 'express';
import employeService from '../Services/employe.service';
import { getPaginationParams, createPaginationResult } from '../utils/pagination.js';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

export const getEmployesPublic = async (_req: Request, res: Response): Promise<void> => {
  try {
    const employes = await prisma.employe.findMany({
      select: {
        id: true,
        user: {
          select: {
            prenom: true,
            nom: true,
            image: true,
            role: { select: { name: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.status(200).json({ success: true, data: employes });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.', error: error.message });
  }
};

export const getAllEmployes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entrepriseId = req.user?.entrepriseId;
    const employes = await employeService.getAllEmployes(entrepriseId);
    res.status(200).json({ success: true, data: employes });
  } catch (error: any) {
    console.error("Erreur dans getAllEmployes:", error.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des employés', error: error.message });
  }
};

export const getEmployeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const employe = await employeService.getEmployeById(parseInt(id));

    if (!employe) {
      res.status(404).json({ success: false, message: 'Employé introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: employe });
  } catch (error: any) {
    console.error(`Erreur dans getEmployeById pour l'id ${req.params.id}:`, error.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de l\'employé', error: error.message });
  }
};

export const createEmploye = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, salaire, dateEmbauche } = req.body;

    if (!userId || !salaire || !dateEmbauche) {
      res.status(400).json({ success: false, message: 'Les champs userId, salaire et dateEmbauche sont obligatoires' });
      return;
    }

    const employeData = {
      userId: parseInt(userId),
      salaire: parseFloat(salaire),
      dateEmbauche: new Date(dateEmbauche)
    };
    const employe = await employeService.createEmploye(employeData);

    res.status(201).json({ success: true, message: 'Employé créé avec succès', data: employe });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Un employé avec cet utilisateur existe déjà' });
    } else {
      console.error("Erreur dans createEmploye:", error.message);
      res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'employé', error: error.message });
    }
  }
};

export const updateEmploye = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId, salaire, dateEmbauche } = req.body;

    const employeData: any = {};
    if (userId) employeData.userId = parseInt(userId);
    if (salaire) employeData.salaire = parseFloat(salaire);
    if (dateEmbauche) employeData.dateEmbauche = new Date(dateEmbauche);

    const employe = await employeService.updateEmploye(parseInt(id), employeData);

    res.status(200).json({ success: true, message: 'Employé mis à jour avec succès', data: employe });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Employé introuvable' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Un employé avec cet utilisateur existe déjà' });
    } else {
      console.error(`Erreur dans updateEmploye pour l'id ${req.params.id}:`, error.message);
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l\'employé', error: error.message });
    }
  }
};

export const deleteEmploye = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await employeService.deleteEmploye(parseInt(id));

    res.status(200).json({ success: true, message: 'Employé supprimé avec succès' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Employé introuvable' });
    } else {
      console.error(`Erreur dans deleteEmploye pour l'id ${req.params.id}:`, error.message);
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression de l\'employé', error: error.message });
    }
  }
};

export const getEmployeByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const employe = await employeService.getEmployeByUserId(parseInt(userId));

    if (!employe) {
      res.status(404).json({ success: false, message: 'Employé introuvable pour cet utilisateur' });
      return;
    }

    res.status(200).json({ success: true, data: employe });
  } catch (error: any) {
    console.error(`Erreur dans getEmployeByUserId pour l'userId ${req.params.userId}:`, error.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de l\'employé', error: error.message });
  }
};

export const getEmployeStatistics = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await employeService.getEmployeStatistics(req.user?.entrepriseId);
    res.status(200).json({ success: true, data: stats });
  } catch (error: any) {
    console.error("Erreur dans getEmployeStatistics:", error.message);
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des statistiques', error: error.message });
  }
};

export const createEmployeWithUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { nom, prenom, email, adresse, tel, password, roleId, salaire, dateEmbauche } = req.body;

    // Validation des champs obligatoires
    if (!nom || !prenom || !adresse || !salaire || !dateEmbauche) {
      res.status(400).json({
        success: false,
        message: 'Les champs nom, prénom, adresse, salaire et date d\'embauche sont obligatoires'
      });
      return;
    }
    if (!email && !tel) {
      res.status(400).json({ success: false, message: 'Un email ou un numéro de téléphone est requis' });
      return;
    }

    // Validation du salaire
    if (salaire <= 0) {
      res.status(400).json({
        success: false,
        message: 'Le salaire doit être supérieur à 0'
      });
      return;
    }

    // Validation de l'email si fourni
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({
        success: false,
        message: 'L\'adresse email n\'est pas valide'
      });
      return;
    }

    const entrepriseId = req.user?.entrepriseId;
    const parsedRoleId = roleId !== undefined && roleId !== null && roleId !== '' ? Number(roleId) : undefined;

    if (parsedRoleId !== undefined) {
      const role = await prisma.role.findUnique({
        where: { id: parsedRoleId },
        select: { id: true, entrepriseId: true },
      });

      if (!role || role.entrepriseId !== entrepriseId) {
        res.status(400).json({
          success: false,
          message: 'Le rôle sélectionné n\'appartient pas à cette entreprise',
        });
        return;
      }
    }

    const employeData = {
      nom,
      prenom,
      email: email || null,
      adresse,
      tel,
      password: password || null,
      roleId: parsedRoleId,
      salaire: parseFloat(salaire),
      dateEmbauche: new Date(dateEmbauche),
      entrepriseId,
    };

    const employe = await employeService.createEmployeWithUser(employeData);

    res.status(201).json({
      success: true,
      message: 'Employé créé avec succès',
      data: employe
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Violation de contrainte unique (email ou téléphone déjà utilisé)
      const target = error.meta?.target;
      if (target?.includes('email')) {
        res.status(400).json({ success: false, message: 'Cette adresse email est déjà utilisée' });
      } else if (target?.includes('tel')) {
        res.status(400).json({ success: false, message: 'Ce numéro de téléphone est déjà utilisé' });
      } else {
        res.status(400).json({ success: false, message: 'Un utilisateur avec ces informations existe déjà' });
      }
    } else {
      console.error("Erreur dans createEmployeWithUser:", error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de l\'employé',
        error: error.message
      });
    }
  }
};

export const updateEmployeWithUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, adresse, tel, password, roleId, salaire, dateEmbauche } = req.body;

    const entrepriseId = (req as any).user?.entrepriseId;
    const parsedRoleId = roleId !== undefined && roleId !== null && roleId !== '' ? Number(roleId) : undefined;

    if (parsedRoleId !== undefined) {
      const role = await prisma.role.findUnique({
        where: { id: parsedRoleId },
        select: { id: true, entrepriseId: true },
      });

      if (!role || role.entrepriseId !== entrepriseId) {
        res.status(400).json({
          success: false,
          message: 'Le rôle sélectionné n\'appartient pas à cette entreprise',
        });
        return;
      }
    }

    const employeData: any = {};
    if (nom) employeData.nom = nom;
    if (prenom) employeData.prenom = prenom;
    if (email !== undefined) employeData.email = email;
    if (adresse) employeData.adresse = adresse;
    if (tel) employeData.tel = tel;
    if (password) employeData.password = password;
    if (parsedRoleId !== undefined) {
      employeData.roleId = parsedRoleId;
    } else if (roleId === '') {
      employeData.roleId = null;
    }
    if (salaire) employeData.salaire = parseFloat(salaire);
    if (dateEmbauche) employeData.dateEmbauche = new Date(dateEmbauche);

    const employe = await employeService.updateEmployeWithUser(parseInt(id), employeData);

    res.status(200).json({ success: true, message: 'Employé mis à jour avec succès', data: employe });
  } catch (error: any) {
    if (error.message === 'Employé introuvable') {
      res.status(404).json({ success: false, message: 'Employé introuvable' });
    } else if (error.code === 'P2002') {
      // Violation de contrainte unique (email ou téléphone déjà utilisé)
      const target = error.meta?.target;
      if (target?.includes('email')) {
        res.status(400).json({ success: false, message: 'Cette adresse email est déjà utilisée' });
      } else if (target?.includes('tel')) {
        res.status(400).json({ success: false, message: 'Ce numéro de téléphone est déjà utilisé' });
      } else {
        res.status(400).json({ success: false, message: 'Un utilisateur avec ces informations existe déjà' });
      }
    } else {
      console.error(`Erreur dans updateEmployeWithUser pour l'id ${req.params.id}:`, error.message);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'employé',
        error: error.message
      });
    }
  }
};