-- Rendre prenom et tel optionnels sur Fournisseur
ALTER TABLE "public"."Fournisseur"
  ALTER COLUMN "prenom" DROP NOT NULL,
  ALTER COLUMN "tel" DROP NOT NULL;
