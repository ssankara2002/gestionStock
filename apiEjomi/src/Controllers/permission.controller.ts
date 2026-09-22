import { Request, Response } from 'express';
import permissionService from '../Services/permission.service';

export const getAllPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawEntrepriseId = req.query.entrepriseId;
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const entrepriseId = rawEntrepriseId === undefined
      ? (isSuperAdmin ? null : req.user?.entrepriseId)
      : Number(rawEntrepriseId);
    const permissions = await permissionService.getAllPermissions(Number.isFinite(entrepriseId) ? entrepriseId : undefined);
    res.status(200).json({ success: true, data: permissions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des permissions', error: error.message });
  }
};

export const getPermissionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const permission = await permissionService.getPermissionById(parseInt(id));

    if (!permission) {
      res.status(404).json({ success: false, message: 'Permission introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: permission });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de la permission', error: error.message });
  }
};

export const createPermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { key, description, entrepriseId } = req.body;

    if (!key) {
      res.status(400).json({ success: false, message: 'Le champ key est obligatoire' });
      return;
    }

    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';
    const normalizedEntrepriseId = isSuperAdmin
      ? (entrepriseId ?? null)
      : req.user?.entrepriseId;
    const permissionData = {
      key,
      description,
      entrepriseId: normalizedEntrepriseId === null || normalizedEntrepriseId === undefined ? null : Number(normalizedEntrepriseId),
    };
    const permission = await permissionService.createPermission(permissionData);

    res.status(201).json({ success: true, message: 'Permission créée avec succès', data: permission });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Une permission avec cette clé existe déjà' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la création de la permission', error: error.message });
    }
  }
};

export const updatePermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { key, description, entrepriseId } = req.body;
    const existingPermission = await permissionService.getPermissionById(parseInt(id));
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (!existingPermission || (!isSuperAdmin && existingPermission.entrepriseId !== req.user?.entrepriseId)) {
      res.status(404).json({ success: false, message: 'Permission introuvable' });
      return;
    }

    const normalizedEntrepriseId = isSuperAdmin ? entrepriseId : req.user?.entrepriseId;
    const permissionData = {
      ...(key !== undefined ? { key } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(normalizedEntrepriseId !== undefined ? { entrepriseId: normalizedEntrepriseId === null ? null : Number(normalizedEntrepriseId) } : {}),
    };
    const permission = await permissionService.updatePermission(parseInt(id), permissionData);

    res.status(200).json({ success: true, message: 'Permission mise à jour avec succès', data: permission });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Permission introuvable' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Une permission avec cette clé existe déjà' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de la permission', error: error.message });
    }
  }
};

export const deletePermission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existingPermission = await permissionService.getPermissionById(parseInt(id));
    const isSuperAdmin = req.user?.role === 'SUPER_ADMIN';

    if (!existingPermission || (!isSuperAdmin && existingPermission.entrepriseId !== req.user?.entrepriseId)) {
      res.status(404).json({ success: false, message: 'Permission introuvable' });
      return;
    }

    await permissionService.deletePermission(parseInt(id));

    res.status(200).json({ success: true, message: 'Permission supprimée avec succès' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Permission introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression de la permission', error: error.message });
    }
  }
};