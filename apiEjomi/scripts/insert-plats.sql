INSERT INTO "Plat" ("libelle", "categorie", "prixVenteUnitaire", "entrepriseId")
SELECT source."libelle", source."categorie"::"CategoriePlat", source."prix", 2
FROM (VALUES
  ('Nescafé 100', 'LIQUIDE', 100.0), ('Café stick', 'LIQUIDE', 500.0), ('Chicorée', 'LIQUIDE', 500.0),
  ('Café Nespresso', 'LIQUIDE', 600.0), ('Café moulu', 'LIQUIDE', 500.0), ('Thé Lipton nature', 'LIQUIDE', 100.0),
  ('Thé Lipton citron', 'LIQUIDE', 500.0), ('Thé Lipton menthe', 'LIQUIDE', 500.0), ('Thé Signature', 'LIQUIDE', 1000.0),
  ('Thé vert de Chine', 'LIQUIDE', 300.0), ('Thé vert de Chine menthe gingembre', 'LIQUIDE', 500.0),
  ('Kinkelibat', 'LIQUIDE', 500.0), ('Citronnelle', 'LIQUIDE', 500.0), ('Infusion Signature', 'LIQUIDE', 1000.0),
  ('Infusion classique', 'LIQUIDE', 500.0), ('Jus nature orange', 'LIQUIDE', 1500.0),
  ('Jus nature pamplemousse', 'LIQUIDE', 1500.0), ('Jus nature citron', 'LIQUIDE', 1500.0),
  ('Sandwich viande hachée 1/2 pain', 'SNACK', 500.0), ('Sandwich poisson 1/2 pain', 'SNACK', 500.0),
  ('Sandwich saucisson 1/2 pain', 'SNACK', 700.0), ('Sandwich pâté 1/2 pain', 'SNACK', 700.0),
  ('Sandwich jambon', 'SNACK', 1500.0), ('Sandwich jambon fromage', 'SNACK', 2000.0),
  ('Shawarma poulet', 'SNACK', 2500.0), ('Shawarma viande', 'SNACK', 2000.0), ('Pastels légumes', 'SNACK', 1000.0),
  ('Pastels viandes', 'SNACK', 1000.0), ('Pastels poissons', 'SNACK', 1000.0), ('Omelette 1/4', 'SNACK', 500.0),
  ('Omelette 1/2', 'SNACK', 700.0), ('Omelette fromage', 'SNACK', 1500.0), ('Omelette jambon', 'SNACK', 1500.0),
  ('Omelette jambon fromage', 'SNACK', 0.0), ('Assiette de merguez', 'SNACK', 1500.0),
  ('Assiette de saucisse', 'SNACK', 1500.0), ('Assiette de chipolatas', 'SNACK', 1500.0),
  ('Assiette de brochette filet de bœuf', 'SNACK', 2500.0), ('Assiette de brochette tranche bœuf', 'SNACK', 1500.0),
  ('Pain anglais', 'SNACK', 1500.0), ('Viennoiseries', 'SNACK', 1000.0), ('Assiette de mignardises', 'SNACK', 2000.0),
  ('Chaussons aux pommes', 'SNACK', 1500.0), ('Friands au thon', 'SNACK', 1300.0),
  ('Friands à la viande hachée', 'SNACK', 1300.0), ('Assiette de crudités', 'SNACK', 1500.0),
  ('Assiette de frites / sauté / vapeur de pommes de terre', 'SNACK', 1000.0),
  ('Assiette de frites / sauté / vapeur d''igname', 'SNACK', 1000.0),
  ('Assiette de frites / sauté / vapeur de patates douces', 'SNACK', 1000.0),
  ('Assiette de frites / sauté / vapeur de banane plantain', 'SNACK', 1000.0),
  ('Riz gras 1/2', 'REPAS', 500.0), ('Riz gras', 'REPAS', 1000.0), ('Riz sauce', 'REPAS', 1000.0),
  ('Soupe de patte de mouton', 'REPAS', 1000.0), ('Soupe de patte de bœuf', 'REPAS', 1000.0),
  ('Soupe de tête de mouton', 'REPAS', 1000.0), ('Soupe de tête de bœuf', 'REPAS', 1000.0),
  ('Soupe de tripes de bœuf', 'REPAS', 1000.0), ('Soupe de tripes de chèvre', 'REPAS', 1000.0),
  ('Soupe de tripes de mouton', 'REPAS', 1000.0), ('Soupe de queue de bœuf', 'REPAS', 1000.0),
  ('Soupe de queue de mouton', 'REPAS', 1000.0), ('Soupe de queue de chèvre', 'REPAS', 1000.0),
  ('Tranche de mouton', 'REPAS', 1000.0), ('Tranche de porc', 'REPAS', 1000.0),
  ('Soupe de poulet', 'REPAS', 1500.0), ('Soupe de poisson', 'REPAS', 1500.0),
  ('Soupe de vermicelles', 'REPAS', 1500.0), ('Soupe de légumes', 'REPAS', 1500.0)
) AS source("libelle", "categorie", "prix")
WHERE NOT EXISTS (
  SELECT 1 FROM "Plat" existing
  WHERE existing."libelle" = source."libelle" AND existing."entrepriseId" = 2
);