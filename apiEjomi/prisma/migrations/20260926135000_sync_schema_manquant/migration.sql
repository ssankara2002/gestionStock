-- Rattrape les changements du schéma appliqués en base sans migration (db push) :
-- tables UserEntreprise et LotStock, colonnes, index uniques par entreprise, clés étrangères.
-- Idempotente : sans effet sur une base qui contient déjà ces éléments.
-- Datée avant 20260926140000_remove_role_caissiere, qui utilise la table UserEntreprise.

-- Index uniques globaux remplacés par des index par entreprise
DROP INDEX IF EXISTS "public"."Fournisseur_email_key";
DROP INDEX IF EXISTS "public"."Fournisseur_tel_key";
DROP INDEX IF EXISTS "public"."LigneApprovisionnement_numeroSerie_key";
DROP INDEX IF EXISTS "public"."Role_name_key";
DROP INDEX IF EXISTS "public"."User_email_key";
DROP INDEX IF EXISTS "public"."User_tel_key";

-- Colonnes
ALTER TABLE "public"."Entreprise" ALTER COLUMN "updatedAt" DROP DEFAULT;

ALTER TABLE "public"."LigneApprovisionnement"
  DROP COLUMN IF EXISTS "numeroSerie",
  ADD COLUMN IF NOT EXISTS "dateFabrication" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "datePeremption" TIMESTAMP(3);

ALTER TABLE "public"."LigneCommande"
  ADD COLUMN IF NOT EXISTS "coutRevient" DOUBLE PRECISION;

ALTER TABLE "public"."SalairePaiement"
  ADD COLUMN IF NOT EXISTS "avantage" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "indemnite" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "periode" TIMESTAMP(3);

ALTER TABLE "public"."User" ALTER COLUMN "tel" DROP NOT NULL;

-- Tables
CREATE TABLE IF NOT EXISTS "public"."UserEntreprise" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "entrepriseId" INTEGER NOT NULL,
    "roleId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserEntreprise_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "public"."LotStock" (
    "id" SERIAL NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantiteInitiale" INTEGER NOT NULL,
    "quantiteRestante" INTEGER NOT NULL,
    "prixAchat" DOUBLE PRECISION NOT NULL,
    "dateAppro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ligneApprovisionnementId" INTEGER NOT NULL,
    CONSTRAINT "LotStock_pkey" PRIMARY KEY ("id")
);

-- Index
CREATE UNIQUE INDEX IF NOT EXISTS "UserEntreprise_userId_entrepriseId_key" ON "public"."UserEntreprise"("userId", "entrepriseId");
CREATE UNIQUE INDEX IF NOT EXISTS "LotStock_ligneApprovisionnementId_key" ON "public"."LotStock"("ligneApprovisionnementId");
CREATE INDEX IF NOT EXISTS "LotStock_produitId_dateAppro_idx" ON "public"."LotStock"("produitId", "dateAppro");
CREATE UNIQUE INDEX IF NOT EXISTS "Fournisseur_tel_entrepriseId_key" ON "public"."Fournisseur"("tel", "entrepriseId");
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_entrepriseId_key" ON "public"."Role"("name", "entrepriseId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_tel_entrepriseId_key" ON "public"."User"("tel", "entrepriseId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_entrepriseId_key" ON "public"."User"("email", "entrepriseId");

-- Clé étrangère LigneCommande -> Produit : ON DELETE SET NULL (produitId est optionnel)
ALTER TABLE "public"."LigneCommande" DROP CONSTRAINT IF EXISTS "LigneCommande_produitId_fkey";
ALTER TABLE "public"."LigneCommande" ADD CONSTRAINT "LigneCommande_produitId_fkey"
  FOREIGN KEY ("produitId") REFERENCES "public"."Produit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Autres clés étrangères, ajoutées seulement si absentes
DO $$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN SELECT * FROM (VALUES
    ('UserEntreprise', 'UserEntreprise_userId_fkey',       'userId',       'User',                   'RESTRICT'),
    ('UserEntreprise', 'UserEntreprise_entrepriseId_fkey', 'entrepriseId', 'Entreprise',             'RESTRICT'),
    ('UserEntreprise', 'UserEntreprise_roleId_fkey',       'roleId',       'Role',                   'SET NULL'),
    ('Role',              'Role_entrepriseId_fkey',              'entrepriseId', 'Entreprise', 'SET NULL'),
    ('Produit',           'Produit_entrepriseId_fkey',           'entrepriseId', 'Entreprise', 'SET NULL'),
    ('TransfertStock',    'TransfertStock_entrepriseId_fkey',    'entrepriseId', 'Entreprise', 'SET NULL'),
    ('SessionInventaire', 'SessionInventaire_entrepriseId_fkey', 'entrepriseId', 'Entreprise', 'SET NULL'),
    ('Commande',          'Commande_entrepriseId_fkey',          'entrepriseId', 'Entreprise', 'SET NULL'),
    ('Fournisseur',       'Fournisseur_entrepriseId_fkey',       'entrepriseId', 'Entreprise', 'SET NULL'),
    ('Approvisionnement', 'Approvisionnement_entrepriseId_fkey', 'entrepriseId', 'Entreprise', 'SET NULL'),
    ('MatierePremiere',   'MatierePremiere_entrepriseId_fkey',   'entrepriseId', 'Entreprise', 'SET NULL'),
    ('Transaction',       'Transaction_entrepriseId_fkey',       'entrepriseId', 'Entreprise', 'SET NULL'),
    ('Contact',           'Contact_entrepriseId_fkey',           'entrepriseId', 'Entreprise', 'SET NULL'),
    ('LotStock', 'LotStock_produitId_fkey',                'produitId',                'Produit',                'RESTRICT'),
    ('LotStock', 'LotStock_ligneApprovisionnementId_fkey', 'ligneApprovisionnementId', 'LigneApprovisionnement', 'RESTRICT')
  ) AS t("tbl", "name", "col", "ref", "onDelete")
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = fk."name") THEN
      EXECUTE format(
        'ALTER TABLE "public".%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES "public".%I("id") ON DELETE %s ON UPDATE CASCADE',
        fk."tbl", fk."name", fk."col", fk."ref", fk."onDelete"
      );
    END IF;
  END LOOP;
END $$;
