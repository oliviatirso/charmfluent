# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite, hot reload)
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

No test runner is configured.

## Architecture

This is a Three.js interactive landing page for Charmfluent (custom tooth gems & grillz brand), bundled with Vite. Multi-page app configured via `vite.config.js`.

**Entry flow:** `index.html` (shell) → loads `pages/home.html` in an iframe → `src/main.js` → `startLoader()` (animated progress bar) → `initScene()` (Three.js scene)

**Shell pattern:** `index.html` is the persistent shell that holds the music player widget and camera widget above an `<iframe>`. All page navigations swap the iframe content — the widgets never reload. Sub-pages link back to `/` (not to individual `.html` files) to preserve the shell.

**`src/scene/scene.js`** — core Three.js setup: renderer, camera, animation loop, mouse parallax tracking. The three starfield layers (`starA/B/C`) rotate at different speeds and respond to mouse position with layered parallax (starA most reactive, starC not at all). Also handles:
- Molar tooth GLB model (loaded via GLTFLoader, slow Y-axis rotation)
- Raycaster click detection on tooth → navigates to `/pages/tooth-gemz.html`
- CSS custom cursor (pink glowing dot, tracks mousemove)
- Chrome pink 3D text: "Charmfluent" title + "Custom Grillz & Tooth Charms" subtitle + "Tooth Gemz" label under tooth

**`src/scene/starfield.js`** — creates three `THREE.Points` layers with different density/size/opacity to simulate depth. Stars are randomly positioned in a spread volume behind the camera.

**`src/scene/lights.js`** — three-point lighting: warm white key + purple rim + gold fill, matching the brand color palette.

**`src/utils/loader.js`** — simulated progress bar that increments randomly every 110ms, fades out the `#loader` overlay when complete, then fires `onComplete` callback after 700ms fade.

**`src/style.css`** — all UI styles. Fixed-position overlays (brand header, hint, footer, vignette, loader, custom cursor) sit above the Three.js canvas (`z-index` layering: canvas at 0, overlays at 1–5, loader at 100, cursor at 9999). Color palette: deep navy `#060612` background, gold `#D4AF37` accents, pink `#ff6ec7` / `#e91e8c` highlights.

**`src/player/player.js` + `player.css`** — persistent music player widget (iPod-style) rendered in the shell `index.html`.

**`src/player/cam-widget.js` + `cam-widget.css`** — persistent camera/photo widget (Sony DSC-style) rendered in the shell `index.html`. Preloads photos from `public/assets/photos/` and auto-rotates every 3s. Clicking the photo navigates to `/pages/camera.html`.

## Pages

All sub-pages live in `pages/` and link back to `/` for the shell.

- `index.html` — persistent shell: music player + camera widget + iframe
- `pages/home.html` — landing page content loaded in the iframe (Three.js starfield scene)
- `pages/camera.html` — Gallery page with Three.js starfield background + chrome 3D "Gallery" title + Sony DSC camera UI
  - `src/pages/camera.js` — Three.js scene (starfield + Gallery title) + photo gallery logic
  - `src/pages/camera.css` — page-specific styles
- `pages/tooth-gemz.html` — Tooth Gemz product page (linked from tooth click)
  - `src/pages/tooth-gemz.js` — cursor + Three.js title setup
  - `src/pages/tooth-gemz.css` — page-specific styles

## Static Assets

All assets live under `public/assets/`:
- `fonts/` — `UnifrakturMaguntia-Regular.ttf` (blackletter chrome 3D text), `kenpixel.ttf`. Served at `/assets/fonts/`
- `models/` — `molar_tooth.glb` served at `/assets/models/molar_tooth.glb`
- `photos/` — `photo1.jpg`, `photo2.jpg` preloaded into camera widget. Served at `/assets/photos/`
- `audio/` — music tracks for the player widget
- `icons/` — future icon sprites
- `cursor/` — future custom cursor PNGs

## Font Setup

The 3D text requires `UnifrakturMaguntia-Regular.ttf` at `public/assets/fonts/UnifrakturMaguntia-Regular.ttf` (served at `/assets/fonts/UnifrakturMaguntia-Regular.ttf`). Download from Google Fonts.
