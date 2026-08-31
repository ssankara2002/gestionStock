-- CreateEnum
CREATE TYPE "public"."SensTransfert" AS ENUM ('MAGASIN_VERS_BOUTIQUE', 'BOUTIQUE_VERS_MAGASIN');

-- CreateEnum
CREATE TYPE "public"."LieuStock" AS ENUM ('MAGASIN', 'BOUTIQUE');

-- CreateEnum
CREATE TYPE "public"."SessionInventaireStatut" AS ENUM ('EN_COURS', 'TERMINE', 'VALIDE', 'ANNULE');

-- CreateEnum
CREATE TYPE "public"."CommandeStatut" AS ENUM ('EN_ATTENTE', 'CONFIRMEE', 'EN_PREPARATION', 'PRETE', 'LIVREE', 'ANNULEE');

-- DropIndex
DROP INDEX "public"."Produit_quantiteStock_idx";

-- AlterTable Approvisionnement
ALTER TABLE "public"."Approvisionnement" ADD COLUMN "lieu" "public"."LieuStock" NOT NULL DEFAULT 'MAGASIN';

-- AlterTable Commande
ALTER TABLE "public"."Commande"
  ADD COLUMN "lieu" "public"."LieuStock" NOT NULL DEFAULT 'BOUTIQUE',
  ALTER COLUMN "dateCommande" SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN "montant" SET DATA TYPE DOUBLE PRECISION;

ALTER TABLE "public"."Commande" DROP COLUMN "statut";
ALTER TABLE "public"."Commande" ADD COLUMN "statut" "public"."CommandeStatut" NOT NULL DEFAULT 'EN_ATTENTE';

-- AlterTable HistoriqueInventaire — DEFAULT temporaire pour les lignes existantes
ALTER TABLE "public"."HistoriqueInventaire"
  ADD COLUMN "lieuInventaire" "public"."LieuStock",
  ADD COLUMN "sessionInventaireId" INTEGER,
  ADD COLUMN "stockBoutiqueId" INTEGER,
  ADD COLUMN "stockMagasinId" INTEGER;

UPDATE "public"."HistoriqueInventaire" SET "lieuInventaire" = 'MAGASIN' WHERE "lieuInventaire" IS NULL;
ALTER TABLE "public"."HistoriqueInventaire" ALTER COLUMN "lieuInventaire" SET NOT NULL;

-- AlterTable LigneApprovisionnement — DEFAULT temporaire pour les lignes existantes
ALTER TABLE "public"."LigneApprovisionnement"
  ADD COLUMN "prixUnitaire" DOUBLE PRECISION,
  ADD COLUMN "stockMagasinId" INTEGER;

UPDATE "public"."LigneApprovisionnement" SET "prixUnitaire" = "montant" / NULLIF("quantite", 0) WHERE "prixUnitaire" IS NULL;
UPDATE "public"."LigneApprovisionnement" SET "prixUnitaire" = 0 WHERE "prixUnitaire" IS NULL;
ALTER TABLE "public"."LigneApprovisionnement" ALTER COLUMN "prixUnitaire" SET NOT NULL;

-- AlterTable LigneCommande — DEFAULT temporaire pour les lignes existantes
ALTER TABLE "public"."LigneCommande"
  ADD COLUMN "prixUnitaire" DOUBLE PRECISION,
  ADD COLUMN "stockBoutiqueId" INTEGER,
  ALTER COLUMN "montant" SET DATA TYPE DOUBLE PRECISION;

UPDATE "public"."LigneCommande" SET "prixUnitaire" = "montant" / NULLIF("quantiteCommande", 0) WHERE "prixUnitaire" IS NULL;
UPDATE "public"."LigneCommande" SET "prixUnitaire" = 0 WHERE "prixUnitaire" IS NULL;
ALTER TABLE "public"."LigneCommande" ALTER COLUMN "prixUnitaire" SET NOT NULL;

-- AlterTable MatierePremiere
ALTER TABLE "public"."MatierePremiere" ALTER COLUMN "quantiteStock" SET DEFAULT 0;

-- AlterTable Production
ALTER TABLE "public"."Production" ADD COLUMN "stockMagasinId" INTEGER;

-- AlterTable Produit — migrer quantiteStock vers StockMagasin/StockBoutique avant de supprimer
ALTER TABLE "public"."Produit" ALTER COLUMN "prixAchatUnitaire" SET DATA TYPE DOUBLE PRECISION;

-- CreateTable StockMagasin
CREATE TABLE "public"."StockMagasin" (
    "id" SERIAL NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "seuilAlerte" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMagasin_pkey" PRIMARY KEY ("id")
);

-- CreateTable StockBoutique
CREATE TABLE "public"."StockBoutique" (
    "id" SERIAL NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 0,
    "seuilAlerte" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockBoutique_pkey" PRIMARY KEY ("id")
);

