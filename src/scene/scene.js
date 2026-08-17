import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createStarfield, twinkleStars } from './starfield.js';
import { setupLights } from './lights.js';

export function initScene() {
  const isMobile = window.innerWidth < 768;

  // ── Renderer ──
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  document.body.appendChild(renderer.domElement);

  // ── Scene + Camera ──
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    isMobile ? 68 : 52,
    window.innerWidth / window.innerHeight, 0.1, 200
  );
  camera.position.set(0, 1.6, 7.2);
  camera.lookAt(0, isMobile ? -0.9 : 0.35, 0);

  // ── Lights (call before CubeCamera so reflections pick them up) ──
  setupLights(scene);

  // Extra pink-hot fill lights to enhance the chrome chrome-pink look
  const pinkLight1 = new THREE.PointLight(0xff1a6e, 6, 14);
  pinkLight1.position.set(0, 3.5, 3);
  scene.add(pinkLight1);

  const pinkLight2 = new THREE.PointLight(0xff88cc, 3.5, 12);
  pinkLight2.position.set(-3, 2, 1);
  scene.add(pinkLight2);

  const whiteSpec = new THREE.DirectionalLight(0xffffff, 5.5);
  whiteSpec.position.set(0, 8, 6);
  scene.add(whiteSpec);

  const rimPink = new THREE.PointLight(0xcc0044, 4, 10);
  rimPink.position.set(3, 1, -2);
  scene.add(rimPink);

  // ── Spotlights on text elements ──
  // Title "Charmfluent"
  const titleSpot = new THREE.SpotLight(0xffffff, 10, 20, Math.PI / 8, 0.35, 1.5);
  titleSpot.position.set(0, 7, 5);
  titleSpot.target.position.set(0, 2.85, 0);
  scene.add(titleSpot);
  scene.add(titleSpot.target);

  // Subtitle "Custom Grillz & Tooth Charms"
  const subSpot = new THREE.SpotLight(0xff88cc, 2.5, 18, Math.PI / 7, 0.45, 1.5);
  subSpot.position.set(0, 6, 5);
  subSpot.target.position.set(0, 2.44, 0);
  scene.add(subSpot);
  scene.add(subSpot.target);

  // "Tooth Gemz" label under the tooth
  const toothLabelSpot = new THREE.SpotLight(0xffd700, 3, 12, Math.PI / 6, 0.4, 1.5);
  toothLabelSpot.position.set(-2.5, 4, 3);
  toothLabelSpot.target.position.set(-2.5, 1.32, 0.14);
  scene.add(toothLabelSpot);
  scene.add(toothLabelSpot.target);

  // ── Starfield ──
  const { starA, starB, starC } = createStarfield(scene);

  // ── Models group — rotate all icons together ──
  const modelsGroup = new THREE.Group();
  scene.add(modelsGroup);

  // ── CubeCamera for Chrome Reflections ──
  // This renders the scene into a cube texture so the text
  // reflects its surroundings in real time — that's what gives
  // the chrome/metallic mirror look.
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(isMobile ? 256 : 512, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.5, 150, cubeRenderTarget);
  scene.add(cubeCamera);

  // ── Chrome Pink Materials ──
  // Main chrome title material — deep rose chrome with white bevel highlights
  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(1.0, 0.55, 0.75),     // light pink
    emissive: new THREE.Color(0.4, 0.1, 0.25),  // soft pink glow
    emissiveIntensity: 0.6,
    metalness: 0.96,
    roughness: 0.04,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 3.5,
  });

  // Subtle sub-text material — lighter chrome, hot-pink tint
  const subChromeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(1.0, 0.65, 0.82),
    metalness: 0.9,
    roughness: 0.1,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 1.6,
  });

  // ── 3D Text Group ──
  const textGroup = new THREE.Group();
  scene.add(textGroup);

  // Track meshes so we can hide them during cube render
  let textMesh = null;
  let subMesh  = null;

  // ── Font Loading ──
  // SETUP INSTRUCTIONS:
  //   1. Go to: https://fonts.google.com/specimen/UnifrakturMaguntia
  //   2. Click "Download family" → extract the .ttf file
  //   3. Place it at: /public/fonts/UnifrakturMaguntia.ttf
  //      (or wherever your /fonts/ folder lives)
  //   4. Update the path below if needed
  //
  // Alternative blackletter fonts that also work great:
  //   - Deutsch.ttf  (very similar to the screenshot)
  //   - OldLondon.ttf
  //   - MedievalSharp.ttf
  //
  const ttfLoader = new TTFLoader();

  ttfLoader.load('/assets/fonts/UnifrakturMaguntia-Regular.ttf', (json) => {
    const font = new Font(json);

    // ── Layout config ──
    const titleSize  = isMobile ? 0.42 : 0.52;
    const subSize    = isMobile ? 0.15 : 0.17;
    const labelSize  = isMobile ? 0.14 : 0.15;
    const labelDepth = isMobile ? 0.018 : 0.02;

    // Desktop icon x positions (single row, 6 items centered with 1.0 spacing)
    const deskX = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5];
    // Mobile icon x positions (row 1: tooth/insta/tiktok, row 2: polaroid/kitty/dollar)
    const mobRow1X = [-1.2, 0, 1.2]; // tooth, insta, tiktok
    const mobRow2X = [-1.2, 0, 1.2]; // polaroid, kitty, dollar

    const iconY1 = isMobile ? 1.9  : 1.78;  // row 1 (or only row on desktop)
    const iconY2 = 0.75;                      // row 2 (mobile only)
    const labelY1 = isMobile ? FLOOR_Y - 0.38 : 1.2;
    const labelY2 = isMobile ? FLOOR_Y_ROW2 - 0.38 : 0.1;

    // ── Main Title: "Charmfluent" ──
    const titleGeo = new TextGeometry('Charmfluent', {
      font,
      size: titleSize,
      depth: isMobile ? 0.07 : 0.11,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: isMobile ? 0.02 : 0.03,
      bevelSize: isMobile ? 0.015 : 0.022,
      bevelSegments: 8,
    });

    titleGeo.computeBoundingBox();
    const titleWidth  = titleGeo.boundingBox.max.x - titleGeo.boundingBox.min.x;
    const centerOffset = -0.5 * titleWidth;

    textMesh = new THREE.Mesh(titleGeo, chromeMaterial);
    textMesh.position.set(centerOffset, isMobile ? 2.7 : 2.85, 0);
    textGroup.add(textMesh);

    // ── Subtitle ──
    const subGeo = new TextGeometry('Custom Grillz & Tooth Charms', {
      font,
      size: subSize,
      depth: isMobile ? 0.018 : 0.028,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: isMobile ? 0.005 : 0.008,
      bevelSize: isMobile ? 0.003 : 0.005,
      bevelSegments: 3,
    });

    subGeo.computeBoundingBox();
    const subWidth = subGeo.boundingBox.max.x - subGeo.boundingBox.min.x;
    const subOffset = -0.5 * subWidth;

    subMesh = new THREE.Mesh(subGeo, subChromeMaterial);
    subMesh.position.set(subOffset, isMobile ? 2.38 : 2.44, 0);
    textGroup.add(subMesh);

    // Helper to make a label mesh
    function makeLabel(text, xAnchor, yPos) {
      const geo = new TextGeometry(text, {
        font,
        size: labelSize,
        depth: labelDepth,
        curveSegments: 8,
        bevelEnabled: true,
        bevelThickness: 0.006,
        bevelSize: 0.004,
        bevelSegments: 3,
      });
      geo.computeBoundingBox();
      const w = geo.boundingBox.max.x - geo.boundingBox.min.x;
      const mesh = new THREE.Mesh(geo, subChromeMaterial);
      mesh.position.set(xAnchor - w / 2, yPos, 0.50);
      scene.add(mesh);
    }

    if (isMobile) {
      makeLabel('Book here', mobRow1X[0], labelY1);
      makeLabel('Instagram', mobRow1X[1], labelY1);
      makeLabel('TikTok',    mobRow1X[2], labelY1);
      makeLabel('Gallery',   mobRow2X[0], labelY2);
      makeLabel('About',     mobRow2X[1], labelY2);
      makeLabel('Prices',    mobRow2X[2], labelY2);
    } else {
      makeLabel('Book here', deskX[0], labelY1);
      makeLabel('Instagram', deskX[1], labelY1);
      makeLabel('TikTok',    deskX[2], labelY1);
      makeLabel('Gallery',   deskX[3], labelY1);
      makeLabel('About',     deskX[4], labelY1);
      makeLabel('Prices',    deskX[5], labelY1);
    }

  });

  // ── Reveal all models together once every one is loaded & scaled ──
  let toothReady = false, instaReady = false, tiktokReady = false, polaroidReady = false, kittyReady = false, dollarReady = false;
  let revealed = false;
  let revealT  = 0;
  function revealAll() {
    if (revealed) return;
    revealed = true;
    revealT = clock.getElapsedTime(); // all icons start spinning from 0 at this moment
    if (toothModel)    toothModel.visible    = true;
    if (instaModel)    instaModel.visible    = true;
    if (tiktokModel)   tiktokModel.visible   = true;
    if (polaroidModel) polaroidModel.visible = true;
    if (kittyModel)    kittyModel.visible    = true;
    if (dollarModel)   dollarModel.visible   = true;
  }
  function checkReveal() {
    if (toothReady && instaReady && tiktokReady && polaroidReady && kittyReady && dollarReady) revealAll();
  }
  // Fallback: show whatever loaded after 8 seconds (handles slow/failed loads on mobile)
  setTimeout(revealAll, 8000);

  // ── Molar Tooth Model ──
  let toothModel = null;
  let toothMaxDim = null;
  const gltfLoader = new GLTFLoader();
  gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  // Floor Y: the Y where all model bottoms will sit
  const FLOOR_Y      = isMobile ? 1.2 : 1.5;    // row 1 (desktop uses this for all)
  const FLOOR_Y_ROW2 = isMobile ? -0.2 : 0.45;   // mobile row 2 only

