# 🎨 Guide : Ajouter la Clé API Remove.bg

Ce guide t'aide à obtenir et configurer la clé API remove.bg pour activer la fonctionnalité de suppression automatique du fond des logos importés.

---

## 📋 Étape 1 : Obtenir une Clé API Remove.bg

### 1.1 Créer un Compte

1. Va sur **https://www.remove.bg/**
2. Clique sur **Sign Up** (en haut à droite)
3. Crée un compte (gratuit avec 50 appels API/mois)

### 1.2 Générer une Clé API

1. Une fois connecté, clique sur tes **initiales** ou **icône de profil** (en haut à droite)
2. Sélectionne **"My Account"** dans le menu
3. Va dans l'onglet **"API Keys"**
4. Clique sur **"New API Key"**
5. Donne un nom à ta clé (ex: "StretchMX Configurator")
6. **Copie la clé API** qui s'affiche (elle commence généralement par `xxx-` ou `rmbg-`)

⚠️ **Important** : Copie bien la clé, tu ne pourras pas la revoir après !

---

## 🚀 Étape 2 : Ajouter la Clé dans Vercel (Production)

### 2.1 Accéder aux Variables d'Environnement

1. Va sur **https://vercel.com**
2. Connecte-toi à ton compte
3. Sélectionne ton projet **`eyesberg-saas`** (ou le nom de ton projet)
4. Va dans **Settings** (onglet en haut)
5. Clique sur **Environment Variables** (dans le menu de gauche)

### 2.2 Ajouter la Variable

1. Clique sur **"Add New"** (bouton en haut à droite)
2. Remplis les champs :
   - **Name** : `REMOVE_BG_API_KEY`
   - **Value** : Colle ta clé API copiée à l'étape 1.2
   - **Environments** : Coche les 3 cases
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. Clique sur **Save**

---

## 💻 Étape 3 : Ajouter la Clé en Local (Optionnel)

Si tu veux tester en local, ajoute la clé dans ton fichier `.env.local` :

### 3.1 Créer/Modifier `.env.local`

À la **racine du projet** (`/Users/stevenmaginot/eyesberg-saas/`), crée ou modifie le fichier `.env.local` :

```env
# Remove.bg API Key
REMOVE_BG_API_KEY=ta_cle_api_ici
```

⚠️ **Important** : Le fichier `.env.local` est ignoré par git (déjà dans `.gitignore`), donc ta clé ne sera pas commitée.

### 3.2 Redémarrer le Serveur

Après avoir ajouté la variable, redémarre ton serveur de développement :

```bash
# Arrête le serveur (Ctrl+C)
# Puis relance :
pnpm dev
```

---

## 🔄 Étape 4 : Redéployer sur Vercel

Pour que les changements prennent effet en production :

### Option 1 : Redéployer Manuellement

1. Va dans **Deployments** (onglet en haut dans Vercel)
2. Clique sur les **3 points** (⋯) du dernier déploiement
3. Sélectionne **"Redeploy"**
4. Clique sur **"Redeploy"** dans la popup

### Option 2 : Faire un Push Git

Si tu préfères, fais simplement un commit et push (même vide) :

```bash
git commit --allow-empty -m "Trigger redeploy for REMOVE_BG_API_KEY"
git push origin main
```

Vercel redéploiera automatiquement.

---

## ✅ Vérification

### Tester la Fonctionnalité

1. Va sur ton application déployée
2. Connecte-toi en tant qu'admin
3. Va dans un produit avec le configurateur
4. Dans le module **Logos**, clique sur **"Importer un logo"**
5. Sélectionne une image (JPG, PNG, etc.)
6. Si tu as coché **"Background Remover"** dans les settings du module :
   - Clique sur **"Importer"**
   - Tu devrais voir un modal avec deux aperçus :
     - **Original** (à gauche)
     - **Sans fond** (à droite) - avec le fond supprimé automatiquement
7. Clique sur **"Oui"** ou **"Non"** selon ton choix

### Si ça ne Fonctionne Pas

1. **Vérifie les logs Vercel** :
   - Va dans **Deployments** → Clique sur ton dernier déploiement
   - Regarde les **Function Logs** pour voir s'il y a des erreurs

2. **Vérifie la clé API** :
   - Assure-toi que la clé est bien dans les variables d'environnement Vercel
   - Vérifie qu'il n'y a pas d'espaces avant/après la clé

3. **Limite gratuite atteinte ?** :
   - Avec un compte gratuit, tu as **50 appels/mois**
   - Si tu as atteint la limite, l'API retournera une erreur
   - Tu peux checker ton quota sur remove.bg → My Account

---

## 💡 Astuces

### Gérer les Limites

- **Compte gratuit** : 50 appels/mois
- **Si tu dépasses** : L'API retournera une erreur, mais le système utilisera l'image originale en fallback
- **Pour plus d'appels** : Upgrade sur remove.bg vers un plan payant

### Tester en Local

Pour tester sans utiliser ta clé API (économie de quota) :

1. Ne configure pas `REMOVE_BG_API_KEY` en local
2. L'API utilisera l'image originale (pas de suppression de fond)
3. Tu peux quand même tester le flow complet

---

## 📚 Ressources

- **Documentation Remove.bg API** : https://www.remove.bg/api
- **Dashboard Remove.bg** : https://www.remove.bg/my-account

---

✅ **C'est tout !** Ta fonctionnalité de background remover est maintenant configurée ! 🎉
