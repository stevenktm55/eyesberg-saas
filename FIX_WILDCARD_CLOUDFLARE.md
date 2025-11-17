# 🔧 Configurer le Wildcard avec Cloudflare

## 🐛 Problème

Vercel demande de changer les nameservers pour utiliser Vercel DNS, mais on veut garder Cloudflare pour le proxy/CDN.

## ✅ Solution : Utiliser CNAME avec Cloudflare

Vercel peut fonctionner avec Cloudflare, mais il faut configurer différemment.

### Option 1 : Désactiver le Proxy Cloudflare pour le Wildcard (Temporaire)

1. Dans **Cloudflare** → **DNS** → **Records**
2. Trouve l'enregistrement `*` (wildcard)
3. Clique sur **Edit**
4. **Désactive le Proxy** (passe de orange cloud à gris = DNS only)
5. **Save**
6. Attends 5-10 minutes
7. Dans **Vercel**, clique sur **Refresh** pour `*.eyesberg.app`
8. Vercel devrait maintenant valider le wildcard

⚠️ **Note** : Tu perds le proxy Cloudflare pour les sous-domaines, mais ça permet de valider dans Vercel.

### Option 2 : Utiliser un Enregistrement A au lieu de CNAME

Parfois Vercel préfère un enregistrement A. Essaie :

1. Dans **Cloudflare** → **DNS** → **Records**
2. Supprime l'enregistrement CNAME `*`
3. Va dans **Vercel** → **Settings** → **Domains** → `eyesberg.app`
4. Regarde l'IP que Vercel donne (ou utilise une IP Vercel générique)
5. Ajoute un enregistrement **A** dans Cloudflare :
   ```
   Type: A
   Name: *
   IPv4: [IP Vercel ou utilise 76.76.21.21]
   Proxy: Désactivé (gris)
   ```

### Option 3 : Configurer le Wildcard Manuellement (Recommandé)

1. Dans **Vercel**, supprime `*.eyesberg.app`
2. Dans **Cloudflare**, vérifie que l'enregistrement `*` est bien :
   ```
   Type: CNAME
   Name: *
   Target: cname.vercel-dns.com
   Proxy: Désactivé (gris) ← Important pour la validation
   ```
3. Attends 5-10 minutes
4. Dans **Vercel**, re-ajoute `*.eyesberg.app`
5. Vercel devrait maintenant le valider

### Option 4 : Utiliser Vercel DNS (Pas Recommandé)

Si rien ne fonctionne, tu peux :
1. Changer les nameservers dans Cloudflare vers Vercel DNS
2. Mais tu perds les avantages de Cloudflare (CDN, DDoS protection, etc.)

---

## 🎯 Solution Recommandée

**Option 3** : Désactiver le proxy Cloudflare pour le wildcard `*` temporairement, valider dans Vercel, puis réactiver le proxy.

**Étapes** :
1. Cloudflare → DNS → Edit `*` → Désactive Proxy (gris)
2. Attends 10 minutes
3. Vercel → Refresh `*.eyesberg.app`
4. Une fois validé, réactive le proxy Cloudflare si tu veux

---

## 🔍 Vérification

Après avoir désactivé le proxy :
1. Attends 10-15 minutes pour la propagation DNS
2. Dans Vercel, clique sur **Refresh**
3. Le statut devrait passer à **"Valid Configuration"**

---

**Essaie l'Option 3 et dis-moi si ça fonctionne !** 🚀


