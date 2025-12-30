# 🛍️ Guide d'Intégration Shopify - Configurateur StretchMX

## 📋 Vue d'ensemble

Ce guide vous explique comment connecter votre configurateur à votre boutique Shopify en quelques étapes simples.

---

## 🚀 Étape 1 : Récupérer l'URL de votre configurateur

Votre configurateur est déployé sur Vercel. Pour trouver l'URL :

1. Allez sur https://vercel.com
2. Connectez-vous et sélectionnez votre projet `eyesberg-saas`
3. Copiez l'URL de production (ex: `https://eyesberg-saas-xxx.vercel.app`)

**➡️ Notez cette URL :** `https://___________________________`

---

## 🎨 Étape 2 : Modifier le thème Shopify

### 2.1 Accéder à l'éditeur de code

1. **Shopify Admin** → **Boutique en ligne** → **Thèmes**
2. Cliquez sur **Actions** → **Modifier le code** sur votre thème actif

### 2.2 Modifier le fichier `main-product.liquid`

1. Dans la barre latérale, trouvez **Sections** → **main-product.liquid**
2. Ouvrez le fichier
3. Cherchez la section avec `<product-form class="sticky-cart__form">` (généralement vers la ligne 1735-1770)
4. **Remplacez cette section** par le code suivant :

```liquid
{% if product.tags contains 'customizer' %}
  <!-- Bouton Personnaliser pour les produits avec configurateur -->
  <div class="customizer-button" style="margin: 20px 0;">
    <button
      type="button"
      onclick="openCustomizer()"
      class="product-form__submit button solid-button body-font button--secondary{% if settings.use_heading_font_secondary_buttons %} heading-font-style{% endif %}{% if settings.uppercase_secondary_buttons %} uppercase{% endif %}"
      style="
        background: #000000;
        color: white;
        border: none;
        padding: 15px 30px;
        font-size: 16px;
        font-weight: bold;
        border-radius: 8px;
        cursor: pointer;
        width: 100%;
        transition: transform 0.2s;
      "
      onmouseover="this.style.transform='scale(1.02)'"
      onmouseout="this.style.transform='scale(1)'"
    >
      <span class="button-title">PERSONNALISER</span>
      <span class="product-form__buttons-icon icon icon--large flex--row">
        {% assign icon = settings.cart_name %}
        {%- render 'glyphs_header', icon: icon -%}
      </span>
    </button>
  </div>
{% else %}
  <!-- Bouton Add to cart normal pour les autres produits -->
  <product-form class="sticky-cart__form">
    {%- assign sticky_cart_form_id = product_form_id | append: '--alt' -%}
    {%- form 'product', product, id: sticky_cart_form_id, novalidate: 'novalidate', data-type: 'add-to-cart-form' -%}
      <input type="hidden" name="id" data-productid="{{ product.id }}" value="{{ product.selected_or_first_available_variant.id }}" disabled>
      <div class="product-form__buttons flex--column">
        <button
          type="submit"
          name="add"
          id="ProductSubmitButton-{{ section.id }}"
          class="product-form__submit product-form__submit button solid-button body-font button--secondary{% if settings.use_heading_font_secondary_buttons %} heading-font-style{% endif %}{% if settings.uppercase_secondary_buttons %} uppercase{% endif %}"
        {% if product.selected_or_first_available_variant.available == false %}disabled{% endif %} {%- if product.template_suffix == 'preorder' %} data-pre-order="true"{% endif -%}
        >
          <span class="button-title">
            {%- if product.selected_or_first_available_variant.available -%}
              {%- if product.template_suffix == 'preorder' -%}
                {{ 'products.product.pre_order' | t }}
              {%- else -%}
                {%- if settings.cart_name == 'cart' -%}{{ 'products.product.add_to_cart' | t }}{%- elsif settings.cart_name == 'bag' -%}{{ 'products.product.add_to_bag' | t }}{%- else -%}{{ 'products.product.add_to_basket' | t }}{%- endif -%}
              {%- endif -%}
            {%- else -%}
              {{ 'products.product.sold_out' | t }}
            {%- endif -%}
          </span>
          <span class="product-form__buttons-icon icon icon--large flex--row">
            {% assign icon = settings.cart_name %}
            {%- render 'glyphs_header', icon: icon -%}
          </span>
          <div class="loading-overlay__spinner hidden">
            <svg class="spinner" width="24px" height="24px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
              <circle class="path" fill="none" stroke-width="5" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
            </svg>
          </div>
        </button>
      </div>
    {%- endform -%}
  </product-form>
{% endif %}
```

### 2.3 Ajouter le modal et les scripts

**À la fin du fichier `main-product.liquid`** (juste avant `{% schema %}`), ajoutez ce code :

