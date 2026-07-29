import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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
  toothLabelSpot.position.set(-2.4, 4, 3);
  toothLabelSpot.target.position.set(-2.4, 1.32, 0.14);
  scene.add(toothLabelSpot);
  scene.add(toothLabelSpot.target);

  // ── Starfield ──
  const { starA, starB, starC } = createStarfield(scene);

  // ── CubeCamera for Chrome Reflections ──
  // This renders the scene into a cube texture so the text
  // reflects its surroundings in real time — that's what gives
  // the chrome/metallic mirror look.
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
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
    const titleSize  = isMobile ? 0.34 : 0.52;
    const subSize    = isMobile ? 0.12 : 0.17;
    const labelSize  = isMobile ? 0.11 : 0.15;
    const labelDepth = isMobile ? 0.015 : 0.02;

    // Desktop icon x positions (single row)
    const deskX = [-2.4, -1.2, 0, 1.2, 2.4];
    // Mobile icon x positions (row 1: tooth/insta/tiktok, row 2: polaroid/kitty)
    const mobRow1X = [-1.2, 0, 1.2]; // tooth, insta, tiktok
    const mobRow2X = [-0.6, 0.6];    // polaroid, kitty

    const iconY1 = isMobile ? 1.9  : 1.78;  // row 1 (or only row on desktop)
    const iconY2 = 0.75;                      // row 2 (mobile only)
    const labelY1 = isMobile ? 1.5  : 1.25;
    const labelY2 = 0.3;

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
    } else {
      makeLabel('Book here', deskX[0], labelY1);
      makeLabel('Instagram', deskX[1], labelY1);
      makeLabel('TikTok',    deskX[2], labelY1);
      makeLabel('Gallery',   deskX[3], labelY1);
      makeLabel('About',     deskX[4], labelY1);
    }

  });

  // ── Molar Tooth Model ──
  let toothModel = null;
  let toothMaxDim = null;
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('/assets/models/molar_tooth.glb', (gltf) => {
    toothModel = gltf.scene;
    // Measure raw size at scale=1, then apply 0.22 scale
    const rawBox = new THREE.Box3().setFromObject(toothModel);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    toothMaxDim = Math.max(rawSize.x, rawSize.y, rawSize.z) * 0.22;
    toothModel.scale.set(0.22, 0.22, 0.22);
    toothModel.position.set(isMobile ? -1.2 : -2.4, isMobile ? 1.9 : 1.78, 0.50);
    scene.add(toothModel);
    if (instaModel) matchInstaScale();
    if (tiktokModel && tiktokRawMaxDim !== null) matchTiktokScale();
    if (polaroidModel && polaroidRawMaxDim !== null) matchPolaroidScale();
    if (kittyModel && kittyRawMaxDim !== null) matchKittyScale();
  });

  // ── Instagram Model ──
  let instaModel = null;
  function matchInstaScale() {
    const rawBox = new THREE.Box3().setFromObject(instaModel);
    rawBox.expandByObject(instaModel);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const maxRaw = Math.max(rawSize.x, rawSize.y, rawSize.z) || 1;
    const s = (toothMaxDim / maxRaw) * 0.85;
    instaModel.scale.set(s, s, s);
  }
  gltfLoader.load('/assets/models/instagram.glb', (gltf) => {
    instaModel = new THREE.Group();
    const instaScene = gltf.scene;
    // Center the model so it spins around its own center
    const centerBox = new THREE.Box3().setFromObject(instaScene);
    const center = centerBox.getCenter(new THREE.Vector3());
    instaScene.position.sub(center);
    instaModel.add(instaScene);
    instaModel.position.set(isMobile ? 0 : -1.2, isMobile ? 1.9 : 1.78, 0.50);
    scene.add(instaModel);
    if (toothMaxDim !== null) matchInstaScale();
  });

  // ── TikTok Model ──
  let tiktokModel = null;
  let tiktokRawMaxDim = null;
  function matchTiktokScale() {
    const s = toothMaxDim / tiktokRawMaxDim;
    tiktokModel.scale.set(s, s, s);
  }
  gltfLoader.load('/assets/models/tiktok_logo.glb', (gltf) => {
    tiktokModel = new THREE.Group();
    const tiktokScene = gltf.scene;
    const centerBox = new THREE.Box3().setFromObject(tiktokScene);
    const center = centerBox.getCenter(new THREE.Vector3());
    tiktokScene.position.sub(center);
    tiktokRawMaxDim = Math.max(...centerBox.getSize(new THREE.Vector3()).toArray()) || 1;
    tiktokModel.add(tiktokScene);
    tiktokModel.position.set(isMobile ? 1.2 : 0, isMobile ? 1.9 : 1.78, 0.50);
    scene.add(tiktokModel);
    if (toothMaxDim !== null) matchTiktokScale();
  });

  // ── Polaroid Camera Model ──
  let polaroidModel = null;
  let polaroidRawMaxDim = null;
  function matchPolaroidScale() {
    const s = toothMaxDim / polaroidRawMaxDim;
    polaroidModel.scale.set(s, s, s);
  }
  gltfLoader.load('/assets/models/polaroid_camera.glb', (gltf) => {
    polaroidModel = new THREE.Group();
    const polaroidScene = gltf.scene;
    const centerBox = new THREE.Box3().setFromObject(polaroidScene);
    const center = centerBox.getCenter(new THREE.Vector3());
    polaroidScene.position.sub(center);
    polaroidRawMaxDim = Math.max(...centerBox.getSize(new THREE.Vector3()).toArray()) || 1;
    polaroidModel.add(polaroidScene);
    polaroidModel.position.set(isMobile ? -0.6 : 1.2, isMobile ? 0.75 : 1.78, 0.50);
    scene.add(polaroidModel);
    if (toothMaxDim !== null) matchPolaroidScale();
  });

  // ── Kitty (About) Model ──
  let kittyModel = null;
  let kittyRawMaxDim = null;
  function matchKittyScale() {
    const s = toothMaxDim / kittyRawMaxDim;
    kittyModel.scale.set(s, s, s);
  }
  gltfLoader.load('/assets/models/kitty.glb', (gltf) => {
    kittyModel = new THREE.Group();
    const kittyScene = gltf.scene;
    const centerBox = new THREE.Box3().setFromObject(kittyScene);
    const center = centerBox.getCenter(new THREE.Vector3());
    kittyScene.position.sub(center);
    kittyRawMaxDim = Math.max(...centerBox.getSize(new THREE.Vector3()).toArray()) || 1;
    kittyModel.add(kittyScene);
    kittyModel.position.set(isMobile ? 0.6 : 2.4, isMobile ? 0.75 : 1.78, 0.50);
    scene.add(kittyModel);
    if (toothMaxDim !== null) matchKittyScale();
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
    const t = e.changedTouches[0];
    mouse.x =  (t.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
    fireRaycast();
  });

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
    if (polaroidModel) {
      const hits = raycaster.intersectObject(polaroidModel, true);
      if (hits.length > 0) { window.location.href = '/pages/camera.html'; return; }
    }
    if (kittyModel) {
      const hits = raycaster.intersectObject(kittyModel, true);
      if (hits.length > 0) { window.location.href = '/pages/about.html'; return; }
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

  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    // Animate lights for a dynamic chrome shimmer
    pinkLight1.position.x = Math.sin(t * 0.8) * 2.5;
    pinkLight1.position.y = 3.5 + Math.sin(t * 0.6) * 0.5;
    pinkLight2.position.z = 1 + Math.cos(t * 0.55) * 2;
    whiteSpec.position.x  = Math.sin(t * 0.4) * 4;

    // Constant spin
    textGroup.rotation.y = t * 0.3;
    textGroup.rotation.x = Math.sin(t * 0.3) * 0.04;

    // ── CubeCamera update (the key to chrome reflections) ──
    // Hide text meshes briefly so they don't reflect themselves
    if (textMesh) textMesh.visible = false;
    if (subMesh)  subMesh.visible  = false;

    cubeCamera.update(renderer, scene);

    if (textMesh) textMesh.visible = true;
    if (subMesh)  subMesh.visible  = true;

    // Tooth rotation
    if (toothModel) toothModel.rotation.y = t * 0.4;
    if (instaModel) instaModel.rotation.y = t * 0.4;
    if (tiktokModel) tiktokModel.rotation.y = t * 0.4;
    if (polaroidModel) polaroidModel.rotation.y = t * 0.4;
    if (kittyModel) kittyModel.rotation.y = t * 0.4;

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