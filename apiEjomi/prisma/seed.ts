import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const hash = (pwd: string) => bcrypt.hash(pwd, 12);

async function upsertEntreprise(data: {
  email: string; nom: string; tel: string; adresse: string;
  heroTitre: string; heroSousTitre: string;
  histoire?: string; mission?: string; vision?: string; valeur?: string;
}) {
  const existing = await prisma.entreprise.findUnique({ where: { email: data.email } });
  if (existing) return existing;
  return prisma.entreprise.create({ data });
}

async function upsertRole(name: string, description: string, entrepriseId: number) {
  const existing = await prisma.role.findFirst({ where: { name, entrepriseId } });
  if (existing) return existing;
  return prisma.role.create({ data: { name, description, entrepriseId } });
}

async function upsertUser(email: string, data: any) {
  const existing = await prisma.user.findFirst({ where: { email }, include: { employe: true } });
  if (existing) return existing;
  return prisma.user.create({ data });
}

async function upsertProduit(libelle: string, entrepriseId: number, data: any) {
  const existing = await prisma.produit.findFirst({ where: { libelle, entrepriseId } });
  if (existing) return existing;
  // renommer prixAchat → prixAchatUnitaire si fourni
  const { prixAchat, ...rest } = data;
  return prisma.produit.create({ data: { ...rest, prixAchatUnitaire: prixAchat ?? 0, libelle, entrepriseId } });
}

async function upsertFournisseur(tel: string, entrepriseId: number, data: any) {
  const existing = await prisma.fournisseur.findFirst({ where: { tel, entrepriseId } });
  if (existing) return existing;
  return prisma.fournisseur.create({ data: { prenom: '-', ...data, tel, entrepriseId } });
}

async function createStockIfNeeded(produitId: number, qtyMagasin: number, qtyBoutique: number) {
  const mag = await prisma.stockMagasin.findUnique({ where: { produitId } });
  if (!mag) await prisma.stockMagasin.create({ data: { produitId, quantite: qtyMagasin } });

  const bout = await prisma.stockBoutique.findUnique({ where: { produitId } });
  if (!bout) await prisma.stockBoutique.create({ data: { produitId, quantite: qtyBoutique } });
}

// ─────────────────────────────────────────────
// PERMISSIONS (globales)
// ─────────────────────────────────────────────

const PERMISSIONS = [
  { key: 'user.read' }, { key: 'user.create' }, { key: 'user.update' }, { key: 'user.delete' }, { key: 'user.archive' },
  { key: 'role.read' }, { key: 'role.create' }, { key: 'role.update' }, { key: 'role.delete' }, { key: 'role.assign_permissions' },
  { key: 'permission.read' }, { key: 'permission.create' }, { key: 'permission.update' }, { key: 'permission.delete' },
  { key: 'employe.read' }, { key: 'employe.create' }, { key: 'employe.update' }, { key: 'employe.delete' }, { key: 'employe.export' }, { key: 'employe.statistics' },
  { key: 'fournisseur.read' }, { key: 'fournisseur.create' }, { key: 'fournisseur.update' }, { key: 'fournisseur.delete' }, { key: 'fournisseur.export' },
  { key: 'produit.read' }, { key: 'produit.create' }, { key: 'produit.update' }, { key: 'produit.delete' }, { key: 'produit.export' }, { key: 'produit.statistics' },
  { key: 'commande.read' }, { key: 'commande.create' }, { key: 'commande.update' }, { key: 'commande.delete' }, { key: 'commande.export' }, { key: 'commande.statistics' }, { key: 'commande.validate' },
  { key: 'paiement.read' }, { key: 'paiement.create' }, { key: 'paiement.update' }, { key: 'paiement.delete' }, { key: 'paiement.export' }, { key: 'paiement.statistics' }, { key: 'paiement.validate' },
  { key: 'livraison.read' }, { key: 'livraison.create' }, { key: 'livraison.update' }, { key: 'livraison.delete' }, { key: 'livraison.export' }, { key: 'livraison.assign' },
  { key: 'approvisionnement.read' }, { key: 'approvisionnement.create' }, { key: 'approvisionnement.update' }, { key: 'approvisionnement.delete' }, { key: 'approvisionnement.export' }, { key: 'approvisionnement.validate' },
  { key: 'approvisionnement_matiere_premiere.read' }, { key: 'approvisionnement_matiere_premiere.create' }, { key: 'approvisionnement_matiere_premiere.update' }, { key: 'approvisionnement_matiere_premiere.delete' },
  { key: 'production.read' }, { key: 'production.create' }, { key: 'production.update' }, { key: 'production.delete' }, { key: 'production.export' }, { key: 'production.statistics' },
  { key: 'matiere_premiere.read' }, { key: 'matiere_premiere.create' }, { key: 'matiere_premiere.update' }, { key: 'matiere_premiere.delete' }, { key: 'matiere_premiere.export' },
  { key: 'absence.read' }, { key: 'absence.create' }, { key: 'absence.update' }, { key: 'absence.delete' }, { key: 'absence.export' }, { key: 'absence.statistics' },
  { key: 'conge.read' }, { key: 'conge.create' }, { key: 'conge.update' }, { key: 'conge.delete' }, { key: 'conge.approve' }, { key: 'conge.reject' }, { key: 'conge.export' },
  { key: 'salaire_paiement.read' }, { key: 'salaire_paiement.create' }, { key: 'salaire_paiement.update' }, { key: 'salaire_paiement.delete' }, { key: 'salaire_paiement.export' },
  { key: 'transaction.read' }, { key: 'transaction.create' }, { key: 'transaction.update' }, { key: 'transaction.delete' }, { key: 'transaction.export' }, { key: 'transaction.statistics' },
  { key: 'inventaire.read' }, { key: 'inventaire.create' }, { key: 'inventaire.statistics' },
  { key: 'contact.read' }, { key: 'contact.update' }, { key: 'contact.delete' },
  { key: 'entreprise.read' }, { key: 'entreprise.create' }, { key: 'entreprise.update' }, { key: 'entreprise.delete' }, { key: 'entreprise.manage_admin' },
];

