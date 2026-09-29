-- Ajoute les modes de paiement Wave et Telecel Money.
ALTER TYPE "public"."ModePaiement" ADD VALUE IF NOT EXISTS 'WAVE' AFTER 'MOOV_MONEY';
ALTER TYPE "public"."ModePaiement" ADD VALUE IF NOT EXISTS 'TELECEL_MONEY' AFTER 'WAVE';
