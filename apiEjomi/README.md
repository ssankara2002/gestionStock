# API Maquis

## Démarrage avec Docker

Depuis la racine du projet :

```bash
docker compose -f apiEjomi/docker-compose.yml up -d
```

Vérifier l’état des services :

```bash
docker compose -f apiEjomi/docker-compose.yml ps
```

Accès locaux :

- Frontend : http://localhost:3002
- API : http://localhost:3001
- Documentation Swagger : http://localhost:3001/api-docs

Le démarrage Docker exécute automatiquement le seed de production. Il insère uniquement les permissions, les rôles et l’administrateur par défaut.

## Administrateur par défaut

```text
Email : admin@maquis.com
Mot de passe : admin123
```

Pour personnaliser ce compte, définir ces variables dans l’environnement Docker :

```env
ADMIN_EMAIL=admin@maquis.com
ADMIN_PASSWORD=mot-de-passe-fort
ADMIN_NOM=Admin
ADMIN_PRENOM=Maquis
ADMIN_ADRESSE=Adresse
```

## Seeds

Exécuter manuellement le seed de production :

```bash
docker compose -f apiEjomi/docker-compose.yml exec api npm run seed:production
```

Le seed de production est idempotent et ne crée pas de données métier.

Pour charger les données de démonstration en développement uniquement :

```bash
docker compose -f apiEjomi/docker-compose.yml exec api npm run seed
```

## Arrêt

```bash
docker compose -f apiEjomi/docker-compose.yml down
```

Pour supprimer également le volume PostgreSQL :

```bash
docker compose -f apiEjomi/docker-compose.yml down -v
```
```bash
docker compose \
  --env-file apiEjomi/dotenv \
  -f apiEjomi/docker-compose.yml \
  up -d --build
  ```
