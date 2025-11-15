# 🔍 Diagnostic des Fonts

## Comment vérifier les fonts dans les DevTools

### Méthode 1 : Via l'inspecteur d'éléments
1. Ouvre les DevTools (F12 ou Cmd+Option+I sur Mac)
2. Clique sur l'icône "Select an element" (flèche en haut à gauche)
3. Clique sur un élément de texte (par exemple le label "Email")
4. Dans le panneau de droite, tu verras plusieurs onglets :
   - **Styles** : Les styles CSS appliqués
   - **Computed** : Les styles calculés/finaux (c'est ce qu'on cherche !)
5. Clique sur l'onglet **"Computed"**
6. Cherche la propriété `font-family` - tu verras quelle font est réellement utilisée

### Méthode 2 : Via la console
1. Ouvre les DevTools (F12)
2. Va dans l'onglet **Console**
3. Colle ce code et appuie sur Entrée :

```javascript
// Diagnostic complet des fonts
const h1 = document.querySelector('h1');
const label = document.querySelector('label');
const input = document.querySelector('input');

if (h1) {
  const h1Style = window.getComputedStyle(h1);
  console.log('H1 (Titre):', {
    fontFamily: h1Style.fontFamily,
    fontSize: h1Style.fontSize,
    fontWeight: h1Style.fontWeight,
    fontStyle: h1Style.fontStyle,
    color: h1Style.color,
  });
}

if (label) {
  const labelStyle = window.getComputedStyle(label);
  console.log('Label:', {
    fontFamily: labelStyle.fontFamily,
    fontSize: labelStyle.fontSize,
    color: labelStyle.color,
  });
}

if (input) {
  const inputStyle = window.getComputedStyle(input);
  console.log('Input:', {
    fontFamily: inputStyle.fontFamily,
    fontSize: inputStyle.fontSize,
    color: inputStyle.color,
    backgroundColor: inputStyle.backgroundColor,
  });
}

// Vérifier si les fonts sont chargées
console.log('Fonts chargées:');
console.log('PP Neue Machina:', document.fonts.check('48px "PP Neue Machina Inktrap Ultrabold Italic"'));
console.log('Inter:', document.fonts.check('16px Inter'));

// Lister toutes les fonts chargées
console.log('Toutes les fonts:', Array.from(document.fonts).map(f => ({
  family: f.family,
  status: f.status,
})));
```

### Méthode 3 : Vérifier dans Network
1. Ouvre les DevTools (F12)
2. Va dans l'onglet **Network**
3. Filtre par **Fonts** (ou tape "woff2" dans le filtre)
4. Recharge la page (F5)
5. Tu devrais voir les fichiers de fonts se charger
6. Clique sur un fichier pour voir les détails (status, size, etc.)

## Problèmes courants

### Les fonts se chargent mais ne s'affichent pas
- **Cause** : Le navigateur utilise les fallback fonts
- **Solution** : Vérifie que `font-family` dans Computed contient bien "PP Neue Machina" ou "Inter", pas seulement "sans-serif"

### Les fonts ne se chargent pas du tout
- **Cause** : Problème CORS ou fichier introuvable
- **Solution** : Vérifie dans Network si les fichiers retournent un status 200 (succès) ou une erreur

### Les fonts s'affichent mais avec un style différent
- **Cause** : Les styles CSS sont écrasés
- **Solution** : Vérifie dans l'onglet Styles quels styles sont appliqués et lesquels sont barrés (écrasés)

