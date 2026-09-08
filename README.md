# Charmfluent

Business website for **Charmfluent** — a custom tooth gems & grillz brand. Clients can browse the artist's content, explore products, and book appointments. Built with Three.js and Vite.

## Features

- Animated 3D starfield with mouse parallax
- Rotating molar tooth GLB model plus a row of clickable icon models (Instagram, TikTok, polaroid camera, kitty, dollar symbol) that route to socials or in-app pages
- Chrome 3D text rendered with `TextGeometry` and `UnifrakturMaguntia` blackletter font
- Persistent music player widget (iPod-style)
- Persistent camera/photo widget (Sony DSC-style) with auto-rotating gallery
- Multi-page app: Home, Gallery, Prices, About (see note below on Tooth Gemz)
- Photo gallery with category filters and photo upload
- Appointment booking via an external link (tooth model click opens `venue.ink`)
- Artist content showcase (photos, video, gallery)
- Custom pink glowing cursor

> **Note:** `pages/tooth-gemz.html` still exists in the codebase but is currently orphaned — nothing in the app links to it anymore (the tooth model's click now opens the external booking link instead), and its "Book" buttons are placeholder (`href="#"`).

## Stack

- [Three.js](https://threejs.org/) — 3D rendering
- [Vite](https://vitejs.dev/) — bundler & dev server

## Getting Started

```bash
npm install
npm run dev       # Start dev server with hot reload
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

## Project Structure

```
index.html              # Persistent shell (music player + camera widget + iframe)
pages/
  home.html             # Landing page (Three.js starfield scene)
  camera.html           # Gallery page
  prices.html           # Pricing page
  about.html            # About / brand story page
  tooth-gemz.html       # Tooth Gemz product page (currently orphaned, see Features)
src/
  main.js               # Entry: loader → Three.js scene
  style.css             # Global styles
  scene/
    scene.js            # Three.js renderer, camera, animation loop, tooth + icon models
    starfield.js        # Three-layer star field
    lights.js           # Three-point lighting
  player/
    player.js/css       # Music player widget
    cam-widget.js/css   # Camera/photo widget
  pages/
    camera.js/css       # Gallery page logic & styles (filters + upload)
    prices.js/css       # Prices page logic & styles
    about.js/css        # About page logic & styles
    tooth-gemz.js/css   # Tooth Gemz page logic & styles
  utils/
    loader.js           # Animated progress bar overlay
    cursor.js           # Custom cursor

  fonts/                # UnifrakturMaguntia (blackletter), kenpixel
  models/               # molar_tooth.glb + Home icon row (instagram, tiktok, polaroid_camera, kitty, dollar symbol)
  photos/                # Gallery / camera-widget photos
  audio/                 # Music tracks
  videos/                # Video assets
  icons/, cursor/        # Widget icon and cursor art
  og-image.png           # Shared Open Graph / Twitter card image
```

> **Build note:** `vite.config.js` currently only lists `home`, `tooth-gemz`, and `camera` (plus the shell) as Rollup build inputs — `about.html` and `prices.html` aren't registered yet, so double-check they're included before shipping a production build.
