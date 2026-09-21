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

**Entry flow:** `index.html` (shell) → loads `pages/home.html` in an iframe → `src/main.js` → `startLoader()` (first visit only) → `initScene()` (Three.js scene)

**Shell pattern:** `index.html` is the persistent shell that holds the music player widget and camera widget above an `<iframe>`. All page navigations swap the iframe content — the shell never reloads, so widgets always persist. Sub-pages navigate within the iframe (no `target="_top"`).

**Loader skip:** `src/main.js` checks `localStorage.getItem('cf_loaded')` before showing the loader. On first visit it runs `startLoader()` and sets the flag; on return visits it calls `initScene()` directly. `pages/home.html` also has a synchronous inline `<script>` immediately after `#loader` that sets `display:none` on the loader if the flag is already set — this prevents any flash before the deferred module script runs.

**Page transition system:** A `#page-transition` overlay (z-index 9998, background `#060612`) lives in `index.html` and covers the entire viewport during route changes. The shell listens for `postMessage` events from iframe pages:
- `'cf:out'` → fades the overlay in (260ms). The sending page waits 270ms then navigates via `window.location.href`.
- `'cf:ready'` → fades the overlay out (260ms). Every page's Three.js animate loop sends this on its first frame.
- All pages expose a local `transitionTo(url)` helper that encapsulates this: `postMessage('cf:out')` + setTimeout navigate.
- Back buttons (`#back-btn`) on all sub-pages use this helper and navigate to `/pages/home.html` within the iframe.

**`src/scene/scene.js`** — core Three.js setup: renderer, camera, animation loop, mouse parallax tracking. The three starfield layers (`starA/B/C`) rotate at different speeds and respond to mouse position with layered parallax (starA most reactive, starC not at all). Also handles:
- Molar tooth GLB model (loaded via GLTFLoader, slow Y-axis rotation) plus a row of clickable icon GLB models — Instagram, TikTok, polaroid camera, kitty, dollar symbol — that fade in once all models finish loading
- Raycaster click detection routes each model to a destination: tooth → external `https://venue.ink/@charmfluent`, Instagram model → external Instagram profile, TikTok model → external TikTok profile, polaroid camera model → `transitionTo('/pages/camera.html')`, kitty model → `transitionTo('/pages/about.html')`, dollar symbol model → `transitionTo('/pages/prices.html')`
- **Note:** the tooth model no longer links to `/pages/tooth-gemz.html` (it opens the external venue.ink link instead). Nothing else in the app currently links to `pages/tooth-gemz.html` either — it's effectively orphaned; confirm with the project owner whether it's still needed
- CSS custom cursor (pink glowing dot, tracks mousemove)
- Chrome pink 3D text: "Charmfluent" title + "Custom Grillz & Tooth Charms" subtitle + icon labels
- Sends `window.parent.postMessage('cf:ready', '*')` on the first animation frame (signals shell to reveal the page)

**Mobile layout system (`src/scene/scene.js`):**
- `isMobile = window.innerWidth < 768`. Mobile shows **two rows of 3** models; desktop shows one row of 6.
- Per-breakpoint `cfg` object (keyed by `w = window.innerWidth`) controls `title`, `sub`, `label` font sizes, `toothScale`, and column `spacing`. Key breakpoints: `<415` (iPhone 16), `<480` (iPhone Pro Max).
- **Title/subtitle auto-fit:** after creating the TextGeometry, both meshes are scaled down if their width exceeds 90% of the visible world width at Z=0, so they never clip the viewport edges on any screen size.
- **Label auto-fit:** `makeLabel()` scales each label down if it exceeds `cfg.spacing * 0.88`, preventing long labels like "Instagram" from overlapping adjacent columns.
- `FLOOR_Y` / `FLOOR_Y_ROW2` — world-Y where the bottom of row 1 / row 2 models sit. Adjust these to move the icon grid up or down on screen.
- `labelY1 = FLOOR_Y - 0.38`, `labelY2 = FLOOR_Y_ROW2 - 0.62` — row 2 uses a larger offset to clear the polaroid camera model's geometry.
- All icon models scale relative to `toothMaxDim` (derived from `cfg.toothScale`) so they appear visually consistent in size.

