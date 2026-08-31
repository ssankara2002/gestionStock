-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."ContactStatut" AS ENUM ('NON_LU', 'LU', 'TRAITE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "public"."LivraisonStatut" AS ENUM ('EN_ATTENTE', 'EN_COURS', 'LIVREE', 'ECHEC');

-- CreateEnum
CREATE TYPE "public"."ModePaiement" AS ENUM ('CARTE_BANCAIRE', 'MOBILE_MONEY', 'FLOOZ', 'T_MONEY', 'MONERO', 'ESPECES', 'ORANGE_MONEY', 'MOOV_MONEY', 'AUTRE');

-- CreateEnum
CREATE TYPE "public"."PaiementStatut" AS ENUM ('EN_ATTENTE', 'REUSSI', 'ECHEC', 'ANNULE');

-- CreateTable
CREATE TABLE "public"."Absence" (
    "id" SERIAL NOT NULL,
    "motif" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "employeId" INTEGER NOT NULL,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Approvisionnement" (
    "id" SERIAL NOT NULL,
    "dateApprovisionnement" TIMESTAMP(3) NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "fournisseurId" INTEGER NOT NULL,
    "employeId" INTEGER NOT NULL,

    CONSTRAINT "Approvisionnement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Commande" (
    "id" SERIAL NOT NULL,
    "dateCommande" TIMESTAMP(3) NOT NULL,
    "montant" INTEGER NOT NULL,
    "reduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'en attente',
    "clientId" INTEGER NOT NULL,
    "vendeurId" INTEGER,

    CONSTRAINT "Commande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Conge" (
    "id" SERIAL NOT NULL,
    "employeId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "statut" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Conge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sujet" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "statut" "public"."ContactStatut" NOT NULL DEFAULT 'NON_LU',
    "dateEnvoi" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reponse" TEXT,
    "dateReponse" TIMESTAMP(3),

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Employe" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "salaire" DOUBLE PRECISION NOT NULL,
    "dateEmbauche" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Fournisseur" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "prenom" TEXT NOT NULL,
    "adresse" TEXT NOT NULL,
    "tel" TEXT NOT NULL,

    CONSTRAINT "Fournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."HistoriqueInventaire" (
    "id" SERIAL NOT NULL,
    "dateInventaire" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeId" INTEGER NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantiteTheorique" INTEGER NOT NULL,
    "quantitePhysique" INTEGER NOT NULL,
    "ecart" INTEGER NOT NULL,
    "commentaire" TEXT,

    CONSTRAINT "HistoriqueInventaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LigneApprovisionnement" (
    "id" SERIAL NOT NULL,
    "quantite" INTEGER NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "approvisionnementId" INTEGER NOT NULL,
    "produitId" INTEGER,
    "matierePremiereId" INTEGER,
    "numeroSerie" TEXT NOT NULL,

    CONSTRAINT "LigneApprovisionnement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LigneCommande" (
    "id" SERIAL NOT NULL,
    "quantiteCommande" INTEGER NOT NULL,
    "montant" INTEGER NOT NULL,
    "commandeId" INTEGER NOT NULL,
    "produitId" INTEGER NOT NULL,

    CONSTRAINT "LigneCommande_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Livraison" (
    "id" SERIAL NOT NULL,
    "dateLivraison" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "public"."LivraisonStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "adresse" TEXT NOT NULL,
    "commandeId" INTEGER NOT NULL,
    "livreurId" INTEGER,

    CONSTRAINT "Livraison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MatierePremiere" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "categorie" TEXT,
    "description" TEXT,
    "quantiteStock" INTEGER NOT NULL,
    "prixAchat" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MatierePremiere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MatierePremiereConsommation" (
    "id" SERIAL NOT NULL,
    "productionId" INTEGER NOT NULL,
    "matierePremiereId" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,

    CONSTRAINT "MatierePremiereConsommation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Paiement" (
    "id" SERIAL NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "creance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commandeId" INTEGER NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "public"."PaiementStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "modePaiement" "public"."ModePaiement" NOT NULL,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Permission" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Production" (
    "id" SERIAL NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantiteFabriquee" INTEGER NOT NULL,
    "dateProduction" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employeId" INTEGER NOT NULL,
    "lot" TEXT,

    CONSTRAINT "Production_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Produit" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "quantiteStock" INTEGER NOT NULL DEFAULT 0,
    "prixDeVenteUnitaire" DOUBLE PRECISION NOT NULL,
    "prixAchatUnitaire" INTEGER NOT NULL,

    CONSTRAINT "Produit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SalairePaiement" (
    "id" SERIAL NOT NULL,
    "employeId" INTEGER NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "datePaiement" TIMESTAMP(3) NOT NULL,
    "modePaiement" TEXT NOT NULL,

    CONSTRAINT "SalairePaiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Transaction" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "commandeId" INTEGER,
    "approvisionnementId" INTEGER,
    "salairePaiementId" INTEGER,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" SERIAL NOT NULL,
    "email" TEXT,
    "adresse" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "roleId" INTEGER,
    "tel" TEXT NOT NULL,
    "password" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_RolesOnPermissions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_RolesOnPermissions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employe_userId_key" ON "public"."Employe"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Fournisseur_email_key" ON "public"."Fournisseur"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Fournisseur_tel_key" ON "public"."Fournisseur"("tel" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "LigneApprovisionnement_numeroSerie_key" ON "public"."LigneApprovisionnement"("numeroSerie" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "public"."Permission"("key" ASC);

-- CreateIndex
CREATE INDEX "Produit_libelle_idx" ON "public"."Produit"("libelle" ASC);

-- CreateIndex
CREATE INDEX "Produit_quantiteStock_idx" ON "public"."Produit"("quantiteStock" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "public"."Role"("name" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_tel_key" ON "public"."User"("tel" ASC);

-- CreateIndex
CREATE INDEX "_RolesOnPermissions_B_index" ON "public"."_RolesOnPermissions"("B" ASC);

-- AddForeignKey
ALTER TABLE "public"."Absence" ADD CONSTRAINT "Absence_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "public"."Employe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Approvisionnement" ADD CONSTRAINT "Approvisionnement_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "public"."Employe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Approvisionnement" ADD CONSTRAINT "Approvisionnement_fournisseurId_fkey" FOREIGN KEY ("fournisseurId") REFERENCES "public"."Fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commande" ADD CONSTRAINT "Commande_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Commande" ADD CONSTRAINT "Commande_vendeurId_fkey" FOREIGN KEY ("vendeurId") REFERENCES "public"."Employe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Conge" ADD CONSTRAINT "Conge_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "public"."Employe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Employe" ADD CONSTRAINT "Employe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistoriqueInventaire" ADD CONSTRAINT "HistoriqueInventaire_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "public"."Employe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistoriqueInventaire" ADD CONSTRAINT "HistoriqueInventaire_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "public"."Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LigneApprovisionnement" ADD CONSTRAINT "LigneApprovisionnement_approvisionnementId_fkey" FOREIGN KEY ("approvisionnementId") REFERENCES "public"."Approvisionnement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LigneApprovisionnement" ADD CONSTRAINT "LigneApprovisionnement_matierePremiereId_fkey" FOREIGN KEY ("matierePremiereId") REFERENCES "public"."MatierePremiere"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LigneApprovisionnement" ADD CONSTRAINT "LigneApprovisionnement_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "public"."Produit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LigneCommande" ADD CONSTRAINT "LigneCommande_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LigneCommande" ADD CONSTRAINT "LigneCommande_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "public"."Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Livraison" ADD CONSTRAINT "Livraison_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Livraison" ADD CONSTRAINT "Livraison_livreurId_fkey" FOREIGN KEY ("livreurId") REFERENCES "public"."Employe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatierePremiereConsommation" ADD CONSTRAINT "MatierePremiereConsommation_matierePremiereId_fkey" FOREIGN KEY ("matierePremiereId") REFERENCES "public"."MatierePremiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MatierePremiereConsommation" ADD CONSTRAINT "MatierePremiereConsommation_productionId_fkey" FOREIGN KEY ("productionId") REFERENCES "public"."Production"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Paiement" ADD CONSTRAINT "Paiement_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Production" ADD CONSTRAINT "Production_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "public"."Employe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Production" ADD CONSTRAINT "Production_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "public"."Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SalairePaiement" ADD CONSTRAINT "SalairePaiement_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "public"."Employe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_approvisionnementId_fkey" FOREIGN KEY ("approvisionnementId") REFERENCES "public"."Approvisionnement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_commandeId_fkey" FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_salairePaiementId_fkey" FOREIGN KEY ("salairePaiementId") REFERENCES "public"."SalairePaiement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RolesOnPermissions" ADD CONSTRAINT "_RolesOnPermissions_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_RolesOnPermissions" ADD CONSTRAINT "_RolesOnPermissions_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

