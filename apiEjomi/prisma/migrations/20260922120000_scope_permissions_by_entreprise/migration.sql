ALTER TABLE "public"."Permission"
  ADD COLUMN "entrepriseId" INTEGER;

DROP INDEX IF EXISTS "Permission_key_key";

CREATE UNIQUE INDEX "Permission_key_entrepriseId_key"
  ON "public"."Permission"("key", "entrepriseId");

ALTER TABLE "public"."Permission"
  ADD CONSTRAINT "Permission_entrepriseId_fkey"
  FOREIGN KEY ("entrepriseId") REFERENCES "public"."Entreprise"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;