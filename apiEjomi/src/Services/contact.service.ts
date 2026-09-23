import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ContactCreateInput {
  nom: string;
  email: string;
  sujet: string;
  message: string;
}

interface ContactUpdateInput {
  statut?: 'NON_LU' | 'LU' | 'TRAITE' | 'ARCHIVE';
  reponse?: string;
  dateReponse?: Date;
}

/**
 * Créer un nouveau message de contact
 */
const createContact = async (data: ContactCreateInput) => {
  return await prisma.contact.create({
    data: {
      nom: data.nom,
      email: data.email,
      sujet: data.sujet,
      message: data.message,
    },
  });
};

/**
 * Récupérer tous les messages de contact avec pagination
 */
const getAllContacts = async (page: number = 1, limit: number = 10, entrepriseId?: number) => {
  const skip = (page - 1) * limit;
  const where: any = entrepriseId ? { entrepriseId } : {};

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      skip,
      take: limit,
      where,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    data: contacts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Récupérer un message de contact par ID
 */
const getContactById = async (id: number) => {
  const contact = await prisma.contact.findUnique({
    where: { id },
  });

  // Marquer comme lu si c'était non lu
  if (contact && contact.statut === 'NON_LU') {
    await prisma.contact.update({
      where: { id },
      data: { statut: 'LU' },
    });
  }

  return contact;
};

/**
 * Mettre à jour un message de contact
 */
const updateContact = async (id: number, data: ContactUpdateInput) => {
  const updateData: any = {};

  if (data.statut) {
    updateData.statut = data.statut;
  }

  if (data.reponse) {
    updateData.reponse = data.reponse;
    updateData.dateReponse = new Date();
    updateData.statut = 'TRAITE';
  }

  return await prisma.contact.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Supprimer un message de contact
 */
const deleteContact = async (id: number) => {
  return await prisma.contact.delete({
    where: { id },
  });
};

/**
 * Récupérer les statistiques des contacts
 */
const getContactStatistics = async () => {
  const [total, nonLu, lu, traite, archive] = await Promise.all([
    prisma.contact.count(),
    prisma.contact.count({ where: { statut: 'NON_LU' } }),
    prisma.contact.count({ where: { statut: 'LU' } }),
    prisma.contact.count({ where: { statut: 'TRAITE' } }),
    prisma.contact.count({ where: { statut: 'ARCHIVE' } }),
  ]);

  return {
    total,
    nonLu,
    lu,
    traite,
    archive,
  };
};

/**
 * Récupérer les contacts par statut
 */
const getContactsByStatut = async (statut: 'NON_LU' | 'LU' | 'TRAITE' | 'ARCHIVE') => {
  return await prisma.contact.findMany({
    where: { statut },
    orderBy: {
      dateEnvoi: 'desc',
    },
  });
};

export default {
  createContact,
  getAllContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactStatistics,
  getContactsByStatut,
};
