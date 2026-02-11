# Déploiement automatique avec GitHub

Pour que chaque push sur `main` déclenche un déploiement Vercel sans lancer `vercel --prod` à la main :

## 1. Lier le repo GitHub à Vercel

1. Va sur [vercel.com](https://vercel.com) → ton projet **eyesberg-saas**.
2. **Settings** → **Git**.
3. Si le projet n’est pas encore connecté à Git :
   - Clique sur **Connect Git Repository**.
   - Choisis **GitHub** et autorise Vercel si besoin.
   - Sélectionne le repo (ex. `steevys-projects/eyesberg-saas` ou ton org/repo).
4. Vérifie que :
   - **Production Branch** = `main` (ou la branche que tu utilises pour la prod).
   - Les déploiements automatiques sont bien activés.

## 2. Comportement

- **Push sur `main`** → déploiement en **production**.
- **Push sur une autre branche** ou **Pull Request** → déploiement en **preview** (URL de preview fournie par Vercel).

## 3. Déployer sans CLI

À partir de là, tu n’as plus besoin de lancer `npx vercel --prod` :

- Fais tes changements.
- Commit + push sur `main` :
  ```bash
  git add .
  git commit -m "ton message"
  git push origin main
  ```
- Vercel détecte le push et lance le build puis le déploiement. Tu peux suivre le statut dans le dashboard Vercel.

## 4. Si le projet est déjà créé sans Git

- Dans le projet Vercel : **Settings** → **Git** → **Connect Git Repository**.
- Après connexion, les prochains déploiements se feront via GitHub ; les déploiements manuels (`vercel --prod`) continueront aussi de fonctionner.
