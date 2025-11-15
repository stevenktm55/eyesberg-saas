# 🔍 Vérifier si les fonts sont vraiment utilisées

Colle ce code dans la console pour vérifier si les fonts sont vraiment rendues :

```javascript
// Test de largeur pour vérifier quelle font est vraiment utilisée
const testText = 'CREATE YOUR ACCOUNT';

// Créer un élément avec PP Neue Machina
const testPP = document.createElement('div');
testPP.style.position = 'absolute';
testPP.style.visibility = 'hidden';
testPP.style.fontFamily = '"PP Neue Machina Inktrap Ultrabold Italic"';
testPP.style.fontSize = '48px';
testPP.textContent = testText;
document.body.appendChild(testPP);
const widthPP = testPP.offsetWidth;

// Créer un élément avec Arial (fallback)
const testArial = document.createElement('div');
testArial.style.position = 'absolute';
testArial.style.visibility = 'hidden';
testArial.style.fontFamily = 'Arial, sans-serif';
testArial.style.fontSize = '48px';
testArial.style.fontStyle = 'italic';
testArial.textContent = testText;
document.body.appendChild(testArial);
const widthArial = testArial.offsetWidth;

// Mesurer le H1 réel
const h1 = document.querySelector('h1');
const h1Width = h1 ? h1.offsetWidth : 0;

console.log('Largeurs mesurées:');
console.log('PP Neue Machina:', widthPP);
console.log('Arial (fallback):', widthArial);
console.log('H1 réel:', h1Width);
console.log('H1 utilise PP Neue Machina?', Math.abs(h1Width - widthPP) < Math.abs(h1Width - widthArial));

// Test pour Inter
const testInter = document.createElement('div');
testInter.style.position = 'absolute';
testInter.style.visibility = 'hidden';
testInter.style.fontFamily = 'Inter';
testInter.style.fontSize = '14px';
testInter.textContent = 'Email';
document.body.appendChild(testInter);
const widthInter = testInter.offsetWidth;

const testSystem = document.createElement('div');
testSystem.style.position = 'absolute';
testSystem.style.visibility = 'hidden';
testSystem.style.fontFamily = '-apple-system, sans-serif';
testSystem.style.fontSize = '14px';
testSystem.textContent = 'Email';
document.body.appendChild(testSystem);
const widthSystem = testSystem.offsetWidth;

const label = document.querySelector('label');
const labelWidth = label ? label.offsetWidth : 0;

console.log('\nTest Inter:');
console.log('Inter:', widthInter);
console.log('System font:', widthSystem);
console.log('Label réel:', labelWidth);
console.log('Label utilise Inter?', Math.abs(labelWidth - widthInter) < Math.abs(labelWidth - widthSystem));

// Nettoyer
testPP.remove();
testArial.remove();
testInter.remove();
testSystem.remove();
```

Si les fonts ne sont pas vraiment utilisées, essaie ce code pour forcer leur utilisation :

```javascript
// Forcer l'utilisation des fonts
document.fonts.ready.then(() => {
  const h1 = document.querySelector('h1');
  if (h1) {
    h1.style.fontFamily = '"PP Neue Machina Inktrap Ultrabold Italic", sans-serif';
    h1.style.fontDisplay = 'block';
  }
  
  const labels = document.querySelectorAll('label');
  labels.forEach(label => {
    label.style.fontFamily = '"Inter", sans-serif';
    label.style.fontDisplay = 'block';
  });
  
  const inputs = document.querySelectorAll('input');
  inputs.forEach(input => {
    input.style.fontFamily = '"Inter", sans-serif';
    input.style.fontDisplay = 'block';
  });
  
  console.log('Fonts forcées !');
});
```