async function seedPermissions() {
  const all: any[] = [];
  for (const p of PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: { key: p.key, description: p.key },
    });
    all.push(perm);
  }
  return all;
}

function getPerms(allPerms: any[], keys: string[]) {
  return keys.map(k => allPerms.find(p => p.key === k)).filter(Boolean).map(p => ({ id: p.id }));
}

async function assignRolePermissions(roles: any, allPerms: any[]) {
  const all = allPerms.map(p => ({ id: p.id }));

  // ADMIN & DIRECTEUR_GENERAL → tout
  for (const r of [roles.ADMIN, roles.DIRECTEUR_GENERAL, roles.GERANT]) {
    await prisma.role.update({ where: { id: r.id }, data: { permissions: { set: all } } });
  }

  await prisma.role.update({
    where: { id: roles.VENDEUR.id },
    data: {
      permissions: {
        set: getPerms(allPerms, [
          'commande.read', 'commande.create', 'commande.update', 'commande.export', 'commande.validate',
          'produit.read', 'paiement.read', 'paiement.create', 'paiement.update',
          'livraison.read', 'livraison.create', 'livraison.update',
          'user.read', 'user.create', 'user.update',
          'contact.read', 'contact.update', 'contact.delete',
          'inventaire.read', 'inventaire.create',
        ]),
      },
    },
  });

  await prisma.role.update({
    where: { id: roles.MAGASINIER.id },
    data: {
      permissions: {
        set: getPerms(allPerms, [
          'produit.read', 'produit.create', 'produit.update',
          'matiere_premiere.read', 'matiere_premiere.create', 'matiere_premiere.update',
          'approvisionnement.read', 'approvisionnement.create', 'approvisionnement.update',
          'approvisionnement_matiere_premiere.read', 'approvisionnement_matiere_premiere.create',
          'production.read', 'production.create', 'production.update',
          'fournisseur.read', 'fournisseur.create', 'fournisseur.update',
          'livraison.read', 'livraison.update', 'livraison.assign',
          'inventaire.read', 'inventaire.create', 'inventaire.statistics',
        ]),
      },
    },
  });

  await prisma.role.update({
    where: { id: roles.CLIENT.id },
    data: {
      permissions: {
        set: getPerms(allPerms, ['produit.read', 'commande.read', 'commande.create', 'paiement.read', 'paiement.create']),
      },
    },
  });

  await prisma.role.update({
    where: { id: roles.SECRETAIRE.id },
    data: {
      permissions: {
        set: getPerms(allPerms, [
          'commande.read', 'commande.create', 'commande.update', 'commande.delete', 'commande.export',
          'paiement.read', 'paiement.create', 'paiement.update', 'paiement.delete', 'paiement.export',
          'livraison.read', 'livraison.create', 'livraison.update', 'livraison.delete', 'livraison.export',
          'approvisionnement.read', 'approvisionnement.create', 'approvisionnement.update',
          'fournisseur.read', 'fournisseur.create', 'fournisseur.update', 'fournisseur.export',
          'user.read', 'user.create', 'user.update',
          'employe.read', 'employe.update',
          'produit.read',
          'absence.read', 'absence.create', 'absence.update', 'absence.export',
          'conge.read', 'conge.create', 'conge.update', 'conge.approve', 'conge.reject', 'conge.export',
          'transaction.read', 'transaction.export',
          'production.read', 'production.statistics',
        ]),
      },
    },
  });
}

// ─────────────────────────────────────────────
// SEED D'UNE ENTREPRISE COMPLÈTE
// ─────────────────────────────────────────────

