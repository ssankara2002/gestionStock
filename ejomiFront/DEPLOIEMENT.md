# Configuration de Déploiement - Frontend Ejomi

## Images en Production

### Configuration effectuée

1. **Toutes les URLs d'images utilisent maintenant** `process.env.NEXT_PUBLIC_API_URL`
2. **Fichier `.env.production` créé** avec l'URL de production
3. **Next.js configuré** pour autoriser les images du domaine de production

### Sur Vercel

Pour que les images s'affichent correctement en production, configurez cette variable d'environnement sur Vercel :

1. Allez dans **Settings → Environment Variables**
2. Ajoutez :
   ```
   NEXT_PUBLIC_API_URL=https://ejomi.edutrackhub.cloud/api
   ```
3. Redéployez l'application

### Architecture

- **Backend API** : https://ejomi.edutrackhub.cloud
- **Frontend Vercel** : https://ejomi-front.vercel.app ou https://goldstore.edutrackhub.cloud
- **Images** : Servies par nginx via https://ejomi.edutrackhub.cloud/uploads/

### Fichiers modifiés

Les fichiers suivants utilisent maintenant la variable d'environnement :
- `app/(admin)/produits/page.tsx`
- `app/(admin)/produits/[id]/page.tsx`
- `app/(admin)/produits/[id]/edit/page.tsx`
- `app/(admin)/gerant/dashboard/page.tsx`
- `app/panier/page.tsx`

### Configuration nginx (Backend)

Le fichier `nginx-ejomi.conf` du backend sert les images statiques via :
```nginx
location /uploads/ {
    alias /var/www/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Test local

Pour tester localement avec le backend de production :
```bash
# Fichier .env.local
NEXT_PUBLIC_API_URL=https://ejomi.edutrackhub.cloud/api
```

Pour tester avec le backend local :
```bash
# Fichier .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```
