# Plan de Restructuration : Builder vs Configurateur Client

## Objectif
Séparer clairement :
- **Page Builder** (`/admin/products/new`) : Pour créer/configurer les produits (avec zones noires admin)
- **Page Configurateur Client** (`/configure`) : Pour que les clients configurent leur produit (seulement viewer 3D blanc + sidebar blanche)

## Structure actuelle

### Problèmes identifiés
1. `ClientPage.tsx` (2859 lignes) est mal structuré
2. L'export default retourne `null`, causant l'erreur React #130
3. La fonction `Sidebar` contient tout le code mais n'est pas exportée
4. Le code du viewer 3D + sidebar est mélangé avec la logique admin

## Plan d'action

### Étape 1 : Corriger l'export de ClientPage (URGENT)
- [ ] Trouver la fonction principale qui contient tout le code
- [ ] Corriger l'export default pour qu'il retourne le bon composant
- [ ] Tester que `/configure` fonctionne

### Étape 2 : Créer ConfiguratorViewer (composant réutilisable)
- [ ] Extraire la logique du viewer 3D + sidebar blanche de `ClientPage.tsx`
- [ ] Créer `src/components/ConfiguratorViewer.tsx`
- [ ] Props : `mode` ('client' | 'admin'), `productId`, `shopDomain`, etc.
- [ ] Tester que le composant fonctionne isolément

### Étape 3 : Utiliser ConfiguratorViewer dans /configure
- [ ] Modifier `src/app/configure/page.tsx` pour utiliser `ConfiguratorViewer`
- [ ] Mode 'client' : plein écran, sans zones noires
- [ ] Tester que le configurateur client fonctionne

### Étape 4 : Utiliser ConfiguratorViewer dans le builder
- [ ] Modifier `src/app/[subdomain]/admin/products/new/page.tsx`
- [ ] Dans l'onglet BUILD, utiliser `ConfiguratorViewer` avec mode 'admin'
- [ ] Garder les zones noires autour (header, navigation, etc.)
- [ ] Tester que le builder fonctionne

## Structure cible

```
src/
├── components/
│   └── ConfiguratorViewer.tsx  ← Viewer 3D + Sidebar blanche (réutilisable)
├── app/
│   ├── configure/
│   │   └── page.tsx            ← Page client (utilise ConfiguratorViewer)
│   └── [subdomain]/admin/products/new/
│       └── page.tsx            ← Builder admin (utilise ConfiguratorViewer dans BUILD)
```

## Notes
- Le fichier `ClientPage.tsx` sera progressivement vidé au profit de `ConfiguratorViewer.tsx`
- Les hooks et utilitaires peuvent être extraits dans des fichiers séparés
- La logique admin (BUILD, PRICING, VARIANTS, CONNECT) reste dans le builder


























