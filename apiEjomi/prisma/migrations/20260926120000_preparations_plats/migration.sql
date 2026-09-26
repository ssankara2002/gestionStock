-- Préparations de plats : recettes, préparations, stock plat, unité matière première.
-- Idempotente : ces changements ont pu être appliqués à la main (voir MIGRATIONS_MANUAL.sql).

-- MatierePremiere
ALTER TABLE "public"."MatierePremiere" ADD COLUMN IF NOT EXISTS "unite" TEXT NOT NULL DEFAULT 'unité';
ALTER TABLE "public"."MatierePremiere" ALTER COLUMN "quantiteStock" SET DATA TYPE DOUBLE PRECISION;
ALTER TABLE "public"."MatierePremiere" ALTER COLUMN "quantiteStock" SET DEFAULT 0;
ALTER TABLE "public"."MatierePremiere" ALTER COLUMN "prixAchat" SET DEFAULT 0;

-- Plat
ALTER TABLE "public"."Plat" ADD COLUMN IF NOT EXISTS "stockPlat" INTEGER NOT NULL DEFAULT 0;

-- RecettePlat
CREATE TABLE IF NOT EXISTS "public"."RecettePlat" (
    "id" SERIAL NOT NULL,
    "platId" INTEGER NOT NULL,
    "matierePremiereId" INTEGER NOT NULL,
    "quantiteParPortion" DOUBLE PRECISION NOT NULL,
    "unite" TEXT NOT NULL DEFAULT 'g',
    CONSTRAINT "RecettePlat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "RecettePlat_platId_matierePremiereId_key" ON "public"."RecettePlat"("platId", "matierePremiereId");

-- PreparationPlat
CREATE TABLE IF NOT EXISTS "public"."PreparationPlat" (
    "id" SERIAL NOT NULL,
    "platId" INTEGER NOT NULL,
    "nombrePortions" INTEGER NOT NULL DEFAULT 1,
    "datePreparation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    CONSTRAINT "PreparationPlat_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PreparationPlat_platId_idx" ON "public"."PreparationPlat"("platId");
CREATE INDEX IF NOT EXISTS "PreparationPlat_datePreparation_idx" ON "public"."PreparationPlat"("datePreparation");

-- LignePreparation
CREATE TABLE IF NOT EXISTS "public"."LignePreparation" (
    "id" SERIAL NOT NULL,
    "preparationId" INTEGER NOT NULL,
    "matierePremiereId" INTEGER NOT NULL,
    "quantiteUtilisee" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "LignePreparation_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "LignePreparation_preparationId_idx" ON "public"."LignePreparation"("preparationId");

-- Clés étrangères
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RecettePlat_platId_fkey') THEN
    ALTER TABLE "public"."RecettePlat" ADD CONSTRAINT "RecettePlat_platId_fkey" FOREIGN KEY ("platId") REFERENCES "public"."Plat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RecettePlat_matierePremiereId_fkey') THEN
    ALTER TABLE "public"."RecettePlat" ADD CONSTRAINT "RecettePlat_matierePremiereId_fkey" FOREIGN KEY ("matierePremiereId") REFERENCES "public"."MatierePremiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PreparationPlat_platId_fkey') THEN
    ALTER TABLE "public"."PreparationPlat" ADD CONSTRAINT "PreparationPlat_platId_fkey" FOREIGN KEY ("platId") REFERENCES "public"."Plat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LignePreparation_preparationId_fkey') THEN
    ALTER TABLE "public"."LignePreparation" ADD CONSTRAINT "LignePreparation_preparationId_fkey" FOREIGN KEY ("preparationId") REFERENCES "public"."PreparationPlat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'LignePreparation_matierePremiereId_fkey') THEN
    ALTER TABLE "public"."LignePreparation" ADD CONSTRAINT "LignePreparation_matierePremiereId_fkey" FOREIGN KEY ("matierePremiereId") REFERENCES "public"."MatierePremiere"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
