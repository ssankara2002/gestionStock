-- Créer la table Entreprise manquante dans 0_init

CREATE TABLE IF NOT EXISTS "public"."Entreprise" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "tel" TEXT,
    "adresse" TEXT,
    "logo" TEXT,
    "histoire" TEXT,
    "mission" TEXT,
    "vision" TEXT,
    "valeur" TEXT,
    "geolocalisation" TEXT,
    "jourouverture" TEXT[],
    "heureouverture" TEXT[],
    "jourfermeture" TEXT[],
    "heurefermeture" TEXT[],
    "heroTitre" TEXT NOT NULL DEFAULT 'Bienvenue',
    "heroSousTitre" TEXT NOT NULL DEFAULT 'Gérez votre stock efficacement',
    "heroImage" TEXT,
    "facebook" TEXT,
    "instagram" TEXT,
    "twitter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Entreprise_email_key" ON "public"."Entreprise"("email");

-- Ajouter les colonnes entrepriseId manquantes sur les autres tables

ALTER TABLE "public"."Role"
  ADD COLUMN IF NOT EXISTS "entrepriseId" INTEGER;

ALTER TABLE "public"."Produit"
  ADD COLUMN IF NOT EXISTS "entrepriseId" INTEGER;

ALTER TABLE "public"."Fournisseur"
  ADD COLUMN IF NOT EXISTS "entrepriseId" INTEGER;

ALTER TABLE "public"."Approvisionnement"
  ADD COLUMN IF NOT EXISTS "entrepriseId" INTEGER;

ALTER TABLE "public"."Commande"
  ADD COLUMN IF NOT EXISTS "entrepriseId" INTEGER;

ALTER TABLE "public"."Contact"
  ADD COLUMN IF NOT EXISTS "entrepriseId" INTEGER;

ALTER TABLE "public"."MatierePremiere"
  ADD COLUMN IF NOT EXISTS "entrepriseId" INTEGER;

ALTER TABLE "public"."Transaction"
  ADD COLUMN IF NOT EXISTS "entrepriseId" INTEGER;

ALTER TABLE "public"."TransfertStock"
  ADD COLUMN IF NOT EXISTS "entrepriseId" INTEGER;

ALTER TABLE "public"."SessionInventaire"
  ADD COLUMN IF NOT EXISTS "entrepriseId" INTEGER;
