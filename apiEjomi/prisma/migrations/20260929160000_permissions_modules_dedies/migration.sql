-- Permissions dédiées pour les modules qui réutilisaient celles d'autres modules
-- (inventaire ingrédients, préparations, rapport coûts plats, bilan financier, export plats).
-- Crée chaque clé en portée globale et pour chaque entreprise, la rattache aux rôles
-- ADMIN / SUPER_ADMIN, et la donne aussi aux rôles qui avaient l'ancienne permission
-- équivalente pour que personne ne perde un accès.

CREATE TEMP TABLE "_new_permission_keys" ("key" TEXT PRIMARY KEY, "description" TEXT, "ancienne" TEXT);
INSERT INTO "_new_permission_keys" ("key", "description", "ancienne") VALUES
  ('inventaire_ingredient.read',   'Voir l''inventaire des ingrédients',             'matiere_premiere.update'),
  ('inventaire_ingredient.update', 'Ajuster le stock des ingrédients (inventaire)', 'matiere_premiere.update'),
  ('preparation.read',             'Voir les préparations',                         'plat.read'),
  ('preparation.create',           'Enregistrer une préparation',                   'plat.update'),
  ('preparation.update',           'Modifier une préparation',                      'plat.update'),
  ('preparation.delete',           'Supprimer une préparation',                     'plat.update'),
  ('rapport_plat.read',            'Voir le rapport des coûts des plats',           'plat.read'),
  ('bilan.read',                   'Voir le bilan financier',                       'transaction.read'),
  ('plat.export',                  'Exporter les plats',                            NULL);

-- Portée globale
INSERT INTO "public"."Permission" ("key", "description", "entrepriseId")
SELECT k."key", k."description", NULL
FROM "_new_permission_keys" k
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."Permission" p WHERE p."key" = k."key" AND p."entrepriseId" IS NULL
);

-- Portée par entreprise
INSERT INTO "public"."Permission" ("key", "description", "entrepriseId")
SELECT k."key", k."description", e."id"
FROM "_new_permission_keys" k
CROSS JOIN "public"."Entreprise" e
ON CONFLICT ("key", "entrepriseId") DO NOTHING;

-- Rattachement aux rôles ADMIN / SUPER_ADMIN de la même portée
INSERT INTO "public"."_RolesOnPermissions" ("A", "B")
SELECT p."id", r."id"
FROM "public"."Permission" p
JOIN "_new_permission_keys" k ON k."key" = p."key"
JOIN "public"."Role" r
  ON r."name" IN ('ADMIN', 'SUPER_ADMIN')
 AND r."entrepriseId" IS NOT DISTINCT FROM p."entrepriseId"
ON CONFLICT DO NOTHING;

-- Rôles qui avaient l'ancienne permission équivalente
INSERT INTO "public"."_RolesOnPermissions" ("A", "B")
SELECT p_new."id", rp."B"
FROM "_new_permission_keys" k
JOIN "public"."Permission" p_old ON p_old."key" = k."ancienne"
JOIN "public"."_RolesOnPermissions" rp ON rp."A" = p_old."id"
JOIN "public"."Permission" p_new
  ON p_new."key" = k."key"
 AND p_new."entrepriseId" IS NOT DISTINCT FROM p_old."entrepriseId"
ON CONFLICT DO NOTHING;

DROP TABLE "_new_permission_keys";
