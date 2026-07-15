import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createStarfield } from './starfield.js';
import { setupLights } from './lights.js';

export function initScene() {
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
  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 1.6, 7.2);
  camera.lookAt(0, 0.35, 0);

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
  toothLabelSpot.position.set(-0.52, 4, 3);
  toothLabelSpot.target.position.set(-0.52, 1.32, 0.14);
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
    color: new THREE.Color(0.8, 0.25, 0.42),     // darker pink
    emissive: new THREE.Color(0.25, 0.04, 0.12), // soft pink glow
    emissiveIntensity: 0.5,
    metalness: 0.96,
    roughness: 0.04,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 3.5,
  });

  // Subtle sub-text material — lighter chrome, hot-pink tint
  const subChromeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(1.0, 0.35, 0.6),
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

    // ── Main Title: "Charmfluent" ──
    const titleGeo = new TextGeometry('Charmfluent', {
      font,
      size: 0.52,
      depth: 0.11,
      curveSegments: 12,   // smooth curves on the ornate letterforms
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.022,
      bevelSegments: 8,
    });

    titleGeo.computeBoundingBox();
    const titleWidth  = titleGeo.boundingBox.max.x - titleGeo.boundingBox.min.x;
    const centerOffset = -0.5 * titleWidth;

    textMesh = new THREE.Mesh(titleGeo, chromeMaterial);
    textMesh.position.set(centerOffset, 2.85, 0);
    textGroup.add(textMesh);


    // ── Subtitle ──
    const subGeo = new TextGeometry('Custom Grillz & Tooth Charms', {
      font,
      size: 0.17,
      depth: 0.028,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: 0.008,
      bevelSize: 0.005,
      bevelSegments: 3,
    });

    subGeo.computeBoundingBox();
    const subWidth = subGeo.boundingBox.max.x - subGeo.boundingBox.min.x;
    const subOffset = -0.5 * subWidth;

    subMesh = new THREE.Mesh(subGeo, subChromeMaterial);
    subMesh.position.set(subOffset, 2.44, 0);
    textGroup.add(subMesh);

    // ── Tooth Gemz Label ──
    const toothLabelGeo = new TextGeometry('Tooth Gemz', {
      font,
      size: 0.13,
      depth: 0.02,
      curveSegments: 8,
      bevelEnabled: true,
      bevelThickness: 0.006,
      bevelSize: 0.004,
      bevelSegments: 3,
    });

    toothLabelGeo.computeBoundingBox();
    const labelWidth = toothLabelGeo.boundingBox.max.x - toothLabelGeo.boundingBox.min.x;
    const toothLabelMesh = new THREE.Mesh(toothLabelGeo, subChromeMaterial);
    toothLabelMesh.position.set(-0.52 - labelWidth / 2, 1.32, 0.14);
    scene.add(toothLabelMesh);

  });

  // ── Molar Tooth Model ──
  let toothModel = null;
  const gltfLoader = new GLTFLoader();
  gltfLoader.load('/assets/models/molar_tooth.glb', (gltf) => {
    toothModel = gltf.scene;
    toothModel.scale.set(0.22, 0.22, 0.22);
    toothModel.position.set(-0.52, 1.88, 0.14);
    scene.add(toothModel);
  });


  // ── Chroma Key Video ──
  const video = document.createElement('video');
  video.src = '/assets/videos/FINALvideo.mp4';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = 'anonymous';
  video.play();

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBAFormat;

  const chromaKeyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      map:        { value: videoTexture },
      keyColor:   { value: new THREE.Color(0x00ff00) },
      similarity: { value: 0.30 },
      smoothness: { value: 0.08 },
      spill:      { value: 0.15 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec3 keyColor;
      uniform float similarity;
      uniform float smoothness;
      uniform float spill;
      varying vec2 vUv;

      void main() {
        vec4 tex = texture2D(map, vUv);

        float Y   = 0.2989 * tex.r + 0.5866 * tex.g + 0.1145 * tex.b;
        float Cr  = 0.7132 * (tex.r - Y);
        float Cb  = 0.5647 * (tex.b - Y);

        float keyY  = 0.2989 * keyColor.r + 0.5866 * keyColor.g + 0.1145 * keyColor.b;
        float keyCr = 0.7132 * (keyColor.r - keyY);
        float keyCb = 0.5647 * (keyColor.b - keyY);

        float dist  = distance(vec2(Cr, Cb), vec2(keyCr, keyCb));
        float alpha = smoothstep(similarity, similarity + smoothness, dist);

        vec3 color = tex.rgb;
        float spillAmount = smoothstep(similarity + smoothness, similarity, dist) * spill;
        color.g -= spillAmount * 0.5;

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });

  const videoPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 3.2),
    chromaKeyMaterial
  );
  videoPlane.position.set(0, 0.35, 0.5);
  scene.add(videoPlane);

  // ── Mouse tracking ──
  const mouse = new THREE.Vector2(-10, -10);
  window.addEventListener('mousemove', (e) => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  // ── Click detection ──
  const raycaster = new THREE.Raycaster();
  renderer.domElement.addEventListener('click', () => {
    if (!toothModel) return;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(toothModel, true);
    if (hits.length > 0) window.location.href = '/pages/tooth-gemz.html';
  });

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

    // Text spin (drag or slow auto-rotate)
    textGroup.rotation.y += (targetRotation - textGroup.rotation.y) * 0.05;
    // Gentle auto-tilt for depth
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

    // Star animation
    starA.rotation.y =  t * 0.007;
    starB.rotation.y = -t * 0.004;
    starC.rotation.y =  t * 0.0025;

    starA.position.x += (mouse.x * 0.28 - starA.position.x) * 0.018;
    starA.position.y += (mouse.y * 0.18 - starA.position.y) * 0.018;
    starB.position.x += (mouse.x * 0.12 - starB.position.x) * 0.012;

    renderer.render(scene, camera);
  })();
}