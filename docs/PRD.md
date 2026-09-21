# Charmfluent — Project Requirements Document

**Status:** Living document — reflects current build as of 2026-09-01
**Owner:** tirsoo@kean.edu

## 1. Overview

Charmfluent is an interactive, Three.js-powered marketing/e-commerce landing site for a custom tooth gems & grillz brand. The site pairs a 3D starfield/product experience with brand storytelling, a gallery, and pricing — built as a Vite multi-page app with a persistent shell (music player + camera widget) wrapping each page.

## 2. Goals

- Give the Charmfluent brand a visually distinctive, memorable web presence that reflects its aesthetic (pink/gold, chrome 3D type, glossy grillz/tooth imagery).
- Let visitors explore the product (tooth gemz), see past work (gallery), understand pricing, and learn about the brand — all without leaving an immersive 3D shell.
- Keep the experience fast and usable on mobile, where most social-driven traffic will land.
- Support basic organic discovery via SEO/social meta tags (Open Graph, Twitter cards).

## 3. Target Audience

- Prospective customers arriving from Instagram/TikTok looking for custom grillz or tooth gem work.
- Existing/returning customers checking prices or browsing the gallery for inspiration.
- Primarily mobile-first visitors, browsing casually rather than doing task-driven research.

## 4. Current Feature Set

### 4.1 Shell (`index.html`)
- Persistent chrome that never reloads across navigation: houses the music player widget and camera widget.
- All page content loads into an `<iframe>` (`#page-frame`); sub-pages link back to `/` to preserve the shell.
- SEO/social meta tags (title, description, Open Graph, Twitter card) with a shared `og-image.png`.
- `<noscript>` fallback with brand image and copy for non-JS visitors.

### 4.2 Home (`pages/home.html`)
- Animated loader (`src/utils/loader.js`) with simulated progress bar before the 3D scene reveals.
- Three-layer parallax starfield (`starA/B/C`), each reacting differently to mouse movement.
- Molar tooth GLB model, slow auto-rotation, click-to-navigate to Tooth Gemz page (raycaster hit test).
- Chrome pink 3D title text ("Charmfluent"), subtitle ("Custom Grillz & Tooth Charms"), and a "Tooth Gemz" label under the tooth.
- Custom pink glowing-dot cursor.

### 4.3 Tooth Gemz (`pages/tooth-gemz.html`)
- Product-focused page reached by clicking the tooth model on Home.
- Dedicated Three.js title setup + custom cursor.

### 4.4 Gallery (`pages/camera.html`)
- Starfield background + chrome 3D "Gallery" title, in the same visual language as Home.
- Sony DSC-style camera UI.
- Photo gallery sourced from `public/assets/photos/`, with **category filter pills** (filter by tag, "all" shows everything).
- **Photo upload** capability from the gallery UI.

### 4.5 Prices (`pages/prices.html`)
- Starfield + lighting setup (pink point light, white directional, spotlight on the title) mirroring the brand's chrome/gloss look.
- Pricing content presented in the same 3D shell.

### 4.6 About (`pages/about.html`)
- Brand story page with scroll-based interaction (per recent commit history).

### 4.7 Cross-cutting
- Shared starfield (`src/scene/starfield.js`) and three-point brand lighting (`src/scene/lights.js`) reused across pages.
- Persistent music player widget (`src/player/`) — iPod-style, lives in the shell.
- Persistent camera widget (`src/player/cam-widget.js`) — Sony DSC-style, auto-rotates preloaded photos every 3s, click navigates to Gallery.
- Mobile-responsive layout adjustments across pages (camera FOV/lookAt, layout) per recent commits.
- Icon set synced across widgets.

## 5. Technical Requirements

- **Stack:** Three.js r183, Vite 7, vanilla JS (no framework), plain CSS.
- **Build:** Vite multi-page build (`vite.config.js`) — currently wires up `shell` (index.html), `landing` (home.html), `toothGemz`, and `camera` as explicit Rollup inputs. **Gap to close:** `pages/about.html` and `pages/prices.html` exist and are linked in-app but are not registered as Rollup inputs — see Open Issues.
- **Assets:** served from `public/assets/` — GLB models (`models/`), fonts (`fonts/`), photos (`photos/`), audio (`audio/`), icons (`icons/`), cursor art (`cursor/`), video (`videos/`).
- **Fonts:** `UnifrakturMaguntia-Regular.ttf` (blackletter chrome 3D text) and `kenpixel.ttf`, loaded via Three's `TTFLoader`.
- **No test runner configured** — verification is manual (`npm run dev` / `npm run preview`).
- **Browser support:** modern evergreen browsers with WebGL; `<noscript>` fallback for JS-disabled visitors.

## 6. Design Requirements

- **Palette:** deep navy `#060612` background, gold `#D4AF37` accents, pink `#ff6ec7` / magenta `#e91e8c` highlights, chrome/white specular highlights on 3D text.
- **Typography:** blackletter/chrome 3D headline type; pixel font (`kenpixel`) for widget UI chrome.
- **Motion:** parallax starfields, slow auto-rotating product models, glowing custom cursor — consistent "glossy digital jewelry case" feel across every page.
- **Layering:** canvas at z-index 0, UI overlays 1–5, loader at 100, custom cursor at 9999 (fixed convention across pages).

## 7. Non-Functional Requirements

- **Performance:** loader must mask asset/model load time; starfields and models should stay performant on mid-range mobile GPUs (device pixel ratio capped, e.g. `Math.min(devicePixelRatio, 2)`).
- **Mobile responsiveness:** camera FOV/lookAt and layouts adapt below 768px (established pattern in `prices.js`, `camera.js`); should be the standard for any new page.
- **SEO:** every page should carry accurate `<title>`, description, and Open Graph/Twitter meta (currently strongest on the shell `index.html`; per-page meta should be audited — see Open Issues).
- **Accessibility:** minimum viable — `<noscript>` fallback exists; alt text present on fallback imagery. No formal WCAG audit has been done.

## 8. Out of Scope (for this document / current phase)

- Backend/CMS for managing gallery photos or prices dynamically (current data appears static/asset-driven).
- Payment processing / checkout flow.
- User accounts or authentication.
- Automated testing (explicitly not configured per `CLAUDE.md`).

## 9. Open Issues / Risks

- `vite.config.js` does not list `about` or `prices` as build inputs — confirm whether the production build (`npm run build`) actually emits those pages, or whether this needs fixing before the next deploy.
- Several GLB models exist in `public/assets/models/` (kitty, dollar symbol, TikTok logo, Instagram logo, polaroid camera) that aren't referenced in the documented architecture — confirm whether these are in active use, planned, or stale assets to clean up.
- No automated tests — regressions rely on manual verification (`npm run dev`, then click through each page/widget) before shipping.

## 10. Success Metrics (proposed — confirm with stakeholder)

- Time-to-interactive on mobile (loader completion time).
- Click-through rate from Home → Tooth Gemz (tooth click) and widget → Gallery.
- Gallery engagement (filter usage, upload usage) if analytics are added.
- Bounce rate / session length as a proxy for whether the 3D experience lands vs. frustrates.

## 11. Future Considerations

- Formalize per-page SEO metadata.
- Decide fate of unused GLB assets (kitty, dollar, social logos, polaroid camera).
- Consider adding the missing pages to `vite.config.js` build inputs if not already covered.
- Evaluate need for lightweight analytics to validate the success metrics above.
