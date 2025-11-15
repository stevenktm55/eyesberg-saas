# 🔧 Corriger le Wildcard Domain

## 🐛 Problème

Le domaine `*.eyesberg.app` affiche "Invalid Configuration" dans Vercel.

## ✅ Solutions

### Solution 1 : Vérifier les Enregistrements DNS dans Cloudflare

1. Va sur **Cloudflare Dashboard** → `eyesberg.app` → **DNS** → **Records**
2. Vérifie que tu as bien cet enregistrement :

```
Type: CNAME
Name: *  (astérisque)
Target: cname.vercel-dns.com
Proxy: ✅ (Orange cloud activé)
```

3. Si l'enregistrement n'existe pas ou est incorrect, corrige-le
4. Attends 5-10 minutes pour la propagation DNS

### Solution 2 : Supprimer et Re-ajouter le Wildcard dans Vercel

1. Dans Vercel → **Settings** → **Domains**
2. Clique sur **Edit** à côté de `*.eyesberg.app`
3. Clique sur **Remove** pour supprimer le domaine
4. Attends 1-2 minutes
5. Clique sur **Add Domain**
6. Entre : `*.eyesberg.app`
7. Clique sur **Add**

### Solution 3 : Vérifier que le Domaine Racine est Valid

Le wildcard nécessite que le domaine racine (`eyesberg.app`) soit valide.

1. Vérifie que `eyesberg.app` est bien configuré (il l'est, tu as "Proxy Detected")
2. Le wildcard devrait fonctionner une fois le DNS propagé

## 🔍 Vérification

Après avoir corrigé, attends 5-10 minutes puis :

1. Clique sur **Refresh** à côté de `*.eyesberg.app`
2. Le statut devrait passer à **"Valid Configuration"**

## 📝 Note

Le fait que `eyesberg.app` redirige vers `www.eyesberg.app` (307) est normal si tu as configuré une redirection dans Cloudflare. Pour le SAAS, on a surtout besoin du wildcard `*.eyesberg.app` pour les sous-domaines.

---

**Une fois le wildcard validé, tu pourras tester les sous-domaines !** 🚀

