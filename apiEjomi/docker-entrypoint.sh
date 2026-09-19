#!/bin/sh

# Script d'entrée simplifié

echo "⏳ Attente de PostgreSQL (15 secondes)..."
sleep 15

echo "🔄 Synchronisation du schéma avec la base de données..."
for i in 1 2 3 4 5; do
  echo "Tentative $i/5..."
  if npx prisma db push --accept-data-loss --skip-generate; then
    echo "✅ Schéma synchronisé!"
    break
  fi
  if [ $i -lt 5 ]; then
    echo "⏳ Nouvelle tentative dans 5 secondes..."
    sleep 5
  else
    echo "❌ Échec de la synchronisation après 5 tentatives"
    exit 1
  fi
done

echo "🔧 Génération du client Prisma..."
npx prisma generate

echo "🌱 Exécution du seed de production..."
if ! npx tsx prisma/seed-production.ts; then
  echo "❌ Seed de production échoué, arrêt de l'API"
  exit 1
fi

echo "🚀 Démarrage de l'application..."
exec npm start
