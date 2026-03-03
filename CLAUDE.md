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

This is a Three.js interactive landing page for Charmfluent (custom tooth gems & grillz brand), bundled with Vite.

**Entry flow:** `index.html` → `src/main.js` → `startLoader()` (animated progress bar) → `initScene()` (Three.js scene)

**`src/scene/scene.js`** — core Three.js setup: renderer, camera, animation loop, mouse parallax tracking. The three starfield layers (`starA/B/C`) rotate at different speeds and respond to mouse position with layered parallax (starA most reactive, starC not at all).

**`src/scene/starfield.js`** — creates three `THREE.Points` layers with different density/size/opacity to simulate depth. Stars are randomly positioned in a spread volume behind the camera.

**`srctml/scene/lights.js`** — three-point lighting: warm white key + purple rim + gold fill, matching the brand color palette.

**`src/utils/loader.js`** — simulated progress bar that increments randomly every 110ms, fades out the `#loader` overlay when complete, then fires `onComplete` callback after 700ms fade.

**`src/style.css`** — all UI styles. Fixed-position overlays (brand header, hint, footer, vignette, loader) sit above the Three.js canvas (`z-index` layering: canvas at 0, overlays at 1–5, loader at 100). Color palette: deep navy `#060612` background, gold `#D4AF37` accents, purple highlights.

## Static Assets

`public/assets/` has placeholder directories for future content:
- `models/` — intended for 3D models (e.g. `.glb` tooth gem/grillz)
- `icons/` — clickable icon sprites referenced by the "tap icons to explore" hint
- `cursor/` — custom cursor PNG (`cursor-pink.png` referenced in CSS but not yet present)
- `audio/` — ambient audio
- `fonts/` — local font files

The hint text "Tap the icons to explore" implies future interactive 3D objects (likely loaded from `models/`) that users can click.
