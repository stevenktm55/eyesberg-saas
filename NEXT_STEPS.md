# 🎉 Prochaines Étapes - SAAS Eyesberg

## ✅ Ce qui est fait

- ✅ Repo GitHub créé : `stevenktm55/eyesberg-saas`
- ✅ Projet Vercel créé et déployé
- ✅ Variables d'environnement configurées
- ✅ Build fonctionne

---

## 🚀 Prochaines Étapes

### 1. Configurer les Domaines dans Vercel

1. Va dans **Vercel** → Projet `eyesberg-saas` → **Settings** → **Domains**
2. **Add Domain** : `eyesberg.app`
3. **Add Domain** : `*.eyesberg.app` (wildcard)
4. Attends que les deux soient **"Valid"** (peut prendre quelques minutes)

### 2. Vérifier le DNS dans Cloudflare

Assure-toi que les enregistrements DNS sont bien configurés :
- `@` → `cname.vercel-dns.com` (Proxy activé)
- `www` → `cname.vercel-dns.com` (Proxy activé)
- `*` → `cname.vercel-dns.com` (Proxy activé)

### 3. Tester l'Inscription

1. Va sur : `https://eyesberg.app/signup`
2. Crée un compte avec un sous-domaine (ex: "test")
3. Vérifie que ça fonctionne

### 4. Tester le Sous-Domaine

1. Va sur : `https://test.eyesberg.app/admin`
2. Vérifie que l'admin se charge

### 5. Créer la Table `accounts` dans Supabase

1. Va dans **Supabase** → **SQL Editor**
2. Exécute le script : `saas/scripts/create-accounts-table.sql` (depuis l'ancien repo)
3. Vérifie que la table `accounts` est créée

### 6. Modifier le Callback OAuth

Quand une boutique Shopify s'installe, il faut :
- Soit créer un compte si l'email n'existe pas
- Soit lier la boutique à un compte existant

---

## 📋 Checklist

- [ ] Domaines configurés dans Vercel (`eyesberg.app`, `*.eyesberg.app`)
- [ ] DNS vérifié dans Cloudflare
- [ ] Table `accounts` créée dans Supabase
- [ ] Test d'inscription réussi
- [ ] Test d'accès via sous-domaine réussi
- [ ] Callback OAuth modifié pour lier les boutiques aux comptes

---

## 🎯 Objectif Final

Avoir un SAAS complètement fonctionnel où :
- Chaque client a son sous-domaine : `clientname.eyesberg.app`
- L'admin est accessible sur : `clientname.eyesberg.app/admin`
- Les boutiques Shopify sont liées aux comptes
- Plug & play : tout fonctionne automatiquement

---

**Excellent travail ! Le SAAS est maintenant déployé et prêt à être configuré.** 🚀


