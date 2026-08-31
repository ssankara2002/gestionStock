# Exemple pratique : Système Rôles & Permissions

## 1. Structure en base de données

### Rôles
```sql
ADMIN       - Peut tout faire
PROVISEUR   - Gestion administrative
PROFESSEUR  - Gestion pédagogique
ELEVE       - Consultation limitée
PARENT      - Consultation de son enfant
```

### Permissions
```sql
eleve.read    - Lire les élèves
eleve.create  - Créer un élève
eleve.update  - Modifier un élève
eleve.delete  - Supprimer un élève
note.read     - Lire les notes
note.create   - Créer une note
user.create   - Créer des utilisateurs
```

### Attribution des permissions par rôle
```sql
ADMIN: toutes les permissions
PROVISEUR: eleve.*, user.create
PROFESSEUR: eleve.read, note.*
ELEVE: note.read (ses propres notes)
PARENT: eleve.read, note.read (de son enfant)
```

## 2. Utilisation dans les routes

### Route basique (ancien système)
```typescript
// ❌ Trop rigide
router.get('/eleves', authenticateToken, ensureAdmin, getAllEleves);
// Seul l'admin peut voir les élèves
```

### Route avec rôles multiples
```typescript
// ✅ Plus flexible
router.get('/eleves',
  authenticateToken,
  ensureMultipleRoles(['ADMIN', 'PROVISEUR', 'PROFESSEUR']),
  getAllEleves
);
// Admin, proviseur ET professeur peuvent voir les élèves
```

### Route avec permissions granulaires
```typescript
// ✅ Le plus flexible
router.get('/eleves',
  authenticateToken,
  ensurePermission('eleve.read'),
  getAllEleves
);
// Quiconque a la permission 'eleve.read' peut voir les élèves
```

## 3. Avantages du système de permissions

### Flexibilité
- On peut donner `eleve.read` à un nouveau rôle `SECRETAIRE` sans changer le code
- On peut retirer `eleve.delete` au `PROVISEUR` depuis la base de données

### Granularité
```typescript
// Actions différentes = permissions différentes
router.get('/eleves', ensurePermission('eleve.read'));      // Lire
router.post('/eleves', ensurePermission('eleve.create'));   // Créer
router.put('/eleves/:id', ensurePermission('eleve.update')); // Modifier
router.delete('/eleves/:id', ensurePermission('eleve.delete')); // Supprimer
```

### Évolutivité
```typescript
// Facile d'ajouter de nouvelles permissions
router.get('/eleves/export', ensurePermission('eleve.export'));
router.post('/eleves/bulk', ensurePermission('eleve.bulk_create'));
```

## 4. Cas d'usage concrets

### Un professeur veut :
- ✅ Voir les élèves (permission: `eleve.read`)
- ✅ Créer des notes (permission: `note.create`)
- ❌ Supprimer des élèves (pas de permission: `eleve.delete`)

### Un parent veut :
- ✅ Voir les infos de son enfant (permission: `eleve.read` + logique métier)
- ❌ Voir les autres élèves (logique métier dans le controller)
- ✅ Voir les notes de son enfant (permission: `note.read` + logique métier)

### Un proviseur veut :
- ✅ Tout faire sur les élèves (permissions: `eleve.*`)
- ✅ Créer des comptes (permission: `user.create`)
- ❌ Modifier les notes (pas de permission: `note.update`)