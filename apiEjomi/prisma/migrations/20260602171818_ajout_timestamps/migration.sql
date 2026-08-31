-- Ajouter createdAt avec valeur par défaut et updatedAt nullable d'abord

ALTER TABLE "public"."Absence"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "public"."Absence" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "public"."Absence" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "public"."Approvisionnement"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "public"."Approvisionnement" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "public"."Approvisionnement" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "public"."Commande"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "public"."Commande" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "public"."Commande" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "public"."Conge"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "public"."Conge" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "public"."Conge" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "public"."Fournisseur"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "public"."Fournisseur" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "public"."Fournisseur" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "public"."Produit"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "public"."Produit" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "public"."Produit" ALTER COLUMN "updatedAt" SET NOT NULL;

ALTER TABLE "public"."User"
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "public"."User" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "public"."User" ALTER COLUMN "updatedAt" SET NOT NULL;

-- StockBoutique et StockMagasin avaient déjà updatedAt avec @updatedAt, retirer le DEFAULT SQL
ALTER TABLE "public"."StockBoutique" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "public"."StockMagasin" ALTER COLUMN "updatedAt" DROP DEFAULT;
