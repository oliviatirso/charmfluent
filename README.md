# Charmfluent

Business website for **Charmfluent** — a custom tooth gems & grillz brand. Clients can browse the artist's content, explore products, and book appointments. Built with Three.js and Vite.

## Features

- Animated 3D starfield with mouse parallax
- Rotating molar tooth GLB model (click to explore Tooth Gemz)
- Chrome 3D text rendered with `TextGeometry` and `UnifrakturMaguntia` blackletter font
- Persistent music player widget (iPod-style)
- Persistent camera/photo widget (Sony DSC-style) with auto-rotating gallery
- Multi-page app: Home, Tooth Gemz, Camera Gallery
- Appointment booking for clients
- Artist content showcase (photos, video, gallery)
- Custom pink glowing cursor

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
  tooth-gemz.html       # Tooth Gemz product page
src/
  main.js               # Entry: loader → Three.js scene
  style.css             # Global styles
  scene/
    scene.js            # Three.js renderer, camera, animation loop, tooth model
    starfield.js        # Three-layer star field
    lights.js           # Three-point lighting
  player/
    player.js/css       # Music player widget
    cam-widget.js/css   # Camera/photo widget
  pages/
    camera.js/css       # Gallery page logic & styles
    tooth-gemz.js/css   # Tooth Gemz page logic & styles
  utils/
    loader.js           # Animated progress bar overlay
    cursor.js           # Custom cursor
public/assets/
  fonts/                # UnifrakturMaguntia (blackletter), kenpixel
  models/               # molar_tooth.glb
  photos/               # Gallery photos
  audio/                # Music tracks
  videos/               # Video assets
```