**`src/scene/starfield.js`** — creates three `THREE.Points` layers with different density/size/opacity to simulate depth. Stars are randomly positioned in a spread volume behind the camera.

**`src/scene/lights.js`** — three-point lighting: warm white key + purple rim + gold fill, matching the brand color palette.

**`src/utils/loader.js`** — simulated progress bar that increments randomly every 110ms, fades out the `#loader` overlay when complete, then fires `onComplete` callback after 700ms fade. Only called on first visit (see loader skip above).

**`src/style.css`** — all UI styles. Fixed-position overlays (brand header, hint, footer, vignette, loader, custom cursor) sit above the Three.js canvas (`z-index` layering: canvas at 0, overlays at 1–5, loader at 100, cursor at 9999). Color palette: deep navy `#060612` background, gold `#D4AF37` accents, pink `#ff6ec7` / `#e91e8c` highlights. Footer lower row uses `.footer-row` (flex, gap 16px) with `.footer-copy` on the copyright span so all three items — Privacy Policy, Terms & Conditions, copyright — have equal spacing.

**`src/player/player.js` + `player.css`** — persistent music player widget (iPod-style) rendered in the shell `index.html`.

**`src/player/cam-widget.js` + `cam-widget.css`** — persistent camera/photo widget (Sony DSC-style) rendered in the shell `index.html`. Preloads a hardcoded list of photos from `public/assets/photos/` (see `PRELOADED_PHOTOS` at the top of the file — update this list when adding/removing gallery photos) and auto-rotates every 3s. Clicking the photo navigates to `/pages/camera.html`.

## Pages

All sub-pages live in `pages/`. Back buttons navigate within the iframe to `/pages/home.html` (not `target="_top"`) so the shell never reloads. Every page's JS file exposes a local `transitionTo(url)` helper and wires `#back-btn` to it. Every page signals `cf:ready` on its first Three.js animation frame.

**Back button style** — shared across all pages via per-page CSS: `position:fixed; top:16px; left:16px; font-family:'Press Start 2P'; font-size:8px; padding:14px 18px; min-height:44px; background:rgba(6,6,18,0.6); border:1px solid rgba(255,110,199,0.3); border-radius:20px`. Mobile override: `font-size:7px; top:14px; left:14px; padding:5px 10px; min-height:unset`.

- `index.html` — persistent shell: music player + camera widget + iframe + `#page-transition` overlay
- `pages/home.html` — landing page content loaded in the iframe (Three.js starfield scene). `#loader` starts `display:none` via inline style; a synchronous inline script removes that style on first visit only.
- `pages/camera.html` — Gallery page with Three.js starfield background + chrome 3D "Gallery" title + Sony DSC camera UI
  - `src/pages/camera.js` — Three.js scene (starfield + Gallery title) + photo gallery logic, including category filter pills (`.filter-pill`, filters `allPhotos` down to `visiblePhotos` by category, "all" shows everything) and a photo upload flow
  - `src/pages/camera.css` — page-specific styles
- `pages/prices.html` — Pricing page, same starfield/chrome-3D-title treatment as other pages; reached via the dollar-symbol model on Home
  - `src/pages/prices.js` — Three.js scene (starfield + lighting + title)
  - `src/pages/prices.css` — page-specific styles
  - Not currently listed as a build input in `vite.config.js` — see the build config gap noted above
- `pages/about.html` — Brand story page with scroll-based interaction; reached via the kitty model on Home
  - `src/pages/about.js` — Three.js scene (starfield + lighting + title). Title uses auto-fit scaling: after `computeBoundingBox`, if the text width exceeds 90% of visible world width it is scaled down uniformly and re-centred.
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
