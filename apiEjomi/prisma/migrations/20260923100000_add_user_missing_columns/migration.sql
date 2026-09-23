-- Ajouter les colonnes manquantes sur la table User

ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "image" TEXT,
  ADD COLUMN IF NOT EXISTS "resetPasswordToken" TEXT,
  ADD COLUMN IF NOT EXISTS "resetPasswordExpires" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "entrepriseId" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'User_entrepriseId_fkey'
      AND table_name = 'User'
      AND table_schema = 'public'
  ) THEN
    ALTER TABLE "public"."User"
      ADD CONSTRAINT "User_entrepriseId_fkey"
      FOREIGN KEY ("entrepriseId") REFERENCES "public"."Entreprise"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
