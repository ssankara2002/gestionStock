

# Debug - Problème de connexion

## ❌ Erreur initiale
```
TypeError: Cannot read properties of undefined (reading 'role')
at login (auth-provider.tsx:118:37)
```

## 🔍 Corrections apportées

### 1. Types TypeScript corrigés
- ✅ Ajout de `role` et `permission` dans `types/index.ts`
- ✅ Changement de `Permission.id` : `string` → `number`
- ✅ Nettoyage des imports inexistants

### 2. Auth Provider renforcé
- ✅ Ajout de logs de debug (lignes 103-104, 117-118)
- ✅ Validation de `token` avant utilisation
- ✅ Validation de `loggedInUser` avant utilisation
- ✅ Accès sécurisé avec `?.` : `loggedInUser?.role?.name`

### 3. Backend vérifié
- ✅ L'API retourne bien `{user, token}` avec `role` inclus
- ✅ Tous les utilisateurs ont des rôles assignés en base
- ✅ 215 permissions assignées au rôle ADMIN

## 🧪 Pour tester

1. Ouvrir la console du navigateur (F12)
2. Se connecter avec un compte (ex: admin@ejomi.com)
3. Observer les logs :
   - "Response complète:"
   - "Response.data:"
   - "User reçu:"
   - "Role de l'user:"

## ✅ Structure attendue de la réponse API

```json
{
  "user": {
    "id": 1,
    "nom": "Admin",
    "prenom": "System",
    "email": "admin@ejomi.com",
    "roleId": 1,
    "role": {
      "id": 1,
      "name": "ADMIN",
      "description": "Administrateur avec tous les droits"
    },
    "employe": null
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## 📝 Utilisateurs de test disponibles

| Email | Rôle |
|-------|------|
| admin@ejomi.com | ADMIN |
| sarata@gmail.com | ADMIN |
| farida@gmail.com | GERANT |
| rafi@gmail.com | VENDEUR |
| rachid@gmail.com | MAGASINIER |
| soka@gmail.com | SECRETAIRE |

## 🔄 Prochaines étapes

1. Tester la connexion et vérifier les logs
2. Si l'erreur persiste, partager les logs de la console
3. Une fois la connexion réussie, retirer les `console.log` de debug
