# 🔒 Isolation par Sous-domaine

Toutes les données sont maintenant isolées par sous-domaine pour garantir la sécurité multi-tenant.

## 📋 Tables avec isolation

Toutes les tables principales ont un champ `subdomain` :

- ✅ `material_maps` - `subdomain TEXT NOT NULL`
- ✅ `models_3d` - `subdomain TEXT NOT NULL`
- ✅ `size_patterns` - `subdomain TEXT NOT NULL`
- ✅ `designs_2d` - `subdomain TEXT NOT NULL`

## 🔐 Fonction helper

Une fonction helper `getSubdomain()` a été créée dans `/src/lib/get-subdomain.ts` qui :

1. **Essaie d'abord depuis les headers** (ajouté par le middleware) - Plus rapide
2. **Sinon depuis la session** - Via le cookie `eyesberg_session`

```typescript
import { getSubdomain } from '@/lib/get-subdomain';

const subdomain = await getSubdomain(request);
if (!subdomain) {
  return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
}
```

## 🛡️ Protection dans les API routes

Toutes les API routes vérifient maintenant le sous-domaine :

### GET - Filtrage par sous-domaine
```typescript
const { data } = await supabaseAdmin
  .from('models_3d')
  .select('*')
  .eq('subdomain', subdomain) // ✅ Filtre par sous-domaine
  .order('created_at', { ascending: false });
```

### POST - Ajout du sous-domaine
```typescript
const { data } = await supabaseAdmin
  .from('models_3d')
  .insert({
    subdomain, // ✅ Ajout du sous-domaine
    name,
    glb_url: glbUrl,
  });
```

### PUT/DELETE - Vérification du sous-domaine
```typescript
const { data } = await supabaseAdmin
  .from('models_3d')
  .update(updateData)
  .eq('id', id)
  .eq('subdomain', subdomain); // ✅ Vérification que l'entité appartient au sous-domaine
```

## 📊 Indexes

Des indexes ont été créés pour optimiser les requêtes par sous-domaine :

```sql
CREATE INDEX IF NOT EXISTS idx_material_maps_subdomain ON material_maps(subdomain);
CREATE INDEX IF NOT EXISTS idx_models_3d_subdomain ON models_3d(subdomain);
CREATE INDEX IF NOT EXISTS idx_size_patterns_subdomain ON size_patterns(subdomain);
CREATE INDEX IF NOT EXISTS idx_designs_2d_subdomain ON designs_2d(subdomain);
```

## ✅ API Routes protégées

- ✅ `/api/models-3d` - GET, POST, PUT, DELETE
- ✅ `/api/models-3d/parts` - PUT
- ✅ `/api/material-maps` - GET, POST, PUT, DELETE
- ✅ `/api/material-maps/upload` - POST
- ✅ `/api/size-patterns` - GET, POST, DELETE
- ✅ `/api/size-patterns/upload-file` - POST
- ✅ `/api/designs-2d` - GET, POST, DELETE

## 🔒 Sécurité

- **Aucun utilisateur ne peut accéder aux données d'un autre sous-domaine**
- **Toutes les requêtes sont filtrées automatiquement**
- **Les vérifications sont faites à la fois lors de la récupération et lors des modifications**

## 📝 Notes

- Le sous-domaine est extrait automatiquement par le middleware depuis l'URL
- Si le sous-domaine n'est pas trouvé, l'API retourne une erreur 400
- Les Material Maps assignés aux parties de modèles sont automatiquement filtrés via les jointures