async function seedEntrepriseComplete(config: {
  entrepriseData: any;
  adminEmail: string;
  adminPassword: string;
  adminNom: string;
  adminPrenom: string;
  adminTel: string;
  employes: Array<{ email: string; password: string; nom: string; prenom: string; tel: string; role: string; salaire: number }>;
  clients: Array<{ email: string; nom: string; prenom: string; tel: string; adresse: string }>;
  produits: Array<{ libelle: string; description: string; prixAchat: number; prixVente: number; qtyMagasin: number; qtyBoutique: number }>;
  fournisseurs: Array<{ nom: string; tel: string; email?: string; adresse: string }>;
  allPerms: any[];
}) {
  const { entrepriseData, adminEmail, adminPassword, adminNom, adminPrenom, adminTel, employes, clients, produits, fournisseurs, allPerms } = config;

  // 1. Entreprise
  const entreprise = await upsertEntreprise(entrepriseData);
  console.log(`  🏢 ${entreprise.nom}`);

  // 2. Rôles
  const roleNames = ['ADMIN', 'DIRECTEUR_GENERAL', 'GERANT', 'VENDEUR', 'MAGASINIER', 'SECRETAIRE', 'CLIENT'];
  const rolesArr = await Promise.all(
    roleNames.map(n => upsertRole(n, n, entreprise.id))
  );
  const roles: Record<string, any> = {};
  for (const r of rolesArr) roles[r.name] = r;

  // 3. Permissions
  await assignRolePermissions(roles, allPerms);

  // 4. Admin
  const adminPwd = await hash(adminPassword);
  const adminTelFinal = adminTel;
  let admin = await prisma.user.findFirst({ where: { email: adminEmail }, include: { employe: true } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: adminPwd,
        nom: adminNom,
        prenom: adminPrenom,
        adresse: entrepriseData.adresse,
        tel: adminTelFinal,
        roleId: roles.ADMIN.id,
        entrepriseId: entreprise.id,
        employe: { create: { salaire: 150000, dateEmbauche: new Date('2022-01-01') } },
      },
      include: { employe: true },
    });
    console.log(`  👤 Admin créé: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log(`  👤 Admin existe: ${adminEmail}`);
  }

  // 5. Employés
  const employeMap: Record<string, any> = {};
  for (const emp of employes) {
    const existingUser = await prisma.user.findFirst({ where: { tel: emp.tel } });
    let empUser = existingUser;
    if (!existingUser) {
      const pwd = await hash(emp.password);
      empUser = await prisma.user.create({
        data: {
          email: emp.email,
          password: pwd,
          nom: emp.nom,
          prenom: emp.prenom,
          adresse: entrepriseData.adresse,
          tel: emp.tel,
          roleId: roles[emp.role]?.id,
          entrepriseId: entreprise.id,
          employe: { create: { salaire: emp.salaire, dateEmbauche: new Date('2023-01-01') } },
        },
        include: { employe: true },
      });
      console.log(`  👤 Employé créé: ${emp.email} [${emp.role}]`);
    }
    employeMap[emp.role] = empUser;
  }

  // 6. Clients
  const clientArr: any[] = [];
  for (const cl of clients) {
    const existingCl = await prisma.user.findFirst({ where: { tel: cl.tel } });
    if (!existingCl) {
      const cl2 = await prisma.user.create({
        data: {
          email: cl.email,
          nom: cl.nom,
          prenom: cl.prenom,
          adresse: cl.adresse,
          tel: cl.tel,
          roleId: roles.CLIENT.id,
          entrepriseId: entreprise.id,
        },
      });
      clientArr.push(cl2);
    } else {
      clientArr.push(existingCl);
    }
  }
  console.log(`  👥 ${clientArr.length} clients`);

  // 7. Fournisseurs
  for (const f of fournisseurs) {
    await upsertFournisseur(f.tel, entreprise.id, { nom: f.nom, email: f.email || null, adresse: f.adresse });
  }
  console.log(`  🚚 ${fournisseurs.length} fournisseurs`);

  // 8. Produits + stocks
  const produitArr: any[] = [];
  for (const p of produits) {
    const prod = await upsertProduit(p.libelle, entreprise.id, {
      description: p.description,
      prixAchat: p.prixAchat,
      prixDeVenteUnitaire: p.prixVente,
    });
    await createStockIfNeeded(prod.id, p.qtyMagasin, p.qtyBoutique);
    produitArr.push(prod);
  }
  console.log(`  📦 ${produitArr.length} produits avec stocks`);

  // 9. Commandes de démo
  const vendeurEmploye = await prisma.employe.findFirst({ where: { userId: admin.id } });
  if (clientArr.length > 0 && produitArr.length >= 2 && vendeurEmploye) {
    const existingCmd = await prisma.commande.findFirst({ where: { entrepriseId: entreprise.id } });
    if (!existingCmd) {
      // Commande 1 — payée complètement
      const cmd1 = await prisma.commande.create({
        data: {
          clientId: clientArr[0].id,
          vendeurId: vendeurEmploye.id,
          entrepriseId: entreprise.id,
          dateCommande: new Date(Date.now() - 7 * 24 * 3600 * 1000),
          montant: produitArr[0].prixDeVenteUnitaire * 2,
          reduction: 0,
          statut: 'EN_ATTENTE',
          lieu: 'BOUTIQUE',
        },
      });
      const stock1 = await prisma.stockBoutique.findUnique({ where: { produitId: produitArr[0].id } });
      if (stock1 && stock1.quantite >= 2) {
        await prisma.ligneCommande.create({
          data: {
            commandeId: cmd1.id,
            produitId: produitArr[0].id,
            stockBoutiqueId: stock1.id,
            quantiteCommande: 2,
            prixUnitaire: produitArr[0].prixDeVenteUnitaire,
            montant: produitArr[0].prixDeVenteUnitaire * 2,
          },
        });
        await prisma.stockBoutique.update({ where: { id: stock1.id }, data: { quantite: { decrement: 2 } } });
        await prisma.paiement.create({
          data: {
            commandeId: cmd1.id,
            montant: cmd1.montant,
            modePaiement: 'ESPECES',
            statut: 'REUSSI',
          },
        });
      }

      // Commande 2 — paiement partiel (créance)
      if (clientArr.length > 1 && produitArr.length >= 2) {
        const montant2 = produitArr[1].prixDeVenteUnitaire * 3;
        const cmd2 = await prisma.commande.create({
          data: {
            clientId: clientArr[1].id,
            vendeurId: vendeurEmploye.id,
            entrepriseId: entreprise.id,
            dateCommande: new Date(Date.now() - 2 * 24 * 3600 * 1000),
            montant: montant2,
            reduction: 0,
            statut: 'EN_ATTENTE',
            lieu: 'BOUTIQUE',
          },
        });
        const stock2 = await prisma.stockBoutique.findUnique({ where: { produitId: produitArr[1].id } });
        if (stock2 && stock2.quantite >= 3) {
          await prisma.ligneCommande.create({
            data: {
              commandeId: cmd2.id,
              produitId: produitArr[1].id,
              stockBoutiqueId: stock2.id,
              quantiteCommande: 3,
              prixUnitaire: produitArr[1].prixDeVenteUnitaire,
              montant: montant2,
            },
          });
          await prisma.stockBoutique.update({ where: { id: stock2.id }, data: { quantite: { decrement: 3 } } });
          // Paiement partiel : 50%
          await prisma.paiement.create({
            data: {
              commandeId: cmd2.id,
              montant: montant2 / 2,
              modePaiement: 'ORANGE_MONEY',
              statut: 'REUSSI',
            },
          });
        }
      }

      console.log(`  🛒 Commandes de démo créées`);
    }
  }

  return { entreprise, roles, admin };
}

// ─────────────────────────────────────────────
// SEED FIFO
// ─────────────────────────────────────────────

async function seedFifo(entreprise: any, allPerms: any[]) {
  // Récupérer un employé et un client existants dans cette entreprise
  const employe = await prisma.employe.findFirst({
    where: { user: { entrepriseId: entreprise.id } },
  });
  const client = await prisma.user.findFirst({
    where: { entrepriseId: entreprise.id, role: { name: 'CLIENT' } },
    include: { role: true },
  });
  const fournisseur = await prisma.fournisseur.findFirst({
    where: { entrepriseId: entreprise.id },
  });

  if (!employe || !client || !fournisseur) {
    console.log('  ⚠️  Employé/client/fournisseur manquant, skip FIFO');
    return;
  }

  // Produit test FIFO — Pagne wax 6 yards (déjà créé dans Mode Sahel)
  const produit = await prisma.produit.findFirst({
    where: { libelle: 'Pagne wax 6 yards', entrepriseId: entreprise.id },
    include: { stockMagasin: true, stockBoutique: true },
  });

  if (!produit || !produit.stockMagasin || !produit.stockBoutique) {
    console.log('  ⚠️  Produit FIFO introuvable, skip');
    return;
  }

  // Vérifier si les appros FIFO existent déjà
  const existingAppro = await prisma.approvisionnement.findFirst({
    where: { entrepriseId: entreprise.id, lignes: { some: { produitId: produit.id } } },
  });
  if (existingAppro) {
    console.log('  ✅ Appros FIFO déjà présents, skip');
    return;
  }

  // ── APPRO 1 : il y a 30 jours, prix achat = 4 000 FCFA ──
  const appro1 = await prisma.approvisionnement.create({
    data: {
      dateApprovisionnement: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      montant: 20 * 4000,
      lieu: 'MAGASIN',
      fournisseurId: fournisseur.id,
      employeId: employe.id,
      entrepriseId: entreprise.id,
    },
  });
  const ligne1 = await prisma.ligneApprovisionnement.create({
    data: {
      approvisionnementId: appro1.id,
      produitId: produit.id,
      stockMagasinId: produit.stockMagasin.id,
      quantite: 20,
      prixUnitaire: 4000,
      montant: 20 * 4000,
    },
  });
  await prisma.lotStock.create({
    data: {
      produitId: produit.id,
      quantiteInitiale: 20,
      quantiteRestante: 20,
      prixAchat: 4000,
      dateAppro: new Date(Date.now() - 30 * 24 * 3600 * 1000),
      ligneApprovisionnementId: ligne1.id,
    },
  });
  await prisma.stockMagasin.update({
    where: { id: produit.stockMagasin.id },
    data: { quantite: { increment: 20 } },
  });
  console.log('  📥 Appro 1 : 20 unités × 4 000 FCFA (il y a 30 jours)');

  // ── APPRO 2 : il y a 10 jours, prix achat = 5 500 FCFA (hausse fournisseur) ──
  const appro2 = await prisma.approvisionnement.create({
    data: {
      dateApprovisionnement: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      montant: 15 * 5500,
      lieu: 'MAGASIN',
      fournisseurId: fournisseur.id,
      employeId: employe.id,
      entrepriseId: entreprise.id,
    },
  });
  const ligne2 = await prisma.ligneApprovisionnement.create({
    data: {
      approvisionnementId: appro2.id,
      produitId: produit.id,
      stockMagasinId: produit.stockMagasin.id,
      quantite: 15,
      prixUnitaire: 5500,
      montant: 15 * 5500,
    },
  });
  await prisma.lotStock.create({
    data: {
      produitId: produit.id,
      quantiteInitiale: 15,
      quantiteRestante: 15,
      prixAchat: 5500,
      dateAppro: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      ligneApprovisionnementId: ligne2.id,
    },
  });
  await prisma.stockMagasin.update({
    where: { id: produit.stockMagasin.id },
    data: { quantite: { increment: 15 } },
  });
  console.log('  📥 Appro 2 : 15 unités × 5 500 FCFA (il y a 10 jours, hausse prix)');

  // Transférer 25 unités du magasin vers la boutique pour pouvoir vendre
  const stockActuelBoutique = await prisma.stockBoutique.findUnique({ where: { id: produit.stockBoutique.id } });
  const stockActuelMagasin = await prisma.stockMagasin.findUnique({ where: { id: produit.stockMagasin.id } });
  if ((stockActuelMagasin?.quantite ?? 0) >= 25) {
    await prisma.stockMagasin.update({ where: { id: produit.stockMagasin.id }, data: { quantite: { decrement: 25 } } });
    await prisma.stockBoutique.update({ where: { id: produit.stockBoutique.id }, data: { quantite: { increment: 25 } } });
    console.log('  🔄 Transfert : 25 unités magasin → boutique');
  }

  // ── COMMANDE 1 : 18 unités (sera couverte par lot 1 à 4000 FCFA entièrement) ──
  // Prix de vente : 9 000 FCFA → marge = 9000-4000 = 5000 FCFA/u (125%)
  const prixVente = produit.prixDeVenteUnitaire;
  const stockBoutiqueActuel = await prisma.stockBoutique.findUnique({ where: { id: produit.stockBoutique.id } });

  if ((stockBoutiqueActuel?.quantite ?? 0) >= 18) {
    // Consommer FIFO : 18 unités du lot 1 (4000 FCFA)
    const lot1 = await prisma.lotStock.findFirst({
      where: { produitId: produit.id, quantiteRestante: { gt: 0 } },
      orderBy: { dateAppro: 'asc' },
    });
    let coutRevient1 = 4000; // lot 1

    const cmd1 = await prisma.commande.create({
      data: {
        clientId: client.id,
        vendeurId: employe.id,
        entrepriseId: entreprise.id,
        dateCommande: new Date(Date.now() - 5 * 24 * 3600 * 1000),
        montant: 18 * prixVente,
        reduction: 0,
        statut: 'EN_ATTENTE',
        lieu: 'BOUTIQUE',
      },
    });
    await prisma.ligneCommande.create({
      data: {
        commandeId: cmd1.id,
        produitId: produit.id,
        stockBoutiqueId: produit.stockBoutique.id,
        quantiteCommande: 18,
        prixUnitaire: prixVente,
        montant: 18 * prixVente,
        coutRevient: coutRevient1,
      },
    });
    await prisma.stockBoutique.update({ where: { id: produit.stockBoutique.id }, data: { quantite: { decrement: 18 } } });
    if (lot1) {
      await prisma.lotStock.update({ where: { id: lot1.id }, data: { quantiteRestante: { decrement: 18 } } });
    }
    await prisma.paiement.create({
      data: { commandeId: cmd1.id, montant: 18 * prixVente, modePaiement: 'ESPECES', statut: 'REUSSI' },
    });
    console.log(`  🛒 Commande 1 : 18u × ${prixVente.toLocaleString()} FCFA | coût 4 000 FCFA | marge ${(prixVente - 4000).toLocaleString()} FCFA/u`);

    // ── COMMANDE 2 : 7 unités (2 du lot 1 restant + 5 du lot 2 à 5500) ──
    // coût moyen = (2×4000 + 5×5500)/7 = 5071 FCFA → marge = 9000-5071 = 3929 FCFA/u
    const stockBout2 = await prisma.stockBoutique.findUnique({ where: { id: produit.stockBoutique.id } });
    if ((stockBout2?.quantite ?? 0) >= 7) {
      const lot1restant = await prisma.lotStock.findFirst({
        where: { produitId: produit.id, quantiteRestante: { gt: 0 } },
        orderBy: { dateAppro: 'asc' },
      });
      // Coût FIFO : 2 du lot1 (4000) + 5 du lot2 (5500)
      const coutRevient2 = (2 * 4000 + 5 * 5500) / 7;

      const cmd2 = await prisma.commande.create({
        data: {
          clientId: client.id,
          vendeurId: employe.id,
          entrepriseId: entreprise.id,
          dateCommande: new Date(Date.now() - 2 * 24 * 3600 * 1000),
          montant: 7 * prixVente,
          reduction: 0,
          statut: 'EN_ATTENTE',
          lieu: 'BOUTIQUE',
        },
      });
      await prisma.ligneCommande.create({
        data: {
          commandeId: cmd2.id,
          produitId: produit.id,
          stockBoutiqueId: produit.stockBoutique.id,
          quantiteCommande: 7,
          prixUnitaire: prixVente,
          montant: 7 * prixVente,
          coutRevient: Math.round(coutRevient2),
        },
      });
      await prisma.stockBoutique.update({ where: { id: produit.stockBoutique.id }, data: { quantite: { decrement: 7 } } });
      // Consommer les 2 derniers du lot 1
      if (lot1restant && lot1restant.quantiteRestante >= 2) {
        await prisma.lotStock.update({ where: { id: lot1restant.id }, data: { quantiteRestante: { decrement: 2 } } });
        // Puis 5 du lot 2
        const lot2 = await prisma.lotStock.findFirst({
          where: { produitId: produit.id, quantiteRestante: { gt: 0 }, id: { not: lot1restant.id } },
          orderBy: { dateAppro: 'asc' },
        });
        if (lot2) {
          await prisma.lotStock.update({ where: { id: lot2.id }, data: { quantiteRestante: { decrement: 5 } } });
        }
      }
      await prisma.paiement.create({
        data: { commandeId: cmd2.id, montant: 7 * prixVente * 0.5, modePaiement: 'MOBILE_MONEY', statut: 'REUSSI' },
      });
      console.log(`  🛒 Commande 2 : 7u × ${prixVente.toLocaleString()} FCFA | coût moyen ${Math.round(coutRevient2).toLocaleString()} FCFA | marge ${(prixVente - Math.round(coutRevient2)).toLocaleString()} FCFA/u`);
    }
  }

  console.log('  ✅ Seed FIFO terminé');
}

async function ensureDefaultAdmin(entreprises: any[]) {
  const email = 'admin@maquis.com';
  const password = await hash('admin123');
  const firstEntreprise = entreprises[0];
  const firstAdminRole = await prisma.role.findFirst({
    where: { name: 'ADMIN', entrepriseId: firstEntreprise.id },
  });

  if (!firstAdminRole) throw new Error('Rôle ADMIN introuvable pour le compte par défaut');

  let admin = await prisma.user.findFirst({ where: { email } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email,
        password,
        nom: 'Admin',
        prenom: 'Maquis',
        adresse: firstEntreprise.adresse || 'Ouagadougou',
        tel: '70000000',
        roleId: firstAdminRole.id,
        entrepriseId: firstEntreprise.id,
        employe: { create: { salaire: 250000, dateEmbauche: new Date() } },
      },
    });
  } else {
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: {
        password,
        nom: 'Admin',
        prenom: 'Maquis',
        roleId: firstAdminRole.id,
        entrepriseId: firstEntreprise.id,
      },
    });

    const employe = await prisma.employe.findUnique({ where: { userId: admin.id } });
    if (!employe) {
      await prisma.employe.create({
        data: { userId: admin.id, salaire: 250000, dateEmbauche: new Date() },
      });
    }
  }

  for (const entreprise of entreprises) {
    const adminRole = await prisma.role.findFirst({
      where: { name: 'ADMIN', entrepriseId: entreprise.id },
    });
    if (!adminRole) continue;

    await prisma.userEntreprise.upsert({
      where: { userId_entrepriseId: { userId: admin.id, entrepriseId: entreprise.id } },
      update: { roleId: adminRole.id },
      create: { userId: admin.id, entrepriseId: entreprise.id, roleId: adminRole.id },
    });
  }

  console.log(`  ✅ Admin par défaut: ${email} / admin123`);
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log('🌱 Démarrage du seed...\n');

  // ── Permissions globales ──
  console.log('🔐 Permissions...');
  const allPerms = await seedPermissions();
  console.log(`  ✅ ${allPerms.length} permissions\n`);

  // ── SUPER_ADMIN ──
  console.log('🦸 SUPER_ADMIN...');
  let superRole = await prisma.role.findFirst({ where: { name: 'SUPER_ADMIN', entrepriseId: null } });
  if (!superRole) {
    superRole = await prisma.role.create({
      data: { name: 'SUPER_ADMIN', description: 'Super admin plateforme', entrepriseId: null },
    });
  }
  await prisma.role.update({ where: { id: superRole.id }, data: { permissions: { set: allPerms.map(p => ({ id: p.id })) } } });

  let superAdmin = await prisma.user.findFirst({ where: { email: 'superadmin@ejomi.com', entrepriseId: null } });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        email: 'superadmin@ejomi.com',
        password: await hash('superadmin123'),
        nom: 'Super',
        prenom: 'Admin',
        adresse: 'Plateforme',
        tel: '99999998',
        roleId: superRole.id,
      },
    });
  }
  console.log(`  ✅ superadmin@ejomi.com / superadmin123\n`);

  // ════════════════════════════════════════════
  // ENTREPRISE 1 — Maquis Le Baobab
  // ════════════════════════════════════════════
  console.log('🏢 Entreprise 1 : Maquis Le Baobab');
  const { entreprise: e1, admin: admin1 } = await seedEntrepriseComplete({
    entrepriseData: {
      email: 'contact@lebaobab.bf',
      nom: 'Maquis Le Baobab',
      tel: '25650101010',
      adresse: 'Ouagadougou, Secteur 15, Burkina Faso',
      heroTitre: 'Bienvenue au Maquis Le Baobab',
      heroSousTitre: 'Bonne cuisine, bonne ambiance',
      histoire: 'Fondé en 2015, Le Baobab est un maquis familial réputé pour sa cuisine locale.',
      mission: 'Offrir une expérience culinaire authentique à nos clients.',
      vision: 'Devenir le maquis de référence à Ouagadougou.',
      valeur: 'Qualité, convivialité, respect.',
    },
    adminEmail: 'admin@lebaobab.bf',
    adminPassword: 'admin123',
    adminNom: 'Sawadogo',
    adminPrenom: 'Issouf',
    adminTel: '70100001',
    employes: [
      { email: 'vendeur@lebaobab.bf', password: 'vendeur123', nom: 'Ouedraogo', prenom: 'Rasmané', tel: '70100002', role: 'VENDEUR', salaire: 75000 },
      { email: 'magasinier@lebaobab.bf', password: 'magasin123', nom: 'Compaoré', prenom: 'Bintou', tel: '70100003', role: 'MAGASINIER', salaire: 65000 },
    ],
    clients: [
      { email: 'client1@gmail.com', nom: 'Traoré', prenom: 'Moussa', tel: '70200001', adresse: 'Ouagadougou, Secteur 10' },
      { email: 'client2@gmail.com', nom: 'Zongo', prenom: 'Fatimata', tel: '70200002', adresse: 'Ouagadougou, Secteur 5' },
      { email: 'client3@gmail.com', nom: 'Kaboré', prenom: 'Adama', tel: '70200003', adresse: 'Ouagadougou, Secteur 22' },
    ],
    produits: [
      { libelle: 'Poulet braisé', description: 'Demi-poulet braisé avec garniture', prixAchat: 1500, prixVente: 2500, qtyMagasin: 50, qtyBoutique: 20 },
      { libelle: 'Riz sauce arachide', description: 'Riz avec sauce arachide et viande', prixAchat: 800, prixVente: 1500, qtyMagasin: 100, qtyBoutique: 40 },
      { libelle: 'Bière Brakina 65cl', description: 'Bière locale bien fraîche', prixAchat: 500, prixVente: 900, qtyMagasin: 200, qtyBoutique: 80 },
      { libelle: 'Jus de bissap', description: 'Jus naturel de bissap maison', prixAchat: 150, prixVente: 300, qtyMagasin: 150, qtyBoutique: 60 },
      { libelle: 'Attiéké poisson', description: 'Attiéké avec poisson braisé', prixAchat: 900, prixVente: 1800, qtyMagasin: 60, qtyBoutique: 25 },
    ],
    fournisseurs: [
      { nom: 'Boucherie Centrale', tel: '70300001', email: 'boucherie@centrale.bf', adresse: 'Marché central Ouaga' },
      { nom: 'Brasserie du Faso', tel: '70300002', email: null, adresse: 'Zone industrielle Ouaga' },
    ],
    allPerms,
  });

  // ════════════════════════════════════════════
  // ENTREPRISE 2 — Boutique Mode Sahel
  // ════════════════════════════════════════════
  console.log('\n🏢 Entreprise 2 : Boutique Mode Sahel');
  const { entreprise: e2, admin: admin2 } = await seedEntrepriseComplete({
    entrepriseData: {
      email: 'contact@modesahel.bf',
      nom: 'Mode Sahel',
      tel: '25650202020',
      adresse: 'Ouagadougou, Avenue Kwamé N\'Krumah',
      heroTitre: 'Mode Sahel — Élégance africaine',
      heroSousTitre: 'Tissus, prêt-à-porter et accessoires',
      histoire: 'Mode Sahel habille la ville depuis 2018.',
      mission: 'Valoriser la mode africaine avec des créations modernes.',
      vision: 'Rayonner dans toute la sous-région.',
      valeur: 'Créativité, authenticité, service.',
    },
    adminEmail: 'admin@modesahel.bf',
    adminPassword: 'admin123',
    adminNom: 'Koné',
    adminPrenom: 'Mariam',
    adminTel: '70400001',
    employes: [
      { email: 'vendeur@modesahel.bf', password: 'vendeur123', nom: 'Diabaté', prenom: 'Seydou', tel: '70400002', role: 'VENDEUR', salaire: 80000 },
      { email: 'gerant@modesahel.bf', password: 'gerant123', nom: 'Coulibaly', prenom: 'Aminata', tel: '70400003', role: 'GERANT', salaire: 120000 },
    ],
    clients: [
      { email: 'client4@gmail.com', nom: 'Diallo', prenom: 'Ibrahim', tel: '70500001', adresse: 'Ouagadougou, Gounghin' },
      { email: 'client5@gmail.com', nom: 'Savadogo', prenom: 'Aïcha', tel: '70500002', adresse: 'Ouagadougou, Pissy' },
    ],
    produits: [
      { libelle: 'Tissu basin riche 5m', description: 'Basin riche importé, 5 mètres', prixAchat: 8000, prixVente: 15000, qtyMagasin: 30, qtyBoutique: 10 },
      { libelle: 'Boubou homme brodé', description: 'Boubou traditionnel brodé main', prixAchat: 12000, prixVente: 25000, qtyMagasin: 20, qtyBoutique: 8 },
      { libelle: 'Pagne wax 6 yards', description: 'Pagne wax hollandais authentique', prixAchat: 5000, prixVente: 9000, qtyMagasin: 50, qtyBoutique: 20 },
      { libelle: 'Sac à main cuir', description: 'Sac cuir artisanal teint naturel', prixAchat: 6000, prixVente: 12000, qtyMagasin: 15, qtyBoutique: 6 },
    ],
    fournisseurs: [
      { nom: 'Textile Import SARL', tel: '70600001', email: 'textile@import.bf', adresse: 'Zone commerciale Ouaga 2000' },
      { nom: 'Artisans du Sahel', tel: '70600002', email: null, adresse: 'Village artisanal Ouaga' },
    ],
    allPerms,
  });

  // ════════════════════════════════════════════
  // SEED FIFO — deux appros + commandes pour tester la marge
  // ════════════════════════════════════════════
  console.log('\n📦 Seed FIFO (appros + ventes avec marge)...');
  await seedFifo(e2, allPerms);

  // ── ADMIN PAR DÉFAUT ──
  console.log('\n🔑 Admin par défaut...');
  await ensureDefaultAdmin([e1, e2]);

  // ════════════════════════════════════════════
  // USER MULTI-ENTREPRISES (le cas à tester !)
  // ════════════════════════════════════════════
  console.log('\n👤 User multi-entreprises...');

  // Cet utilisateur est admin dans Le Baobab ET gérant dans Mode Sahel
  let multiUser = await prisma.user.findFirst({ where: { email: 'multi@ejomi.com' } });
  if (!multiUser) {
    // Récupérer le rôle ADMIN de l'entreprise 1
    const roleAdmin1 = await prisma.role.findFirst({ where: { name: 'ADMIN', entrepriseId: e1.id } });
    multiUser = await prisma.user.create({
      data: {
        email: 'multi@ejomi.com',
        password: await hash('multi123'),
        nom: 'Multisite',
        prenom: 'Kader',
        adresse: 'Ouagadougou',
        tel: '70700001',
        roleId: roleAdmin1?.id,
        entrepriseId: e1.id, // entreprise principale
        employe: { create: { salaire: 200000, dateEmbauche: new Date('2021-06-01') } },
      },
    });
    console.log(`  ✅ Créé: multi@ejomi.com / multi123`);
  } else {
    console.log(`  ✅ Existe: multi@ejomi.com`);
  }

  // Lier cet user à l'entreprise 1 via UserEntreprise (rôle ADMIN)
  const roleAdminE1 = await prisma.role.findFirst({ where: { name: 'ADMIN', entrepriseId: e1.id } });
  const ue1Exists = await prisma.userEntreprise.findUnique({
    where: { userId_entrepriseId: { userId: multiUser.id, entrepriseId: e1.id } },
  });
  if (!ue1Exists) {
    await prisma.userEntreprise.create({
      data: { userId: multiUser.id, entrepriseId: e1.id, roleId: roleAdminE1?.id },
    });
    console.log(`  🔗 Lié à: Maquis Le Baobab (ADMIN)`);
  }

  // Lier cet user à l'entreprise 2 via UserEntreprise (rôle GERANT)
  const roleGerantE2 = await prisma.role.findFirst({ where: { name: 'GERANT', entrepriseId: e2.id } });
  const ue2Exists = await prisma.userEntreprise.findUnique({
    where: { userId_entrepriseId: { userId: multiUser.id, entrepriseId: e2.id } },
  });
  if (!ue2Exists) {
    await prisma.userEntreprise.create({
      data: { userId: multiUser.id, entrepriseId: e2.id, roleId: roleGerantE2?.id },
    });
    console.log(`  🔗 Lié à: Mode Sahel (GERANT)`);
  }

  // ════════════════════════════════════════════
  // RÉSUMÉ
  // ════════════════════════════════════════════
  console.log('\n' + '═'.repeat(55));
  console.log('📋 COMPTES DE TEST');
  console.log('═'.repeat(55));
  console.log('\n🔑 SUPER ADMIN (toutes entreprises)');
  console.log('  Email    : superadmin@ejomi.com');
  console.log('  Password : superadmin123');

  console.log('\n🔑 ADMIN PAR DÉFAUT (toutes entreprises)');
  console.log('  Email    : admin@maquis.com');
  console.log('  Password : admin123');

  console.log('\n🏢 MAQUIS LE BAOBAB');
  console.log('  Admin    : admin@lebaobab.bf     / admin123');
  console.log('  Vendeur  : vendeur@lebaobab.bf   / vendeur123');
  console.log('  Magasin. : magasinier@lebaobab.bf / magasin123');

  console.log('\n🏢 MODE SAHEL');
  console.log('  Admin    : admin@modesahel.bf    / admin123');
  console.log('  Vendeur  : vendeur@modesahel.bf  / vendeur123');
  console.log('  Gérant   : gerant@modesahel.bf   / gerant123');

  console.log('\n🔀 MULTI-ENTREPRISES (2 entreprises → sélecteur au login)');
  console.log('  Email    : multi@ejomi.com');
  console.log('  Password : multi123');
  console.log('  → Entreprise 1 : Maquis Le Baobab (rôle ADMIN)');
  console.log('  → Entreprise 2 : Mode Sahel      (rôle GERANT)');
  console.log('\n' + '═'.repeat(55));
  console.log('✅ Seed terminé!\n');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('❌ Erreur seed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
