-- Ajoute les permissions des avoirs, utilisées par les routes /avoirs mais absentes en base.
-- Crée chaque clé pour la portée globale et pour chaque entreprise, puis la rattache
-- aux rôles ADMIN de la même portée. Ne retire aucune permission existante.

CREATE TEMP TABLE "_new_permission_keys" ("key" TEXT PRIMARY KEY);
INSERT INTO "_new_permission_keys" ("key") VALUES
  ('avoir.create'),
  ('avoir.delete'),
  ('avoir.export'),
  ('avoir.read');

-- Portée globale
INSERT INTO "public"."Permission" ("key", "description", "entrepriseId")
SELECT k."key", k."key", NULL
FROM "_new_permission_keys" k
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."Permission" p WHERE p."key" = k."key" AND p."entrepriseId" IS NULL
);

-- Portée par entreprise
INSERT INTO "public"."Permission" ("key", "description", "entrepriseId")
SELECT k."key", k."key", e."id"
FROM "_new_permission_keys" k
CROSS JOIN "public"."Entreprise" e
ON CONFLICT ("key", "entrepriseId") DO NOTHING;

-- Rattachement aux rôles ADMIN de la même portée
INSERT INTO "public"."_RolesOnPermissions" ("A", "B")
SELECT p."id", r."id"
FROM "public"."Permission" p
JOIN "_new_permission_keys" k ON k."key" = p."key"
JOIN "public"."Role" r
  ON r."name" = 'ADMIN'
 AND r."entrepriseId" IS NOT DISTINCT FROM p."entrepriseId"
ON CONFLICT DO NOTHING;

DROP TABLE "_new_permission_keys";
