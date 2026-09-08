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

**⚠️ Build config gap:** `vite.config.js` only registers `shell` (index.html), `landing` (home.html), `toothGemz` (tooth-gemz.html), and `camera` (camera.html) as Rollup inputs. `pages/about.html` and `pages/prices.html` exist and are linked in-app but are **not** listed as build inputs — verify whether `npm run build` actually emits them before relying on a production build.

**Entry flow:** `index.html` (shell) → loads `pages/home.html` in an iframe → `src/main.js` → `startLoader()` (animated progress bar) → `initScene()` (Three.js scene)

**Shell pattern:** `index.html` is the persistent shell that holds the music player widget and camera widget above an `<iframe>`. All page navigations swap the iframe content — the widgets never reload. Sub-pages link back to `/` (not to individual `.html` files) to preserve the shell.

**`src/scene/scene.js`** — core Three.js setup: renderer, camera, animation loop, mouse parallax tracking. The three starfield layers (`starA/B/C`) rotate at different speeds and respond to mouse position with layered parallax (starA most reactive, starC not at all). Also handles:
- Molar tooth GLB model (loaded via GLTFLoader, slow Y-axis rotation) plus a row of clickable icon GLB models — Instagram, TikTok, polaroid camera, kitty, dollar symbol — that fade in once all models finish loading
- Raycaster click detection routes each model to a destination: tooth → external `https://venue.ink/@charmfluent`, Instagram model → external Instagram profile, TikTok model → external TikTok profile, polaroid camera model → `/pages/camera.html`, kitty model → `/pages/about.html`, dollar symbol model → `/pages/prices.html`
- **Note:** the tooth model no longer links to `/pages/tooth-gemz.html` (it opens the external venue.ink link instead). Nothing else in the app currently links to `pages/tooth-gemz.html` either — it's effectively orphaned; confirm with the project owner whether it's still needed
- CSS custom cursor (pink glowing dot, tracks mousemove)
- Chrome pink 3D text: "Charmfluent" title + "Custom Grillz & Tooth Charms" subtitle + "Tooth Gemz" label under tooth

**`src/scene/starfield.js`** — creates three `THREE.Points` layers with different density/size/opacity to simulate depth. Stars are randomly positioned in a spread volume behind the camera.

**`src/scene/lights.js`** — three-point lighting: warm white key + purple rim + gold fill, matching the brand color palette.

**`src/utils/loader.js`** — simulated progress bar that increments randomly every 110ms, fades out the `#loader` overlay when complete, then fires `onComplete` callback after 700ms fade.

**`src/style.css`** — all UI styles. Fixed-position overlays (brand header, hint, footer, vignette, loader, custom cursor) sit above the Three.js canvas (`z-index` layering: canvas at 0, overlays at 1–5, loader at 100, cursor at 9999). Color palette: deep navy `#060612` background, gold `#D4AF37` accents, pink `#ff6ec7` / `#e91e8c` highlights.

**`src/player/player.js` + `player.css`** — persistent music player widget (iPod-style) rendered in the shell `index.html`.

**`src/player/cam-widget.js` + `cam-widget.css`** — persistent camera/photo widget (Sony DSC-style) rendered in the shell `index.html`. Preloads a hardcoded list of photos from `public/assets/photos/` (see `PRELOADED_PHOTOS` at the top of the file — update this list when adding/removing gallery photos) and auto-rotates every 3s. Clicking the photo navigates to `/pages/camera.html`.

## Pages

All sub-pages live in `pages/` and link back to `/` for the shell.

- `index.html` — persistent shell: music player + camera widget + iframe
- `pages/home.html` — landing page content loaded in the iframe (Three.js starfield scene)
- `pages/camera.html` — Gallery page with Three.js starfield background + chrome 3D "Gallery" title + Sony DSC camera UI
  - `src/pages/camera.js` — Three.js scene (starfield + Gallery title) + photo gallery logic, including category filter pills (`.filter-pill`, filters `allPhotos` down to `visiblePhotos` by category, "all" shows everything) and a photo upload flow
  - `src/pages/camera.css` — page-specific styles
- `pages/prices.html` — Pricing page, same starfield/chrome-3D-title treatment as other pages; reached via the dollar-symbol model on Home
  - `src/pages/prices.js` — Three.js scene (starfield + lighting + title)
  - `src/pages/prices.css` — page-specific styles
  - Not currently listed as a build input in `vite.config.js` — see the build config gap noted above
- `pages/about.html` — Brand story page with scroll-based interaction; reached via the kitty model on Home
  - `src/pages/about.js` — Three.js scene (starfield + lighting + title)
  - `src/pages/about.css` — page-specific styles
  - Not currently listed as a build input in `vite.config.js` — see the build config gap noted above
- `pages/tooth-gemz.html` — Tooth Gemz product page. **Currently orphaned:** no in-app link points to it anymore (the tooth model click was repointed to an external URL) — still registered as a `vite.config.js` build input
  - `src/pages/tooth-gemz.js` — cursor + Three.js title setup
  - `src/pages/tooth-gemz.css` — page-specific styles

## Static Assets

All assets live under `public/assets/`:
- `fonts/` — `UnifrakturMaguntia-Regular.ttf` (blackletter chrome 3D text), `kenpixel.ttf`. Served at `/assets/fonts/`
- `models/` — `molar_tooth.glb` (Home tooth model) plus the Home icon row: `instagram.glb`, `tiktok_logo.glb`, `polaroid_camera.glb`, `kitty.glb`, `low_poly_dollar_symbol.glb`. Each also has an `_original.glb` source variant alongside it. Served at `/assets/models/`
- `photos/` — gallery/camera-widget photos (filenames are the original uploads, e.g. `IMG_7143.jpg`; the widget's preload list is hardcoded in `cam-widget.js`, not derived from directory contents). Served at `/assets/photos/`
- `videos/` — `FINALvideo.mp4`
- `audio/` — music tracks for the player widget
- `icons/` — future icon sprites
- `cursor/` — future custom cursor PNGs
- `og-image.png` — shared Open Graph/Twitter card image referenced from `index.html`

## Font Setup

The 3D text requires `UnifrakturMaguntia-Regular.ttf` at `public/assets/fonts/UnifrakturMaguntia-Regular.ttf` (served at `/assets/fonts/UnifrakturMaguntia-Regular.ttf`). Download from Google Fonts.
