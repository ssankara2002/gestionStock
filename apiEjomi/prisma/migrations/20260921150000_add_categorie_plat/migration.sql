CREATE TYPE "public"."CategoriePlat" AS ENUM ('LIQUIDE', 'SNACK', 'REPAS');

ALTER TABLE "public"."Plat"
  ADD COLUMN "categorie" "public"."CategoriePlat" NOT NULL DEFAULT 'REPAS';

ALTER TABLE "public"."Plat"
  ALTER COLUMN "categorie" DROP DEFAULT;

CREATE INDEX "Plat_categorie_idx" ON "public"."Plat"("categorie");