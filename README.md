# Marché et Resto Chala, site vitrine

Site statique (HTML, CSS, JS) animé avec GSAP + ScrollTrigger + Lenis.
Aucun build : tout le site est dans `public/`.

## Modifier le menu
Ouvrir `public/menu-data.js` et changer les noms ou les prix. Le site se met à jour seul.

## Tester en local
```
npx serve public
```

## Déployer sur Cloudflare
Option A (Workers, connecté à GitHub) : Workers & Pages > Create > Import a repository > choisir ce repo.
Build command : vide. Deploy command : `npx wrangler deploy` (lit `wrangler.jsonc`).

Option B (Pages) : Create > Pages > Connect to Git. Framework : None. Build command : vide. Output directory : `public`.
