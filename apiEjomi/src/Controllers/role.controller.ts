import { Request, Response } from 'express';
import roleService from '../Services/role.service';

export const getAllRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawEntrepriseId = req.query.entrepriseId;
    const entrepriseId = rawEntrepriseId === undefined ? null : Number(rawEntrepriseId);

    const roles = await roleService.getAllRoles(Number.isFinite(entrepriseId) ? entrepriseId : undefined);
    res.status(200).json({ success: true, data: roles });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des rôles', error: error.message });
  }
};

export const getRoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const role = await roleService.getRoleById(parseInt(id));

    if (!role) {
      res.status(404).json({ success: false, message: 'Rôle introuvable' });
      return;
    }

    res.status(200).json({ success: true, data: role });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération du rôle', error: error.message });
  }
};

export const createRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Le champ name est obligatoire' });
      return;
    }

    const roleData = { name, description };
    const role = await roleService.createRole(roleData);

    res.status(201).json({ success: true, message: 'Rôle créé avec succès', data: role });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Un rôle avec ce nom existe déjà' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la création du rôle', error: error.message });
    }
  }
};

export const updateRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const roleData = { name, description };
    const role = await roleService.updateRole(parseInt(id), roleData);

    res.status(200).json({ success: true, message: 'Rôle mis à jour avec succès', data: role });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Rôle introuvable' });
    } else if (error.code === 'P2002') {
      res.status(400).json({ success: false, message: 'Un rôle avec ce nom existe déjà' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour du rôle', error: error.message });
    }
  }
};

export const deleteRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await roleService.deleteRole(parseInt(id));

    res.status(200).json({ success: true, message: 'Rôle supprimé avec succès' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Rôle introuvable' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de la suppression du rôle', error: error.message });
    }
  }
};

export const assignPermissionsToRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body;

    if (!permissionIds || !Array.isArray(permissionIds)) {
      res.status(400).json({ success: false, message: 'Le champ permissionIds doit être un tableau' });
      return;
    }

    const role = await roleService.assignPermissionsToRole(parseInt(id), permissionIds);
    res.status(200).json({ success: true, message: 'Permissions assignées avec succès', data: role });
  } catch (error: any) {
    if (error.code === 'P2025') {
      res.status(404).json({ success: false, message: 'Rôle ou permissions introuvables' });
    } else {
      res.status(500).json({ success: false, message: 'Erreur lors de l\'assignation des permissions', error: error.message });
    }
  }
};