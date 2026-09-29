-- Ajoute les statuts de commande EN_COURS (commande non encore encaissée) et PAYE.
ALTER TYPE "public"."CommandeStatut" ADD VALUE IF NOT EXISTS 'EN_COURS' BEFORE 'CONFIRMEE';
ALTER TYPE "public"."CommandeStatut" ADD VALUE IF NOT EXISTS 'PAYE' AFTER 'ANNULEE';
