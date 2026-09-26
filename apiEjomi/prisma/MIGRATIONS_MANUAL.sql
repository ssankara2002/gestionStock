-- =============================================================================
-- HISTORIQUE DES MIGRATIONS MANUELLES — gestion_maquis
-- =============================================================================
-- Ce fichier regroupe toutes les migrations SQL appliquées directement en base
-- (hors prisma migrate dev) depuis le début du projet.
--
-- Pour rejouer sur un nouveau serveur, exécuter dans l'ordre :
--   psql -U maquis_user -d gestion_maquis -f MIGRATIONS_MANUAL.sql
--
-- Les migrations Prisma officielles (0_init → 20260923110000) sont dans
--   prisma/migrations/ et s'appliquent via : prisma migrate deploy
--
-- Ce fichier couvre uniquement les ALTER/CREATE appliqués APRÈS le dernier
-- prisma migrate deploy.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- [1] Création de la table MatierePremiere et ses colonnes
-- Appliqué : après 20260923110000_fournisseur_optional_fields
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."MatierePremiere" (
    "id"           SERIAL NOT NULL,
    "nom"          TEXT NOT NULL,
    "categorie"    TEXT,
    "description"  TEXT,
    "quantiteStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prixAchat"    DOUBLE PRECISION NOT NULL DEFAULT 0,
    "unite"        TEXT NOT NULL DEFAULT 'unité',
    "entrepriseId" INTEGER,

    CONSTRAINT "MatierePremiere_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MatierePremiere_entrepriseId_idx"
    ON "public"."MatierePremiere"("entrepriseId");

ALTER TABLE "public"."MatierePremiere"
    ADD CONSTRAINT IF NOT EXISTS "MatierePremiere_entrepriseId_fkey"
    FOREIGN KEY ("entrepriseId") REFERENCES "public"."Entreprise"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Colonne unite ajoutée après la création initiale
ALTER TABLE "public"."MatierePremiere"
    ADD COLUMN IF NOT EXISTS "unite" TEXT NOT NULL DEFAULT 'unité';


-- -----------------------------------------------------------------------------
-- [2] Création de la table RecettePlat (recette d'un plat = ingrédients)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."RecettePlat" (
    "id"                 SERIAL NOT NULL,
    "platId"             INTEGER NOT NULL,
    "matierePremiereId"  INTEGER NOT NULL,
    "quantiteParPortion" DOUBLE PRECISION NOT NULL,
    "unite"              TEXT NOT NULL DEFAULT 'g',

    CONSTRAINT "RecettePlat_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RecettePlat_platId_matierePremiereId_key" UNIQUE ("platId", "matierePremiereId")
);

ALTER TABLE "public"."RecettePlat"
    ADD CONSTRAINT "RecettePlat_platId_fkey"
    FOREIGN KEY ("platId") REFERENCES "public"."Plat"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."RecettePlat"
    ADD CONSTRAINT "RecettePlat_matierePremiereId_fkey"
    FOREIGN KEY ("matierePremiereId") REFERENCES "public"."MatierePremiere"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Lien LigneApprovisionnement → MatierePremiere
ALTER TABLE "public"."LigneApprovisionnement"
    ADD COLUMN IF NOT EXISTS "matierePremiereId" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'LigneApprovisionnement_matierePremiereId_fkey'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE "public"."LigneApprovisionnement"
      ADD CONSTRAINT "LigneApprovisionnement_matierePremiereId_fkey"
      FOREIGN KEY ("matierePremiereId") REFERENCES "public"."MatierePremiere"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;


-- -----------------------------------------------------------------------------
-- [3] Création des tables PreparationPlat et LignePreparation
-- Remplacement du système Production/MatierePremiereConsommation
-- par PreparationPlat (en-tête) + LignePreparation (lignes ingrédients)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "public"."PreparationPlat" (
    "id"              SERIAL NOT NULL,
    "platId"          INTEGER NOT NULL,
    "nombrePortions"  INTEGER NOT NULL DEFAULT 1,
    "datePreparation" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "note"            TEXT,

    CONSTRAINT "PreparationPlat_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "PreparationPlat_platId_idx"
    ON "public"."PreparationPlat"("platId");

CREATE INDEX IF NOT EXISTS "PreparationPlat_datePreparation_idx"
    ON "public"."PreparationPlat"("datePreparation");

ALTER TABLE "public"."PreparationPlat"
    ADD CONSTRAINT "PreparationPlat_platId_fkey"
    FOREIGN KEY ("platId") REFERENCES "public"."Plat"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "public"."LignePreparation" (
    "id"               SERIAL NOT NULL,
    "preparationId"    INTEGER NOT NULL,
    "matierePremiereId" INTEGER NOT NULL,
    "quantiteUtilisee" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LignePreparation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LignePreparation_preparationId_idx"
    ON "public"."LignePreparation"("preparationId");

ALTER TABLE "public"."LignePreparation"
    ADD CONSTRAINT "LignePreparation_preparationId_fkey"
    FOREIGN KEY ("preparationId") REFERENCES "public"."PreparationPlat"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."LignePreparation"
    ADD CONSTRAINT "LignePreparation_matierePremiereId_fkey"
    FOREIGN KEY ("matierePremiereId") REFERENCES "public"."MatierePremiere"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;


-- -----------------------------------------------------------------------------
-- [4] Ajout stockPlat sur Plat
-- Stock en temps réel des portions de plat prêtes à servir.
-- Incrémenté à chaque préparation, décrémenté à chaque vente.
-- Appliqué : 2026-09-26
-- -----------------------------------------------------------------------------

ALTER TABLE "public"."Plat"
    ADD COLUMN IF NOT EXISTS "stockPlat" INTEGER NOT NULL DEFAULT 0;


-- =============================================================================
-- FIN DES MIGRATIONS MANUELLES
-- =============================================================================
-- Pour vérifier que tout est appliqué :
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'Plat' AND table_schema = 'public'
--   ORDER BY ordinal_position;
-- =============================================================================
