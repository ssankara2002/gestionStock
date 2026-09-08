import { Request, Response } from 'express';
import userService from '../Services/user.service';
import { PrismaClient } from '@prisma/client';
import { getPaginationParams, createPaginationResult } from '../utils/pagination.js';
import { AuthenticatedRequest } from '../middlewares/authMiddleware.js';

const prisma = new PrismaClient();

export const getOrCreateClientAnonyme = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const entrepriseId = (_req as any).user?.entrepriseId;
    const clientRole = await prisma.role.findFirst({ where: { name: 'CLIENT', ...(entrepriseId ? { entrepriseId } : {}) } });
    if (!clientRole) {
      res.status(500).json({ success: false, message: "Rôle CLIENT introuvable." });
      return;
    }

    let client = await prisma.user.findFirst({
      where: { tel: '0000000000', roleId: clientRole.id, ...(entrepriseId ? { entrepriseId } : {}) },
    });

    if (!client) {
      client = await prisma.user.create({
        data: {
          nom: 'Anonyme',
          prenom: 'Client',
          tel: '0000000000',
          adresse: '-',
          roleId: clientRole.id,
          ...(entrepriseId ? { entrepriseId } : {}),
        },
      });
    }

    res.status(200).json({ success: true, data: client });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.', error: error.message });
  }
};

export const getAllUsersController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { skip, take, page, limit } = getPaginationParams(req.query);
    const { role } = req.query;

    // Construire le filtre basé sur le rôle si fourni
    let whereClause: any = {};
    if (req.user?.entrepriseId) {
      whereClause.entrepriseId = req.user.entrepriseId;
    }
    if (role && typeof role === 'string') {
      const roleRecord = await prisma.role.findFirst({
        where: {
          name: role.toUpperCase(),
          ...(req.user?.entrepriseId ? { entrepriseId: req.user.entrepriseId } : {}),
        }
      });

      if (roleRecord) {
        whereClause.roleId = roleRecord.id;
      }
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        skip,
        take,
        include: {
          role: true,
        },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const result = createPaginationResult(users, total, page, limit);
    res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const getUserByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await userService.getUserById(parseInt(id));

    if (!user) {
      res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
  }
};

export const createUserController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { nom, prenom, email, tel, adresse, password } = req.body;

    if (!nom || !prenom || !adresse) {
      res.status(400).json({ success: false, message: 'Les champs nom, prénom et adresse sont obligatoires' });
      return;
    }
    if (!email && !tel) {
      res.status(400).json({ success: false, message: 'Un email ou un numéro de téléphone est requis' });
      return;
    }

    const entrepriseId = (req as any).user?.entrepriseId;

    // Récupérer le rôle CLIENT de cette entreprise
    const clientRole = await prisma.role.findFirst({
      where: { name: 'CLIENT', ...(entrepriseId ? { entrepriseId } : {}) }
    });

    if (!clientRole) {
      res.status(500).json({ success: false, message: 'Le rôle CLIENT n\'existe pas' });
      return;
    }

    const userData = {
      nom,
      prenom,
      email,
      tel,
      adresse,
      password: password || undefined,
      roleId: clientRole.id,
      entrepriseId: entrepriseId || undefined,
    };

    const newUser = await userService.createUser(userData);

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: newUser,
    });
  } catch (error: any) {
    console.error("Erreur lors de la création du client:", error);
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Un client avec cet email ou ce téléphone existe déjà dans cette entreprise' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
    }
  }
};

export const updateUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { nom, prenom, email, tel, adresse, password } = req.body;

    const userData: any = {};
    if (nom) userData.nom = nom;
    if (prenom) userData.prenom = prenom;
    if (email !== undefined) userData.email = email;
    if (tel) userData.tel = tel;
    if (adresse) userData.adresse = adresse;
    if (password) userData.password = password;

    const updatedUser = await userService.updateUser(parseInt(id), userData);

    res.status(200).json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: updatedUser,
    });
  } catch (error: any) {
    console.error("Erreur lors de la mise à jour du client:", error);
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Client introuvable' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Email ou téléphone déjà existant' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
    }
  }
};

export const uploadPhotoProfil = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!req.file) {
      res.status(400).json({ success: false, message: 'Aucun fichier fourni.' });
      return;
    }
    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { image: req.file.filename },
    });
    res.status(200).json({ success: true, data: { image: updated.image } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur interne du serveur.', error: error.message });
  }
};

export const deleteUserController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await userService.deleteUser(parseInt(id));

    res.status(200).json({
      success: true,
      message: 'Client supprimé avec succès',
    });
  } catch (error: any) {
    console.error("Erreur lors de la suppression du client:", error);
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Client introuvable.' });
    } else if (error.code === 'P2003') {
      res.status(409).json({
        success: false,
        message: 'Impossible de supprimer ce client : il est référencé dans des commandes. Supprimez d\'abord ses commandes.',
      });
    } else {
      res.status(500).json({ success: false, message: 'Erreur interne du serveur.' });
    }
  }
};