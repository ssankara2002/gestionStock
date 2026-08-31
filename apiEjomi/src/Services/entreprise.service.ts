import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      siteWeb: true,
      heroTitre: true,
      heroSousTitre: true,
      heroImage: true,
      feature1Titre: true,
      feature1Desc: true,
      feature2Titre: true,
      feature2Desc: true,
      feature3Titre: true,
      feature3Desc: true,
      ctaTitre: true,
      ctaSousTitre: true,
      facebook: true,
      instagram: true,
      twitter: true,
      createdAt: true,
    },
  });
};

const update = async (id: number, data: any) => {
  const allowed = [
    'nom','email','tel','adresse','logo','siteWeb',
    'heroTitre','heroSousTitre','heroImage',
    'feature1Titre','feature1Desc','feature2Titre','feature2Desc',
    'feature3Titre','feature3Desc','ctaTitre','ctaSousTitre',
    'facebook','instagram','twitter',
  ];
  const filtered: any = {};
  for (const key of allowed) {
    if (data[key] !== undefined) filtered[key] = data[key];
  }
  return prisma.entreprise.update({ where: { id }, data: filtered });
};

export default { getById, update };
