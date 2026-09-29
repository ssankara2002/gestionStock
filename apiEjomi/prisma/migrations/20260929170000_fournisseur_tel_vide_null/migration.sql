-- Les téléphones / emails vides sont stockés à NULL pour ne pas bloquer
-- la contrainte unique (tel, entrepriseId) entre fournisseurs sans téléphone.
UPDATE "public"."Fournisseur" SET "tel" = NULL WHERE TRIM("tel") = '';
UPDATE "public"."Fournisseur" SET "email" = NULL WHERE TRIM("email") = '';