-- Migrer quantiteStock vers StockMagasin et StockBoutique pour tous les produits existants
INSERT INTO "public"."StockMagasin" ("produitId", "quantite", "seuilAlerte", "updatedAt")
SELECT "id", COALESCE("quantiteStock", 0), 10, CURRENT_TIMESTAMP FROM "public"."Produit";

INSERT INTO "public"."StockBoutique" ("produitId", "quantite", "seuilAlerte", "updatedAt")
SELECT "id", 0, 5, CURRENT_TIMESTAMP FROM "public"."Produit";

-- Supprimer quantiteStock de Produit
ALTER TABLE "public"."Produit" DROP COLUMN "quantiteStock";

-- CreateTable TransfertStock
CREATE TABLE "public"."TransfertStock" (
    "id" SERIAL NOT NULL,
    "quantite" INTEGER NOT NULL,
    "sens" "public"."SensTransfert" NOT NULL,
    "motif" TEXT,
    "dateTransfert" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "produitId" INTEGER NOT NULL,
    "employeId" INTEGER NOT NULL,
    "stockMagasinId" INTEGER,
    "stockBoutiqueId" INTEGER,

    CONSTRAINT "TransfertStock_pkey" PRIMARY KEY ("id")
);

-- CreateTable SessionInventaire
CREATE TABLE "public"."SessionInventaire" (
    "id" SERIAL NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),
    "statut" "public"."SessionInventaireStatut" NOT NULL DEFAULT 'EN_COURS',
    "lieu" "public"."LieuStock" NOT NULL,
    "commentaire" TEXT,
    "employeId" INTEGER NOT NULL,

    CONSTRAINT "SessionInventaire_pkey" PRIMARY KEY ("id")
);

-- AlterTable Transaction
ALTER TABLE "public"."Transaction"
  ADD COLUMN "transfertStockId" INTEGER,
  ALTER COLUMN "date" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "StockMagasin_produitId_key" ON "public"."StockMagasin"("produitId");

-- CreateIndex
CREATE UNIQUE INDEX "StockBoutique_produitId_key" ON "public"."StockBoutique"("produitId");

-- CreateIndex
CREATE INDEX "TransfertStock_produitId_idx" ON "public"."TransfertStock"("produitId");

-- CreateIndex
CREATE INDEX "Approvisionnement_lieu_idx" ON "public"."Approvisionnement"("lieu");

-- CreateIndex
CREATE INDEX "Commande_lieu_idx" ON "public"."Commande"("lieu");

-- CreateIndex
CREATE UNIQUE INDEX "HistoriqueInventaire_sessionInventaireId_produitId_lieuInve_key"
  ON "public"."HistoriqueInventaire"("sessionInventaireId", "produitId", "lieuInventaire");

-- AddForeignKey
ALTER TABLE "public"."StockMagasin" ADD CONSTRAINT "StockMagasin_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "public"."Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StockBoutique" ADD CONSTRAINT "StockBoutique_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "public"."Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransfertStock" ADD CONSTRAINT "TransfertStock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "public"."Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransfertStock" ADD CONSTRAINT "TransfertStock_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "public"."Employe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransfertStock" ADD CONSTRAINT "TransfertStock_stockMagasinId_fkey" FOREIGN KEY ("stockMagasinId") REFERENCES "public"."StockMagasin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TransfertStock" ADD CONSTRAINT "TransfertStock_stockBoutiqueId_fkey" FOREIGN KEY ("stockBoutiqueId") REFERENCES "public"."StockBoutique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SessionInventaire" ADD CONSTRAINT "SessionInventaire_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "public"."Employe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistoriqueInventaire" ADD CONSTRAINT "HistoriqueInventaire_sessionInventaireId_fkey" FOREIGN KEY ("sessionInventaireId") REFERENCES "public"."SessionInventaire"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistoriqueInventaire" ADD CONSTRAINT "HistoriqueInventaire_stockMagasinId_fkey" FOREIGN KEY ("stockMagasinId") REFERENCES "public"."StockMagasin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."HistoriqueInventaire" ADD CONSTRAINT "HistoriqueInventaire_stockBoutiqueId_fkey" FOREIGN KEY ("stockBoutiqueId") REFERENCES "public"."StockBoutique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LigneCommande" ADD CONSTRAINT "LigneCommande_stockBoutiqueId_fkey" FOREIGN KEY ("stockBoutiqueId") REFERENCES "public"."StockBoutique"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LigneApprovisionnement" ADD CONSTRAINT "LigneApprovisionnement_stockMagasinId_fkey" FOREIGN KEY ("stockMagasinId") REFERENCES "public"."StockMagasin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Production" ADD CONSTRAINT "Production_stockMagasinId_fkey" FOREIGN KEY ("stockMagasinId") REFERENCES "public"."StockMagasin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_transfertStockId_fkey" FOREIGN KEY ("transfertStockId") REFERENCES "public"."TransfertStock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
