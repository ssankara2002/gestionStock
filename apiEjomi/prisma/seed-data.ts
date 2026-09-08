import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Alimentation des tables avec des données de test...\n');

  // ─── Récupérer l'entreprise de démo ───
  const entreprise = await prisma.entreprise.findUnique({ where: { email: 'contact@ejomi.com' } });
  if (!entreprise) {
    console.error('❌ Entreprise de démo introuvable. Lance d\'abord npm run seed');
    process.exit(1);
  }

  // ─── Récupérer les rôles de l'entreprise ───
  const roleAdmin      = await prisma.role.findFirst({ where: { name: 'ADMIN',      entrepriseId: entreprise.id } });
  const roleVendeur    = await prisma.role.findFirst({ where: { name: 'VENDEUR',    entrepriseId: entreprise.id } });
  const roleMagasinier = await prisma.role.findFirst({ where: { name: 'MAGASINIER', entrepriseId: entreprise.id } });
  const roleClient     = await prisma.role.findFirst({ where: { name: 'CLIENT',     entrepriseId: entreprise.id } });
  const roleGerant     = await prisma.role.findFirst({ where: { name: 'GERANT',     entrepriseId: entreprise.id } });

  if (!roleAdmin || !roleVendeur || !roleMagasinier || !roleClient || !roleGerant) {
    console.error('❌ Rôles manquants. Lance d\'abord npm run seed');
    process.exit(1);
  }

  // ============================================================
  // 1. EMPLOYÉS SUPPLÉMENTAIRES
  // ============================================================
  console.log('👥 Création des employés...');

  const pwd = await bcrypt.hash('password123', 10);

  const employesData = [
    { nom: 'Ouédraogo', prenom: 'Aminata', email: 'aminata@ejomi.com', tel: '70112233', adresse: 'Ouagadougou, Zogona', roleId: roleVendeur.id, salaire: 120000, dateEmbauche: new Date('2023-02-01') },
    { nom: 'Kaboré',    prenom: 'Issouf',  email: 'issouf@ejomi.com',  tel: '76223344', adresse: 'Ouagadougou, Pissy',   roleId: roleMagasinier.id, salaire: 100000, dateEmbauche: new Date('2023-04-15') },
    { nom: 'Traoré',    prenom: 'Mariam',  email: 'mariam@ejomi.com',  tel: '65334455', adresse: 'Ouagadougou, Gounghin', roleId: roleVendeur.id, salaire: 115000, dateEmbauche: new Date('2023-06-01') },
    { nom: 'Sawadogo',  prenom: 'Ibrahim', email: 'ibrahim@ejomi.com', tel: '74445566', adresse: 'Ouagadougou, Karpala',  roleId: roleGerant.id,  salaire: 200000, dateEmbauche: new Date('2022-11-10') },
    { nom: 'Zongo',     prenom: 'Raïssa',  email: 'raissa@ejomi.com',  tel: '77556677', adresse: 'Ouagadougou, Wemtenga', roleId: roleMagasinier.id, salaire: 95000, dateEmbauche: new Date('2024-01-08') },
  ];

  const employes: any[] = [];
  for (const ed of employesData) {
    let user = await prisma.user.findUnique({ where: { email: ed.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          nom: ed.nom, prenom: ed.prenom, email: ed.email, tel: ed.tel,
          adresse: ed.adresse, password: pwd, roleId: ed.roleId, entrepriseId: entreprise.id,
        },
      });
    }
    let employe = await prisma.employe.findUnique({ where: { userId: user.id } });
    if (!employe) {
      employe = await prisma.employe.create({
        data: { userId: user.id, salaire: ed.salaire, dateEmbauche: ed.dateEmbauche },
      });
    }
    employes.push(employe);
  }
  // Récupérer l'employé admin (déjà créé par seed principal)
  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@ejomi.com' } });
  const adminEmploye = adminUser ? await prisma.employe.findUnique({ where: { userId: adminUser.id } }) : null;
  if (adminEmploye) employes.unshift(adminEmploye);

  console.log(`✅ ${employes.length} employés disponibles`);

  // ============================================================
  // 2. CLIENTS
  // ============================================================
  console.log('🧑‍💼 Création des clients...');

  const clientsData = [
    { nom: 'Compaoré', prenom: 'Fatimata', email: 'fatimata.c@gmail.com', tel: '70010001', adresse: 'Ouagadougou, Secteur 15' },
    { nom: 'Nikiema',  prenom: 'Adama',    email: 'adama.n@gmail.com',    tel: '76020002', adresse: 'Ouagadougou, Patte d\'Oie' },
    { nom: 'Diallo',   prenom: 'Seydou',   email: 'seydou.d@gmail.com',   tel: '65030003', adresse: 'Bobo-Dioulasso, Secteur 22' },
    { nom: 'Koné',     prenom: 'Awa',      email: 'awa.k@gmail.com',      tel: '74040004', adresse: 'Koudougou, Centre' },
    { nom: 'Coulibaly', prenom: 'Moussa',  email: 'moussa.c@gmail.com',   tel: '77050005', adresse: 'Ouagadougou, Dassasgho' },
    { nom: 'Barry',    prenom: 'Hawa',     email: 'hawa.b@gmail.com',     tel: '70060006', adresse: 'Ouagadougou, Tampouy' },
    { nom: 'Tapsoba',  prenom: 'Pascal',   email: 'pascal.t@gmail.com',   tel: '76070007', adresse: 'Fada N\'Gourma, Centre' },
    { nom: 'Yameogo',  prenom: 'Christine', email: 'christine.y@gmail.com', tel: '65080008', adresse: 'Ouagadougou, Rimkieta' },
  ];

  const clients: any[] = [];
  for (const cd of clientsData) {
    let user = await prisma.user.findUnique({ where: { email: cd.email } });
    if (!user) {
      user = await prisma.user.create({
        data: { ...cd, password: pwd, roleId: roleClient.id, entrepriseId: entreprise.id },
      });
    }
    clients.push(user);
  }
  console.log(`✅ ${clients.length} clients créés`);

  // ============================================================
  // 3. FOURNISSEURS
  // ============================================================
  console.log('🏭 Création des fournisseurs...');

  const fournisseursData = [
    { nom: 'Sanou',   prenom: 'Ali',     email: 'ali.sanou@fournisseur.com',   tel: '20110001', adresse: 'Zone industrielle, Ouagadougou' },
    { nom: 'Sana',    prenom: 'Brahim',  email: 'brahim.sana@supply.com',      tel: '20220002', adresse: 'Bobo-Dioulasso, Zone commerciale' },
    { nom: 'Ouoba',   prenom: 'Carole',  email: 'carole.ouoba@distrib.com',    tel: '20330003', adresse: 'Ouagadougou, Secteur 28' },
    { nom: 'Belem',   prenom: 'David',   email: 'david.belem@import.com',      tel: '20440004', adresse: 'Koupèla, Centre' },
    { nom: 'Ilboudo', prenom: 'Estelle', email: 'estelle.ilboudo@goods.com',   tel: '20550005', adresse: 'Tenkodogo, Marché central' },
  ];

  const fournisseurs: any[] = [];
  for (const fd of fournisseursData) {
    let f = await prisma.fournisseur.findFirst({ where: { tel: fd.tel, entrepriseId: entreprise.id } });
    if (!f) {
      f = await prisma.fournisseur.create({ data: { ...fd, entrepriseId: entreprise.id } });
    }
    fournisseurs.push(f);
  }
  console.log(`✅ ${fournisseurs.length} fournisseurs créés`);

  // ============================================================
  // 4. PRODUITS + STOCKS
  // ============================================================
  console.log('📦 Création des produits...');

  const produitsData = [
    { libelle: 'Riz basmati 25kg',       description: 'Riz basmati qualité premium',    prixAchat: 15000, prixVente: 20000, stockMag: 150, stockBout: 50  },
    { libelle: 'Huile végétale 5L',       description: 'Huile végétale raffinée',         prixAchat: 4500,  prixVente: 6000,  stockMag: 200, stockBout: 80  },
    { libelle: 'Sucre en poudre 50kg',    description: 'Sucre cristallisé blanc',         prixAchat: 25000, prixVente: 32000, stockMag: 80,  stockBout: 30  },
    { libelle: 'Farine de blé 50kg',      description: 'Farine type 55',                  prixAchat: 18000, prixVente: 24000, stockMag: 100, stockBout: 40  },
    { libelle: 'Savon de ménage 1kg',     description: 'Savon multi-usages',              prixAchat: 350,   prixVente: 500,   stockMag: 500, stockBout: 200 },
    { libelle: 'Lait en poudre 400g',     description: 'Lait entier en poudre',           prixAchat: 1800,  prixVente: 2500,  stockMag: 300, stockBout: 100 },
    { libelle: 'Café soluble 200g',        description: 'Café instantané',                 prixAchat: 1200,  prixVente: 1800,  stockMag: 250, stockBout: 90  },
    { libelle: 'Pâtes alimentaires 500g', description: 'Spaghetti qualité supérieure',    prixAchat: 600,   prixVente: 900,   stockMag: 400, stockBout: 150 },
    { libelle: 'Sel iodé 1kg',            description: 'Sel de cuisine iodé',             prixAchat: 150,   prixVente: 250,   stockMag: 600, stockBout: 250 },
    { libelle: 'Tomate concentrée 400g',  description: 'Double concentré de tomates',     prixAchat: 500,   prixVente: 750,   stockMag: 350, stockBout: 120 },
    { libelle: 'Sardines en boîte 125g',  description: 'Sardines à l\'huile végétale',    prixAchat: 700,   prixVente: 1000,  stockMag: 280, stockBout: 100 },
    { libelle: 'Beurre de karité 1kg',    description: 'Beurre de karité pur naturel',    prixAchat: 2500,  prixVente: 4000,  stockMag: 120, stockBout: 50  },
  ];

  const produits: any[] = [];
  for (const pd of produitsData) {
    let p = await prisma.produit.findFirst({ where: { libelle: pd.libelle, entrepriseId: entreprise.id } });
    if (!p) {
      p = await prisma.produit.create({
        data: {
          libelle: pd.libelle,
          description: pd.description,
          prixAchatUnitaire: pd.prixAchat,
          prixDeVenteUnitaire: pd.prixVente,
          entrepriseId: entreprise.id,
          stockMagasin: { create: { quantite: pd.stockMag, seuilAlerte: 20 } },
          stockBoutique: { create: { quantite: pd.stockBout, seuilAlerte: 10 } },
        },
      });
    }
    produits.push(p);
  }
  console.log(`✅ ${produits.length} produits créés avec stocks`);

  // ============================================================
  // 5. APPROVISIONNEMENTS
  // ============================================================
  console.log('🚚 Création des approvisionnements...');

  const magasinierEmploye = employes.find(e => e.id !== adminEmploye?.id) ?? employes[0];

  const approsData = [
    { date: new Date('2024-10-05'), fournisseurIdx: 0, lignes: [{ produitIdx: 0, qte: 50, pu: 15000 }, { produitIdx: 1, qte: 100, pu: 4500 }] },
    { date: new Date('2024-10-20'), fournisseurIdx: 1, lignes: [{ produitIdx: 2, qte: 40, pu: 25000 }, { produitIdx: 3, qte: 50, pu: 18000 }] },
    { date: new Date('2024-11-03'), fournisseurIdx: 2, lignes: [{ produitIdx: 4, qte: 200, pu: 350 }, { produitIdx: 5, qte: 150, pu: 1800 }] },
    { date: new Date('2024-11-18'), fournisseurIdx: 0, lignes: [{ produitIdx: 6, qte: 100, pu: 1200 }, { produitIdx: 7, qte: 200, pu: 600 }] },
    { date: new Date('2024-12-02'), fournisseurIdx: 3, lignes: [{ produitIdx: 8, qte: 300, pu: 150 }, { produitIdx: 9, qte: 150, pu: 500 }] },
    { date: new Date('2025-01-10'), fournisseurIdx: 4, lignes: [{ produitIdx: 10, qte: 120, pu: 700 }, { produitIdx: 11, qte: 60, pu: 2500 }] },
  ];

  for (const ad of approsData) {
    const montantTotal = ad.lignes.reduce((s, l) => s + l.qte * l.pu, 0);
    const appro = await prisma.approvisionnement.create({
      data: {
        dateApprovisionnement: ad.date,
        montant: montantTotal,
        fournisseurId: fournisseurs[ad.fournisseurIdx].id,
        employeId: magasinierEmploye.id,
        entrepriseId: entreprise.id,
        lignes: {
          create: ad.lignes.map(l => {
            const stockMagasinId = produits[l.produitIdx].id; // sera résolu ci-dessous
            return {
              quantite: l.qte,
              prixUnitaire: l.pu,
              montant: l.qte * l.pu,
              produitId: produits[l.produitIdx].id,
            };
          }),
        },
      },
    });
    // Transaction financière
    await prisma.transaction.create({
      data: {
        type: 'SORTIE',
        libelle: `Approvisionnement fournisseur ${fournisseurs[ad.fournisseurIdx].nom}`,
        montant: montantTotal,
        date: ad.date,
        entrepriseId: entreprise.id,
        approvisionnementId: appro.id,
      },
    });
  }
  console.log(`✅ ${approsData.length} approvisionnements créés`);

  // ============================================================
  // 6. COMMANDES + PAIEMENTS
  // ============================================================
  console.log('🛒 Création des commandes...');

  const vendeurEmploye = employes[1] ?? employes[0]; // Aminata

  const commandesData = [
    { date: new Date('2024-10-08'), clientIdx: 0, statut: 'LIVREE',    lignes: [{ produitIdx: 0, qte: 2, pu: 20000 }, { produitIdx: 1, qte: 3, pu: 6000 }], montantPaye: 58000, mode: 'ESPECES' },
    { date: new Date('2024-10-15'), clientIdx: 1, statut: 'LIVREE',    lignes: [{ produitIdx: 4, qte: 10, pu: 500 }, { produitIdx: 5, qte: 5, pu: 2500 }],  montantPaye: 17500, mode: 'MOBILE_MONEY' },
    { date: new Date('2024-10-22'), clientIdx: 2, statut: 'LIVREE',    lignes: [{ produitIdx: 2, qte: 1, pu: 32000 }, { produitIdx: 7, qte: 5, pu: 900 }],  montantPaye: 36500, mode: 'ORANGE_MONEY' },
    { date: new Date('2024-11-05'), clientIdx: 3, statut: 'CONFIRMEE', lignes: [{ produitIdx: 6, qte: 3, pu: 1800 }, { produitIdx: 8, qte: 5, pu: 250 }],   montantPaye: 6650,  mode: 'ESPECES' },
    { date: new Date('2024-11-12'), clientIdx: 4, statut: 'LIVREE',    lignes: [{ produitIdx: 9, qte: 6, pu: 750 }, { produitIdx: 10, qte: 4, pu: 1000 }],  montantPaye: 8500,  mode: 'MOOV_MONEY' },
    { date: new Date('2024-11-20'), clientIdx: 5, statut: 'LIVREE',    lignes: [{ produitIdx: 3, qte: 1, pu: 24000 }, { produitIdx: 11, qte: 2, pu: 4000 }], montantPaye: 32000, mode: 'ESPECES' },
    { date: new Date('2024-12-01'), clientIdx: 6, statut: 'EN_ATTENTE', lignes: [{ produitIdx: 0, qte: 3, pu: 20000 }, { produitIdx: 4, qte: 20, pu: 500 }], montantPaye: 50000, mode: 'CARTE_BANCAIRE' },
    { date: new Date('2024-12-10'), clientIdx: 7, statut: 'LIVREE',    lignes: [{ produitIdx: 1, qte: 5, pu: 6000 }, { produitIdx: 5, qte: 8, pu: 2500 }],  montantPaye: 50000, mode: 'ESPECES' },
    { date: new Date('2025-01-05'), clientIdx: 0, statut: 'CONFIRMEE', lignes: [{ produitIdx: 6, qte: 5, pu: 1800 }, { produitIdx: 7, qte: 10, pu: 900 }],  montantPaye: 18000, mode: 'MOBILE_MONEY' },
    { date: new Date('2025-01-15'), clientIdx: 2, statut: 'LIVREE',    lignes: [{ produitIdx: 8, qte: 10, pu: 250 }, { produitIdx: 9, qte: 8, pu: 750 }],   montantPaye: 8500,  mode: 'ESPECES' },
  ];

  for (const cd of commandesData) {
    const montantTotal = cd.lignes.reduce((s, l) => s + l.qte * l.pu, 0);
    const creance = Math.max(0, montantTotal - cd.montantPaye);

    const commande = await prisma.commande.create({
      data: {
        dateCommande: cd.date,
        montant: montantTotal,
        statut: cd.statut as any,
        clientId: clients[cd.clientIdx].id,
        vendeurId: vendeurEmploye.id,
        entrepriseId: entreprise.id,
        lignes: {
          create: cd.lignes.map(l => ({
            quantiteCommande: l.qte,
            prixUnitaire: l.pu,
            montant: l.qte * l.pu,
            produitId: produits[l.produitIdx].id,
          })),
        },
        paiements: {
          create: [{
            montant: cd.montantPaye,
            creance,
            statut: 'REUSSI' as any,
            modePaiement: cd.mode as any,
            datePaiement: cd.date,
          }],
        },
      },
    });

    // Transaction financière
    await prisma.transaction.create({
      data: {
        type: 'ENTREE',
        libelle: `Vente client ${clients[cd.clientIdx].prenom} ${clients[cd.clientIdx].nom}`,
        montant: cd.montantPaye,
        date: cd.date,
        entrepriseId: entreprise.id,
        commandeId: commande.id,
      },
    });
  }
  console.log(`✅ ${commandesData.length} commandes créées avec paiements`);

  // ============================================================
  // 7. ABSENCES
  // ============================================================
  console.log('📅 Création des absences...');

  const absencesData = [
    { employeIdx: 1, motif: 'Maladie', date: new Date('2024-10-14') },
    { employeIdx: 2, motif: 'Décès dans la famille', date: new Date('2024-11-02') },
    { employeIdx: 3, motif: 'Maladie', date: new Date('2024-11-20') },
    { employeIdx: 4, motif: 'Rendez-vous médical', date: new Date('2024-12-05') },
    { employeIdx: 1, motif: 'Absence injustifiée', date: new Date('2025-01-08') },
  ];

  for (const ab of absencesData) {
    await prisma.absence.create({
      data: { motif: ab.motif, date: ab.date, employeId: employes[ab.employeIdx].id },
    });
  }
  console.log(`✅ ${absencesData.length} absences créées`);

  // ============================================================
  // 8. CONGÉS
  // ============================================================
  console.log('🏖️  Création des congés...');

  const congesData = [
    { employeIdx: 0, type: 'ANNUEL',   debut: new Date('2024-12-23'), fin: new Date('2025-01-05'), statut: 'APPROUVE', desc: 'Congé annuel fin d\'année' },
    { employeIdx: 1, type: 'MALADIE',  debut: new Date('2024-11-10'), fin: new Date('2024-11-15'), statut: 'APPROUVE', desc: 'Congé maladie avec certificat médical' },
    { employeIdx: 2, type: 'ANNUEL',   debut: new Date('2025-02-01'), fin: new Date('2025-02-15'), statut: 'EN_ATTENTE', desc: 'Congé annuel 2025' },
    { employeIdx: 3, type: 'SPECIAL',  debut: new Date('2024-10-20'), fin: new Date('2024-10-22'), statut: 'APPROUVE', desc: 'Mariage d\'un proche' },
    { employeIdx: 4, type: 'ANNUEL',   debut: new Date('2025-03-10'), fin: new Date('2025-03-24'), statut: 'EN_ATTENTE', desc: 'Congé annuel demandé' },
  ];

  for (const cg of congesData) {
    await prisma.conge.create({
      data: {
        type: cg.type, dateDebut: cg.debut, dateFin: cg.fin,
        statut: cg.statut, description: cg.desc,
        employeId: employes[cg.employeIdx].id,
      },
    });
  }
  console.log(`✅ ${congesData.length} congés créés`);

  // ============================================================
  // 9. PAIEMENTS SALAIRES
  // ============================================================
  console.log('💰 Création des paiements de salaires...');

  const mois = [
    new Date('2024-10-01'), new Date('2024-11-01'), new Date('2024-12-01'), new Date('2025-01-01'),
  ];

  for (const employe of employes.slice(0, 5)) {
    for (const periode of mois) {
      const datePaiement = new Date(periode);
      datePaiement.setDate(28);
      const sal = await prisma.salairePaiement.create({
        data: {
          montant: employe.salaire,
          datePaiement,
          modePaiement: 'ESPECES',
          periode,
          avantage: 5000,
          indemnite: 10000,
          employeId: employe.id,
        },
      });
      await prisma.transaction.create({
        data: {
          type: 'SORTIE',
          libelle: `Salaire ${periode.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`,
          montant: employe.salaire,
          date: datePaiement,
          entrepriseId: entreprise.id,
          salairePaiementId: sal.id,
        },
      });
    }
  }
  console.log(`✅ Paiements salaires créés (${employes.slice(0, 5).length} employés × ${mois.length} mois)`);

  // ============================================================
  // 10. CONTACTS
  // ============================================================
  console.log('📬 Création des messages de contact...');

  const contactsData = [
    { nom: 'Alain Konaté', email: 'alain.k@gmail.com', sujet: 'Demande de tarif', message: 'Bonjour, pouvez-vous m\'envoyer votre catalogue de prix pour les produits alimentaires ?', statut: 'TRAITE' },
    { nom: 'Sophie Dao',   email: 'sophie.d@gmail.com', sujet: 'Commande en gros', message: 'Je souhaite commander 10 sacs de riz et 20 bidons d\'huile. Faites-vous des remises sur grosses quantités ?', statut: 'LU' },
    { nom: 'Marc Ouoba',   email: 'marc.o@gmail.com',   sujet: 'Problème livraison', message: 'Ma commande du 15 novembre n\'est toujours pas arrivée. Pouvez-vous vérifier ?', statut: 'TRAITE' },
    { nom: 'Claire Yoda',  email: 'claire.y@gmail.com', sujet: 'Partenariat',       message: 'Nous sommes une association et souhaitons établir un partenariat pour l\'approvisionnement régulier.', statut: 'NON_LU' },
    { nom: 'Roger Sanogo', email: 'roger.s@gmail.com',  sujet: 'Question produit',  message: 'Est-ce que le beurre de karité est certifié bio ?', statut: 'NON_LU' },
    { nom: 'Aida Zorome',  email: 'aida.z@gmail.com',   sujet: 'Félicitations',     message: 'Excellent service ! Mes commandes arrivent toujours à temps. Continuez comme ça !', statut: 'LU' },
  ];

  for (const ct of contactsData) {
    await prisma.contact.create({
      data: { ...ct, statut: ct.statut as any, entrepriseId: entreprise.id },
    });
  }
  console.log(`✅ ${contactsData.length} messages de contact créés`);

  // ============================================================
  // 11. RÉSUMÉ FINAL
  // ============================================================
  console.log('\n📊 RÉSUMÉ DES DONNÉES INSÉRÉES:');
  console.log(`• Employés    : ${employes.length}`);
  console.log(`• Clients     : ${clients.length}`);
  console.log(`• Fournisseurs: ${fournisseurs.length}`);
  console.log(`• Produits    : ${produits.length}`);
  console.log(`• Approvisionnements: ${approsData.length}`);
  console.log(`• Commandes   : ${commandesData.length}`);
  console.log(`• Absences    : ${absencesData.length}`);
  console.log(`• Congés      : ${congesData.length}`);
  console.log(`• Paiements salaires: ${employes.slice(0, 5).length * mois.length}`);
  console.log(`• Contacts    : ${contactsData.length}`);
  console.log('\n✅ Alimentation terminée avec succès!');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('❌ Erreur:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