```liquid
<!-- Modal/Iframe pour le configurateur StretchMX -->
<div id="customizer-modal" style="
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.8);
  z-index: 9999;
">
  <div style="
    position: relative;
    width: 95%;
    height: 95%;
    max-width: 1400px;
    max-height: 900px;
    margin: 2.5% auto;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  ">
    <div style="
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #dee2e6;
    ">
      <h3 style="margin: 0; color: #333;">Personnalisez votre maillot</h3>
      <button onclick="closeCustomizer()" style="
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: #666;
      ">✕</button>
    </div>

    <iframe
      id="customizer-iframe"
      src=""
      style="width: 100%; height: calc(100% - 60px); border: none;"
      frameborder="0">
    </iframe>
  </div>
</div>

<script>
function openCustomizer() {
  const productId = {{ product.id }};
  const variantId = {{ product.selected_or_first_available_variant.id }};
  
  // ⚠️ REMPLACEZ CETTE URL PAR VOTRE URL VERCEL
  const configuratorUrl = `VOTRE_URL_VERCEL/configure?shop={{ shop.permanent_domain }}&productId=${productId}&variantId=${variantId}`;
  
  // Ajouter l'email du client si connecté
  {% if customer %}
  const customerEmail = '{{ customer.email }}';
  configuratorUrl += `&customer_email=${encodeURIComponent(customerEmail)}`;
  {% endif %}
  
  document.getElementById('customizer-modal').style.display = 'block';
  document.getElementById('customizer-iframe').src = configuratorUrl;
  document.body.style.overflow = 'hidden';
}

function closeCustomizer() {
  document.getElementById('customizer-modal').style.display = 'none';
  document.getElementById('customizer-iframe').src = '';
  document.body.style.overflow = 'auto';
}

// Fermer avec la touche Échap
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeCustomizer();
});

// Fermer en cliquant en dehors du modal
document.getElementById('customizer-modal').addEventListener('click', function(e) {
  if (e.target === this) closeCustomizer();
});

// Écouter les messages du configurateur pour fermer le modal
window.addEventListener('message', function(event) {
  // ⚠️ REMPLACEZ PAR VOTRE DOMAINE VERCEL
  if (event.origin !== 'VOTRE_URL_VERCEL') return;
  
  if (event.data === 'closeCustomizer' || event.data.type === 'closeCustomizer') {
    closeCustomizer();
    // Rediriger vers le panier
    window.location.href = '/cart';
  }
});
</script>
```

**⚠️ IMPORTANT :** Remplacez `VOTRE_URL_VERCEL` par votre URL Vercel (ex: `https://eyesberg-saas-xxx.vercel.app`)

### 2.4 Enregistrer

Cliquez sur **Enregistrer** en haut à droite.

---

## 🏷️ Étape 3 : Activer le configurateur sur un produit

1. **Shopify Admin** → **Produits** → Sélectionnez un produit
2. Dans la section **Tags** (en bas à droite), ajoutez : **`customizer`**
3. **Enregistrer**

---

## ✅ Étape 4 : Tester

1. Allez sur la page du produit sur votre site Shopify
2. Vous devriez voir le bouton **"PERSONNALISER"** au lieu du bouton "Add to cart"
3. Cliquez dessus → Le configurateur s'ouvre dans un modal
4. Personnalisez votre produit
5. Cliquez sur **"Ajouter au panier"** dans le configurateur
6. Le modal se ferme et vous êtes redirigé vers le panier ✅

---

## 🎯 Points importants

- ✅ Le bouton "PERSONNALISER" apparaît **UNIQUEMENT** pour les produits avec le tag `customizer`
- ✅ Les autres produits gardent leur bouton "Add to cart" normal
- ✅ Le modal se ferme automatiquement après l'ajout au panier
- ✅ Vous pouvez personnaliser le style du bouton dans le code

---

## 🔧 Personnalisation du bouton

Pour changer le style du bouton, modifiez les propriétés CSS dans la section `style="..."` :

```liquid
style="
  background: #000000;        /* Couleur de fond */
  color: white;              /* Couleur du texte */
  padding: 15px 30px;        /* Espacement */
  font-size: 16px;           /* Taille du texte */
  font-weight: bold;         /* Gras */
  border-radius: 8px;        /* Coins arrondis */
  width: 100%;               /* Largeur */
"
```

---

## 🆘 Dépannage

### Le bouton n'apparaît pas
- Vérifiez que le produit a bien le tag `customizer`
- Vérifiez que vous avez bien enregistré les modifications dans Shopify

### Le configurateur ne s'ouvre pas
- Vérifiez que l'URL Vercel est correcte dans le script
- Ouvrez la console du navigateur (F12) pour voir les erreurs

### Le modal ne se ferme pas après ajout au panier
- Vérifiez que l'URL dans `event.origin` correspond bien à votre URL Vercel
- Vérifiez que le configurateur envoie bien le message `closeCustomizer`

---

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
1. La console du navigateur (F12) pour les erreurs JavaScript
2. Que votre configurateur est bien déployé et accessible
3. Que les paramètres `shop`, `productId` et `variantId` sont bien passés dans l'URL





























