INSERT INTO "public"."StockMagasin" ("produitId", "quantite", "seuilAlerte", "updatedAt")
SELECT p."id", 0, 10, CURRENT_TIMESTAMP
FROM "public"."Produit" p
LEFT JOIN "public"."StockMagasin" s ON s."produitId" = p."id"
WHERE s."id" IS NULL;

INSERT INTO "public"."StockBoutique" ("produitId", "quantite", "seuilAlerte", "updatedAt")
SELECT p."id", 0, 5, CURRENT_TIMESTAMP
FROM "public"."Produit" p
LEFT JOIN "public"."StockBoutique" s ON s."produitId" = p."id"
WHERE s."id" IS NULL;