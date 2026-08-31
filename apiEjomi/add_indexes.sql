-- Index pour améliorer les performances des requêtes du dashboard

-- Index pour les commandes (tri par date, filtres)
CREATE INDEX IF NOT EXISTS idx_commande_date ON "Commande"("dateCommande" DESC);
CREATE INDEX IF NOT EXISTS idx_commande_statut ON "Commande"("statut");
CREATE INDEX IF NOT EXISTS idx_commande_client ON "Commande"("clientId");
CREATE INDEX IF NOT EXISTS idx_commande_vendeur ON "Commande"("vendeurId");

-- Index pour les paiements (tri par date, statut)
CREATE INDEX IF NOT EXISTS idx_paiement_date ON "Paiement"("datePaiement" DESC);
CREATE INDEX IF NOT EXISTS idx_paiement_statut ON "Paiement"("statut");
CREATE INDEX IF NOT EXISTS idx_paiement_commande ON "Paiement"("commandeId");

-- Index pour les produits (stock, recherche)
CREATE INDEX IF NOT EXISTS idx_produit_stock ON "Produit"("quantiteStock");
CREATE INDEX IF NOT EXISTS idx_produit_libelle ON "Produit"("libelle");

-- Index pour les lignes de commande (agrégations)
CREATE INDEX IF NOT EXISTS idx_ligne_commande_produit ON "LigneCommande"("produitId");
CREATE INDEX IF NOT EXISTS idx_ligne_commande_commande ON "LigneCommande"("commandeId");

-- Index pour les utilisateurs (recherche par rôle)
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"("roleId");

-- Index pour les employés
CREATE INDEX IF NOT EXISTS idx_employe_user ON "Employe"("userId");

-- Index pour les approvisionnements
CREATE INDEX IF NOT EXISTS idx_appro_date ON "Approvisionnement"("dateApprovisionnement" DESC);
CREATE INDEX IF NOT EXISTS idx_appro_fournisseur ON "Approvisionnement"("fournisseurId");

-- Index pour les salaires
CREATE INDEX IF NOT EXISTS idx_salaire_date ON "SalairePaiement"("datePaiement" DESC);
CREATE INDEX IF NOT EXISTS idx_salaire_employe ON "SalairePaiement"("employeId");

-- Index pour les transactions
CREATE INDEX IF NOT EXISTS idx_transaction_date ON "Transaction"("date" DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_type ON "Transaction"("type");

-- Index pour les absences
CREATE INDEX IF NOT EXISTS idx_absence_date ON "Absence"("date" DESC);
CREATE INDEX IF NOT EXISTS idx_absence_employe ON "Absence"("employeId");

-- Index pour les productions
CREATE INDEX IF NOT EXISTS idx_production_date ON "Production"("dateProduction" DESC);
CREATE INDEX IF NOT EXISTS idx_production_produit ON "Production"("produitId");
