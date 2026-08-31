# ⚠️ REDÉMARRAGE REQUIS

## Problème résolu ✅

Le problème était une **mauvaise configuration de l'URL de l'API** :

### ❌ Avant
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```
Le port 3001 pointait vers le front-end Next.js lui-même !

### ✅ Après
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```
Le port 3000 pointe vers l'API backend Express avec le préfixe `/api`.

## 🔄 Action requise

**Redémarrez le serveur Next.js** pour que la nouvelle configuration soit prise en compte :

```bash
# Dans le terminal du front-end (ejomiFront)
# Appuyez sur Ctrl+C pour arrêter le serveur
# Puis relancez :
npm run dev
```

## ✅ Vérification

L'API backend répond correctement :
```json
{
    "user": {
        "id": 1,
        "email": "admin@ejomi.com",
        "role": {
            "id": 1,
            "name": "ADMIN",
            "description": "Administrateur système avec tous les droits"
        },
        "employe": null
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

## 📝 Comptes de test

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@ejomi.com | admin123 | ADMIN |
| sarata@gmail.com | ? | ADMIN |
| farida@gmail.com | ? | GERANT |

Une fois redémarré, la connexion devrait fonctionner ! 🎉
