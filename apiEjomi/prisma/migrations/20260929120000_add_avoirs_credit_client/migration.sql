-- Avoirs (crédits / remboursements client), crédit client et numérotation des reçus

-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AvoirType') THEN
    CREATE TYPE "public"."AvoirType" AS ENUM ('REMBOURSEMENT', 'CREDIT', 'GARDE', 'MONNAIE', 'PRODUITS');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AvoirStatut') THEN
    CREATE TYPE "public"."AvoirStatut" AS ENUM ('EN_ATTENTE', 'VALIDE', 'ANNULE', 'REMBOURSE', 'CONSOMME');
  END IF;
END $$;

ALTER TYPE "public"."AvoirType" ADD VALUE IF NOT EXISTS 'GARDE';
ALTER TYPE "public"."AvoirType" ADD VALUE IF NOT EXISTS 'MONNAIE';
ALTER TYPE "public"."AvoirType" ADD VALUE IF NOT EXISTS 'PRODUITS';
ALTER TYPE "public"."AvoirStatut" ADD VALUE IF NOT EXISTS 'REMBOURSE';
ALTER TYPE "public"."AvoirStatut" ADD VALUE IF NOT EXISTS 'CONSOMME';

-- Colonnes
ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "creditClient" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "public"."Commande"
  ADD COLUMN IF NOT EXISTS "numeroRecu" INTEGER;

-- Tables
CREATE TABLE IF NOT EXISTS "public"."Avoir" (
    "id" SERIAL NOT NULL,
    "dateAvoir" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montant" DOUBLE PRECISION NOT NULL,
    "motif" TEXT,
    "type" "public"."AvoirType" NOT NULL DEFAULT 'CREDIT',
    "statut" "public"."AvoirStatut" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateRemboursement" TIMESTAMP(3),
    "commandeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "vendeurId" INTEGER,
    "entrepriseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Avoir_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."Avoir"
  ADD COLUMN IF NOT EXISTS "dateRemboursement" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "public"."LigneAvoir" (
    "id" SERIAL NOT NULL,
    "avoirId" INTEGER NOT NULL,
    "produitId" INTEGER,
    "platId" INTEGER,
    "quantite" INTEGER NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "LigneAvoir_pkey" PRIMARY KEY ("id")
);

-- Clés étrangères
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Avoir_commandeId_fkey') THEN
    ALTER TABLE "public"."Avoir" ADD CONSTRAINT "Avoir_commandeId_fkey"
      FOREIGN KEY ("commandeId") REFERENCES "public"."Commande"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Avoir_clientId_fkey') THEN
    ALTER TABLE "public"."Avoir" ADD CONSTRAINT "Avoir_clientId_fkey"
      FOREIGN KEY ("clientId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Avoir_vendeurId_fkey') THEN
    ALTER TABLE "public"."Avoir" ADD CONSTRAINT "Avoir_vendeurId_fkey"
      FOREIGN KEY ("vendeurId") REFERENCES "public"."Employe"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Avoir_entrepriseId_fkey') THEN
    ALTER TABLE "public"."Avoir" ADD CONSTRAINT "Avoir_entrepriseId_fkey"
      FOREIGN KEY ("entrepriseId") REFERENCES "public"."Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LigneAvoir_avoirId_fkey') THEN
    ALTER TABLE "public"."LigneAvoir" ADD CONSTRAINT "LigneAvoir_avoirId_fkey"
      FOREIGN KEY ("avoirId") REFERENCES "public"."Avoir"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LigneAvoir_produitId_fkey') THEN
    ALTER TABLE "public"."LigneAvoir" ADD CONSTRAINT "LigneAvoir_produitId_fkey"
      FOREIGN KEY ("produitId") REFERENCES "public"."Produit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LigneAvoir_platId_fkey') THEN
    ALTER TABLE "public"."LigneAvoir" ADD CONSTRAINT "LigneAvoir_platId_fkey"
      FOREIGN KEY ("platId") REFERENCES "public"."Plat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
