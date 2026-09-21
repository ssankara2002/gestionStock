CREATE TABLE "public"."Plat" (
    "id" SERIAL NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "prixVenteUnitaire" DOUBLE PRECISION NOT NULL,
    "entrepriseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plat_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Plat_libelle_idx" ON "public"."Plat"("libelle");
CREATE INDEX "Plat_entrepriseId_idx" ON "public"."Plat"("entrepriseId");

ALTER TABLE "public"."Plat"
ADD CONSTRAINT "Plat_entrepriseId_fkey"
FOREIGN KEY ("entrepriseId") REFERENCES "public"."Entreprise"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."LigneCommande" ALTER COLUMN "produitId" DROP NOT NULL;
ALTER TABLE "public"."LigneCommande" ADD COLUMN "platId" INTEGER;
CREATE INDEX "LigneCommande_platId_idx" ON "public"."LigneCommande"("platId");

ALTER TABLE "public"."LigneCommande"
ADD CONSTRAINT "LigneCommande_platId_fkey"
FOREIGN KEY ("platId") REFERENCES "public"."Plat"("id")
ON DELETE SET NULL ON UPDATE CASCADE;