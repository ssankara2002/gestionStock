-- Supprime le rôle CAISSIERE (doublon de CAISSIER).
-- Les utilisateurs qui l'avaient sont basculés sur le rôle CAISSIER de la même portée.

-- 1. Là où aucun CAISSIER n'existe pour la même portée, on renomme simplement CAISSIERE en CAISSIER.
UPDATE "Role" r
SET "name" = 'CAISSIER', "description" = COALESCE(NULLIF(r."description", 'CAISSIERE'), 'CAISSIER')
WHERE r."name" = 'CAISSIERE'
  AND NOT EXISTS (
    SELECT 1 FROM "Role" c
    WHERE c."name" = 'CAISSIER' AND c."entrepriseId" IS NOT DISTINCT FROM r."entrepriseId"
  );

-- 2. Réaffecte les utilisateurs restants vers le CAISSIER de la même portée.
UPDATE "User" u
SET "roleId" = c."id"
FROM "Role" r
JOIN "Role" c ON c."name" = 'CAISSIER' AND c."entrepriseId" IS NOT DISTINCT FROM r."entrepriseId"
WHERE u."roleId" = r."id" AND r."name" = 'CAISSIERE';

UPDATE "UserEntreprise" ue
SET "roleId" = c."id"
FROM "Role" r
JOIN "Role" c ON c."name" = 'CAISSIER' AND c."entrepriseId" IS NOT DISTINCT FROM r."entrepriseId"
WHERE ue."roleId" = r."id" AND r."name" = 'CAISSIERE';

-- 3. Supprime le rôle (les liens _RolesOnPermissions partent en cascade).
DELETE FROM "Role" WHERE "name" = 'CAISSIERE';
