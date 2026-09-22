#!/bin/sh

# Script d'entrée simplifié

echo "⏳ Attente de PostgreSQL (15 secondes)..."
sleep 15

echo "🔄 Application des migrations avec la base de données..."
for i in 1 2 3 4 5; do
  echo "Tentative $i/5..."
  if npx prisma migrate deploy; then
    echo "✅ Migrations appliquées!"
    break
  fi
  if [ $i -lt 5 ]; then
    echo "⏳ Nouvelle tentative dans 5 secondes..."
    sleep 5
  else
    echo "⚠️ Migrations non appliquées après 5 tentatives, mais on continue le démarrage"
  fi
done

echo "🔧 Génération du client Prisma..."
npx prisma generate

#echo "🌱 Exécution du seed de production..."
#if ! npx tsx prisma/seed-production.ts; then
 # echo "⚠️ Seed de production non bloquant, on continue le démarrage"
#fi

echo "🚀 Démarrage de l'application..."
exec npm start
