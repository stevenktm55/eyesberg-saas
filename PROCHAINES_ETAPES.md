# 🚀 Prochaines Étapes - Pendant l'Attente DNS

## ✅ À Faire Maintenant

### 1. Créer la Table `accounts` dans Supabase

1. Va dans **Supabase Dashboard** → Ton projet → **SQL Editor**
2. Copie-colle le contenu de `CREATE_ACCOUNTS_TABLE.sql`
3. Clique sur **Run**
4. ✅ Vérifie que la table `accounts` est créée

### 2. Tester avec le Domaine Racine

Pendant qu'on attend la validation du wildcard, on peut tester avec le domaine racine :

1. Va sur : `https://eyesberg.app`
2. Va sur : `https://eyesberg.app/signup`
3. ✅ Vérifie que la page d'inscription fonctionne

### 3. Créer la Page de Connexion

Il faut créer `/login` pour que les utilisateurs puissent se connecter.

### 4. Modifier le Callback OAuth

Quand une boutique Shopify s'installe, il faut :
- Vérifier si un compte existe avec l'email
- Si oui, lier la boutique au compte
- Si non, créer un compte automatiquement ou demander à l'utilisateur de s'inscrire

---

## 📋 Checklist

- [ ] Table `accounts` créée dans Supabase
- [ ] Test du domaine racine (`eyesberg.app`)
- [ ] Page de connexion créée
- [ ] Callback OAuth modifié
- [ ] Wildcard validé dans Vercel (en attente)

---

**On commence par créer la table `accounts` dans Supabase ?** 🚀

