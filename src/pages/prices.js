import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { createStarfield, twinkleStars } from '../scene/starfield.js';
import { setupLights } from '../scene/lights.js';

(function initScene() {
  const isMobile = window.innerWidth < 768;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.4;
  renderer.domElement.style.position = 'fixed';
  renderer.domElement.style.inset = '0';
  renderer.domElement.style.zIndex = '0';
  renderer.domElement.style.pointerEvents = 'none';
  document.body.prepend(renderer.domElement);

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(isMobile ? 68 : 52, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 1.6, 7.2);
  camera.lookAt(0, isMobile ? -0.9 : 0.35, 0);

  setupLights(scene);

  const pinkLight1 = new THREE.PointLight(0xff1a6e, 6, 14);
  pinkLight1.position.set(0, 3.5, 3);
  scene.add(pinkLight1);
  const whiteSpec = new THREE.DirectionalLight(0xffffff, 5.5);
  whiteSpec.position.set(0, 8, 6);
  scene.add(whiteSpec);

  const titleSpot = new THREE.SpotLight(0xffffff, 10, 20, Math.PI / 8, 0.35, 1.5);
  titleSpot.position.set(0, 7, 5);
  titleSpot.target.position.set(0, 2.85, 0);
  scene.add(titleSpot);
  scene.add(titleSpot.target);

  const { starA, starB, starC } = createStarfield(scene);

  // CubeCamera for chrome reflections
  const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
    format: THREE.RGBAFormat,
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
  });
  const cubeCamera = new THREE.CubeCamera(0.5, 150, cubeRenderTarget);
  scene.add(cubeCamera);

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(1.0, 0.55, 0.75),
    emissive: new THREE.Color(0.4, 0.1, 0.25),
    emissiveIntensity: 0.6,
    metalness: 0.96,
    roughness: 0.04,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 3.5,
  });

  let titleMesh = null;

  const ttfLoader = new TTFLoader();
  ttfLoader.load('/assets/fonts/UnifrakturMaguntia-Regular.ttf', (json) => {
    const font = new Font(json);
    const titleGeo = new TextGeometry('Prices', {
      font,
      size: isMobile ? 0.36 : 0.52,
      depth: isMobile ? 0.07 : 0.11,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: isMobile ? 0.02 : 0.03,
      bevelSize: isMobile ? 0.014 : 0.022,
      bevelSegments: 8,
    });
    titleGeo.computeBoundingBox();
    const w = titleGeo.boundingBox.max.x - titleGeo.boundingBox.min.x;
    titleMesh = new THREE.Mesh(titleGeo, chromeMaterial);
    titleMesh.position.set(-w / 2, isMobile ? 2.7 : 2.85, 0);
    scene.add(titleMesh);
  });

  const mouse = { x: 0, y: 0 };
  window.addEventListener('mousemove', (e) => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  window.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    mouse.x =  (t.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    pinkLight1.position.x = Math.sin(t * 0.8) * 2.5;
    whiteSpec.position.x  = Math.sin(t * 0.4) * 4;

    starA.rotation.y =  t * 0.007;
    starB.rotation.y = -t * 0.004;
    starC.rotation.y =  t * 0.0025;
    starA.position.x += (mouse.x * 0.28 - starA.position.x) * 0.018;
    starA.position.y += (mouse.y * 0.18 - starA.position.y) * 0.018;
    starB.position.x += (mouse.x * 0.12 - starB.position.x) * 0.012;

    twinkleStars(starA, t);
    twinkleStars(starB, t);
    twinkleStars(starC, t);

    if (titleMesh) titleMesh.visible = false;
    cubeCamera.update(renderer, scene);
    if (titleMesh) titleMesh.visible = true;

    renderer.render(scene, camera);
  })();
})();
