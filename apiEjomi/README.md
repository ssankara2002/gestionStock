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

## Accès local avec un nom de domaine

La stack locale inclut Nginx pour servir l’application sur le port HTTP standard :

```text
http://au-bon-moment.com
```

Ajouter cette ligne au fichier `C:\Windows\System32\drivers\etc\hosts` avec les droits administrateur :

```text
127.0.0.1 au-bon-moment.com
```

Puis démarrer la stack :

```bash
docker compose --env-file apiEjomi/dotenv -f apiEjomi/docker-compose.yml up -d --build
```

L’API reste accessible via `http://au-bon-moment.com/api` et Swagger via `http://au-bon-moment.com/api-docs`.

## Super administrateur par défaut

```text
Email : admin@maquis.com
Mot de passe : admin123
```

Ce compte possède le rôle global `SUPER_ADMIN` et peut créer de nouvelles entreprises depuis `/super-admin/entreprises/nouveau`.

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
docker compose --env-file apiEjomi/dotenv -f apiEjomi/docker-compose.yml up -d --build

  ```

Le service PostgreSQL utilise le volume nommé `postgres_data`. La reconstruction
avec `up -d --build` conserve donc les données. Ne lancez `down -v` que si vous
voulez supprimer explicitement la base et ses volumes.
 docker exec -it maquis-db psql -U maquis_user -d gestion_maquis
psql 

cd apiEjomi
docker compose down
docker compose up --build -d
docker compose ps
curl -i http://localhost/api/health


docker compose up -d --build api frontend
docker restart maquis-nginx