gltfLoader.load('/assets/models/molar_tooth.glb', (gltf) => {
    toothModel = gltf.scene;
    // Measure raw size at scale=1, then apply scale
    const toothScale = isMobile ? 0.32 : 0.22;
    const rawBox = new THREE.Box3().setFromObject(toothModel);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    toothMaxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) * toothScale;
    toothModel.rotation.set(0, 0, 0);
    toothModel.scale.set(toothScale, toothScale, toothScale);
    // Bottom-align: place so model bottom sits at FLOOR_Y
    const toothBottomY = FLOOR_Y - rawBox.min.y * toothScale;
    toothModel.position.set(isMobile ? -1.2 : -2.5, toothBottomY, 0.50);
    toothModel.visible = false;
    modelsGroup.add(toothModel);
    toothReady = true;
    if (instaModel) matchInstaScale();
    if (tiktokModel && tiktokRawMaxDim !== null) matchTiktokScale();
    if (polaroidModel && polaroidRawMaxDim !== null) matchPolaroidScale();
    if (kittyModel && kittyRawMaxDim !== null) matchKittyScale();
    if (dollarModel && dollarRawMaxDim !== null) matchDollarScale();
    checkReveal();
  });

  // ── Instagram Model ──
  let instaModel = null;
  let instaHalfH = 0;
  function matchInstaScale() {
    const rawBox = new THREE.Box3().setFromObject(instaModel);
    rawBox.expandByObject(instaModel);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const maxRaw = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
    const s = (toothMaxDim / maxRaw) * 0.85;
    instaModel.scale.set(s, s, s);
    instaModel.position.y = FLOOR_Y + instaHalfH * s;
    instaReady = true;
    checkReveal();
  }
  gltfLoader.load('/assets/models/instagram.glb', (gltf) => {
    instaModel = new THREE.Group();
    const instaScene = gltf.scene;
    instaScene.rotation.set(0, 0, 0);
    const centerBox = new THREE.Box3().setFromObject(instaScene);
    const center = centerBox.getCenter(new THREE.Vector3());
    instaScene.position.sub(center);
    instaHalfH = centerBox.getSize(new THREE.Vector3()).y / 2;
    instaModel.add(instaScene);
    instaModel.position.set(isMobile ? 0 : -1.5, 0, 0.50);
    instaModel.visible = false;
    modelsGroup.add(instaModel);
    if (toothMaxDim !== null) matchInstaScale();
  });

  // ── TikTok Model ──
  let tiktokModel = null;
  let tiktokRawMaxDim = null;
  let tiktokHalfH = 0;
  function matchTiktokScale() {
    const s = toothMaxDim / tiktokRawMaxDim;
    tiktokModel.scale.set(s, s, s);
    tiktokModel.position.y = FLOOR_Y + tiktokHalfH * s;
    tiktokReady = true;
    checkReveal();
  }
  gltfLoader.load('/assets/models/tiktok_logo.glb', (gltf) => {
    tiktokModel = new THREE.Group();
    const tiktokScene = gltf.scene;
    tiktokScene.rotation.set(0, 0, 0);
    const centerBox = new THREE.Box3().setFromObject(tiktokScene);
    const center = centerBox.getCenter(new THREE.Vector3());
    tiktokScene.position.sub(center);
    const tiktokSize = centerBox.getSize(new THREE.Vector3());
    tiktokRawMaxDim = Math.max(tiktokSize.x, tiktokSize.y, tiktokSize.z) || 1;
    tiktokHalfH = tiktokSize.y / 2;
    tiktokModel.add(tiktokScene);
    tiktokModel.position.set(isMobile ? 1.2 : -0.5, 0, 0.50);
    tiktokModel.visible = false;
    modelsGroup.add(tiktokModel);
    if (toothMaxDim !== null) matchTiktokScale();
  });

  // ── Polaroid Camera Model ──
  let polaroidModel = null;
  let polaroidRawMaxDim = null;
  let polaroidHalfH = 0;
  function matchPolaroidScale() {
    const s = toothMaxDim / polaroidRawMaxDim;
    polaroidModel.scale.set(s, s, s);
    const floorY = isMobile ? FLOOR_Y_ROW2 : FLOOR_Y;
    polaroidModel.position.y = floorY + polaroidHalfH * s;
    polaroidReady = true;
    checkReveal();
  }
  gltfLoader.load('/assets/models/polaroid_camera.glb', (gltf) => {
    polaroidModel = new THREE.Group();
    const polaroidScene = gltf.scene;
    polaroidScene.rotation.set(0, 0, 0);
    const centerBox = new THREE.Box3().setFromObject(polaroidScene);
    const center = centerBox.getCenter(new THREE.Vector3());
    polaroidScene.position.sub(center);
    const polaroidSize = centerBox.getSize(new THREE.Vector3());
    polaroidRawMaxDim = Math.max(polaroidSize.x, polaroidSize.y, polaroidSize.z) || 1;
    polaroidHalfH = polaroidSize.y / 2;
    polaroidModel.add(polaroidScene);
    polaroidModel.position.set(isMobile ? -1.2 : 0.5, 0, 0.50);
    polaroidModel.visible = false;
    modelsGroup.add(polaroidModel);
    if (toothMaxDim !== null) matchPolaroidScale();
  });

  // ── Kitty (About) Model ──
  let kittyModel = null;
  let kittyRawMaxDim = null;
  let kittyHalfH = 0;
  function matchKittyScale() {
    const s = toothMaxDim / kittyRawMaxDim;
    kittyModel.scale.set(s, s, s);
    const floorY = isMobile ? FLOOR_Y_ROW2 : FLOOR_Y;
    kittyModel.position.y = floorY + kittyHalfH * s;
    kittyReady = true;
    checkReveal();
  }
  gltfLoader.load('/assets/models/kitty.glb', (gltf) => {
    kittyModel = new THREE.Group();
    const kittyScene = gltf.scene;
    kittyScene.rotation.set(0, 0, 0);
    const centerBox = new THREE.Box3().setFromObject(kittyScene);
    const center = centerBox.getCenter(new THREE.Vector3());
    kittyScene.position.sub(center);
    const kittySize = centerBox.getSize(new THREE.Vector3());
    kittyRawMaxDim = Math.max(kittySize.x, kittySize.y, kittySize.z) || 1;
    kittyHalfH = kittySize.y / 2;
    kittyModel.add(kittyScene);
    kittyModel.position.set(isMobile ? 0 : 1.5, 0, 0.50);
    kittyModel.visible = false;
    modelsGroup.add(kittyModel);
    if (toothMaxDim !== null) matchKittyScale();
  });

  // ── Dollar Symbol (Prices) Model ──
  let dollarModel = null;
  let dollarRawMaxDim = null;
  let dollarHalfH = 0;
  function matchDollarScale() {
    const s = toothMaxDim / dollarRawMaxDim;
    dollarModel.scale.set(s, s, s);
    const floorY = isMobile ? FLOOR_Y_ROW2 : FLOOR_Y;
    dollarModel.position.y = floorY + dollarHalfH * s;
    dollarReady = true;
    checkReveal();
  }
  gltfLoader.load('/assets/models/low_poly_dollar_symbol.glb', (gltf) => {
    dollarModel = new THREE.Group();
    const dollarScene = gltf.scene;
    // Straighten any baked-in tilt from the GLB (including child nodes)
    dollarScene.traverse((node) => { node.rotation.set(0, 0, 0); });
    const centerBox = new THREE.Box3().setFromObject(dollarScene);
    const center = centerBox.getCenter(new THREE.Vector3());
    dollarScene.position.sub(center);
    const dollarSize = centerBox.getSize(new THREE.Vector3());
    dollarRawMaxDim = Math.max(dollarSize.x, dollarSize.y, dollarSize.z) || 1;
    dollarHalfH = dollarSize.y / 2;
    dollarModel.add(dollarScene);
    dollarModel.position.set(isMobile ? 1.2 : 2.5, 0, 0.50);
    dollarModel.visible = false;
    modelsGroup.add(dollarModel);
    if (toothMaxDim !== null) matchDollarScale();
  });

  // ── Mouse / Touch tracking ──
  const mouse = new THREE.Vector2(-10, -10);
  window.addEventListener('mousemove', (e) => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    mouse.x =  (t.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  // ── Click / Tap detection ──
  const raycaster = new THREE.Raycaster();

  renderer.domElement.addEventListener('touchend', (e) => {
    if (e.changedTouches.length === 0) return;
    e.preventDefault(); // stop browser synthesizing a click after touchend
    const t = e.changedTouches[0];
    mouse.x =  (t.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
    fireRaycast();
  }, { passive: false });

  function fireRaycast() {
    raycaster.setFromCamera(mouse, camera);
    if (toothModel) {
      const hits = raycaster.intersectObject(toothModel, true);
      if (hits.length > 0) { window.open('https://venue.ink/@charmfluent', '_blank'); return; }
    }
    if (instaModel) {
      const hits = raycaster.intersectObject(instaModel, true);
      if (hits.length > 0) { window.open('https://www.instagram.com/charmfluent', '_blank'); return; }
    }
    if (tiktokModel) {
      const hits = raycaster.intersectObject(tiktokModel, true);
      if (hits.length > 0) { window.open('https://www.tiktok.com/@charmfluent', '_blank'); return; }
    }
    if (polaroidModel) {
      const hits = raycaster.intersectObject(polaroidModel, true);
      if (hits.length > 0) { window.location.href = '/pages/camera.html'; return; }
    }
    if (kittyModel) {
      const hits = raycaster.intersectObject(kittyModel, true);
      if (hits.length > 0) { window.location.href = '/pages/about.html'; return; }
    }
    if (dollarModel) {
      const hits = raycaster.intersectObject(dollarModel, true);
      if (hits.length > 0) { window.location.href = '/pages/prices.html'; return; }
    }
  }

  renderer.domElement.addEventListener('click', fireRaycast);

  // ── Drag-to-spin ──
  let targetRotation = 0;
  let targetRotationOnPointerDown = 0;
  let pointerXOnPointerDown = 0;
  let windowHalfX = window.innerWidth / 2;

  renderer.domElement.addEventListener('pointerdown', (e) => {
    if (e.isPrimary === false) return;
    pointerXOnPointerDown = e.clientX - windowHalfX;
    targetRotationOnPointerDown = targetRotation;

    const onMove = (e) => {
      if (e.isPrimary === false) return;
      targetRotation = targetRotationOnPointerDown +
        (e.clientX - windowHalfX - pointerXOnPointerDown) * 0.02;
    };
    const onUp = (e) => {
      if (e.isPrimary === false) return;
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });

  // ── Resize ──
  window.addEventListener('resize', () => {
    windowHalfX = window.innerWidth / 2;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ── Animation Loop ──
  const clock = new THREE.Clock();
  let frameCount = 0;

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    frameCount++;

    // Animate lights for a dynamic chrome shimmer
    pinkLight1.position.x = Math.sin(t * 0.8) * 2.5;
    pinkLight1.position.y = 3.5 + Math.sin(t * 0.6) * 0.5;
    pinkLight2.position.z = 1 + Math.cos(t * 0.55) * 2;
    whiteSpec.position.x  = Math.sin(t * 0.4) * 4;

    // ── CubeCamera update (the key to chrome reflections) ──
    // On mobile, only update every 3rd frame to save GPU time
    if (!isMobile || frameCount % 3 === 0) {
      if (textMesh) textMesh.visible = false;
      if (subMesh)  subMesh.visible  = false;

      cubeCamera.update(renderer, scene);

      if (textMesh) textMesh.visible = true;
      if (subMesh)  subMesh.visible  = true;
    }

    // Tooth rotation
    const spinAngle = (t - revealT) * 0.4;
    if (toothModel)    toothModel.rotation.y    = spinAngle;
    if (instaModel)    instaModel.rotation.y    = spinAngle;
    if (tiktokModel)   tiktokModel.rotation.y   = spinAngle;
    if (polaroidModel) polaroidModel.rotation.y = spinAngle;
    if (kittyModel)    kittyModel.rotation.y    = spinAngle;
    if (dollarModel)   dollarModel.rotation.y   = spinAngle;

    // Star animation
    starA.rotation.y =  t * 0.007;
    starB.rotation.y = -t * 0.004;
    starC.rotation.y =  t * 0.0025;

    starA.position.x += (mouse.x * 0.28 - starA.position.x) * 0.018;
    starA.position.y += (mouse.y * 0.18 - starA.position.y) * 0.018;
    starB.position.x += (mouse.x * 0.12 - starB.position.x) * 0.012;

    // Per-star twinkle via vertex colors
    twinkleStars(starA, t);
    twinkleStars(starB, t);
    twinkleStars(starC, t);

    renderer.render(scene, camera);
  })();
}