# 🚀 Setup Supabase pour Eyesberg SaaS

Ce guide vous explique comment créer un nouveau projet Supabase dédié pour eyesberg-saas.

## 📋 Étape 1 : Créer un nouveau projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau compte ou connectez-vous
3. Cliquez sur **"New Project"**
4. Remplissez les informations :
   - **Name**: `eyesberg-saas`
   - **Database Password**: (choisissez un mot de passe fort)
   - **Region**: Choisissez la région la plus proche
   - **Pricing Plan**: Free tier est suffisant pour commencer

## 📋 Étape 2 : Exécuter le schéma SQL

1. Dans le dashboard Supabase, allez dans **SQL Editor**
2. Cliquez sur **"New Query"**
3. Copiez-collez le contenu du fichier `supabase-schema-eyesberg.sql`
4. Cliquez sur **"Run"** pour exécuter le script

### 📊 Tables créées

Le schéma inclut **toutes les tables nécessaires** pour le SaaS :

**Authentification & Multi-tenancy :**
- `accounts` - Comptes avec sous-domaines personnalisés
- `sessions` - Sessions utilisateur (cookies HTTP-only)
- `shops` - Boutiques Shopify connectées

**Shopify Integration :**
- `shopify_products` - Produits Shopify synchronisés
- `shopify_product_configs` - Configurations des produits

**3D & Materials :**
- `material_maps` - Material Maps
- `material_map_files` - Fichiers de textures
- `models_3d` - Modèles 3D
- `model_parts` - Parties des modèles 3D

**Patterns & Designs :**
- `size_patterns` - Patrons multi-tailles
- `size_pattern_files` - Fichiers SVG par taille
- `designs_2d` - Designs 2D

**Configurations :**
- `configurations` - Configurations clients sauvegardées

**Toutes les tables sont isolées par sous-domaine** pour la sécurité multi-tenant.

## 📋 Étape 3 : Créer les Storage Buckets

1. Allez dans **Storage** (menu de gauche)
2. Créez les buckets suivants (cliquez sur **"New bucket"** pour chacun) :

### Bucket: `models-3d`
- **Name**: `models-3d`
- **Public**: ✅ Oui
- **File size limit**: 50 MB
- **Allowed MIME types**: `model/gltf-binary, model/gltf+json`

### Bucket: `material-maps`
- **Name**: `material-maps`
- **Public**: ✅ Oui
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/png, image/jpeg`

### Bucket: `size-patterns`
- **Name**: `size-patterns`
- **Public**: ✅ Oui
- **File size limit**: 5 MB
- **Allowed MIME types**: `image/svg+xml`

### Bucket: `designs-2d`
- **Name**: `designs-2d`
- **Public**: ✅ Oui
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/svg+xml, image/png, image/jpeg`

### Bucket: `thumbnails`
- **Name**: `thumbnails`
- **Public**: ✅ Oui
- **File size limit**: 2 MB
- **Allowed MIME types**: `image/png, image/jpeg, image/webp`

## 📋 Étape 4 : Configurer les Storage Policies

Pour chaque bucket, allez dans **Policies** et ajoutez ces règles :

### Policy 1 : Public Read Access
```sql
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'NOM_DU_BUCKET' );
```

### Policy 2 : Authenticated Upload
```sql
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'NOM_DU_BUCKET' );
```

### Policy 3 : Authenticated Update
```sql
CREATE POLICY "Authenticated users can update"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'NOM_DU_BUCKET' );
```

### Policy 4 : Authenticated Delete
```sql
CREATE POLICY "Authenticated users can delete"
ON storage.objects FOR DELETE
USING ( bucket_id = 'NOM_DU_BUCKET' );
```

> ⚠️ Remplacez `NOM_DU_BUCKET` par le nom réel du bucket (ex: `models-3d`)

## 📋 Étape 5 : Récupérer les clés API

1. Allez dans **Settings** > **API** (menu de gauche)
2. Copiez les informations suivantes :
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** (API Key): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role** (Secret Key): `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` ⚠️ **NE JAMAIS PARTAGER**

## 📋 Étape 6 : Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet `eyesberg-saas` :

```env
# Supabase Configuration (NOUVEAU PROJET)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📋 Étape 7 : Configurer Vercel (si déployé)

Si vous avez déjà déployé sur Vercel, ajoutez ces variables d'environnement :

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet `eyesberg-saas`
3. Allez dans **Settings** > **Environment Variables**
4. Ajoutez les variables :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Redéployez le projet

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. Vérifiez que les tables sont créées dans **Table Editor**
2. Vérifiez que les buckets sont créés dans **Storage**
3. Testez une connexion depuis votre application

## 🎉 C'est prêt !

Votre nouveau projet Supabase est configuré et prêt à être utilisé par eyesberg-saas.

