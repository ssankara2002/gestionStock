-- Bon d'avoir numéroté pour les clients de passage : personne qui détient le bon
-- et montant déjà utilisé (un bon peut être utilisé en plusieurs fois).
ALTER TABLE "public"."Avoir" ADD COLUMN IF NOT EXISTS "porteurNom" TEXT;
ALTER TABLE "public"."Avoir" ADD COLUMN IF NOT EXISTS "porteurTel" TEXT;
ALTER TABLE "public"."Avoir" ADD COLUMN IF NOT EXISTS "montantUtilise" DOUBLE PRECISION NOT NULL DEFAULT 0;
