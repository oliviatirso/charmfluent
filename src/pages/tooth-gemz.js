import '../style.css';
import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { createStarfield } from '../scene/starfield.js';
import { setupLights } from '../scene/lights.js';

// ── Background Scene (starfield) ──
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.inset = '0';
renderer.domElement.style.zIndex = '0';
document.body.prepend(renderer.domElement);

const scene  = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 1.6, 7.2);
camera.lookAt(0, 0.35, 0);

setupLights(scene);

// Pink lights matching homepage
const pinkLight1 = new THREE.PointLight(0xff1a6e, 6, 14);
pinkLight1.position.set(0, 3.5, 3);
scene.add(pinkLight1);
const whiteSpec = new THREE.DirectionalLight(0xffffff, 5.5);
whiteSpec.position.set(0, 8, 6);
scene.add(whiteSpec);

// Spotlight on "Tooth Gemz" title
const titleSpot = new THREE.SpotLight(0xffffff, 10, 20, Math.PI / 8, 0.35, 1.5);
titleSpot.position.set(0, 7, 5);
titleSpot.target.position.set(0, 2.85, 0);
scene.add(titleSpot);
scene.add(titleSpot.target);

// ── CubeCamera for chrome reflections ──
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512, {
  format: THREE.RGBAFormat,
  generateMipmaps: true,
  minFilter: THREE.LinearMipmapLinearFilter,
});
const cubeCamera = new THREE.CubeCamera(0.5, 150, cubeRenderTarget);
scene.add(cubeCamera);

const chromeMaterial = new THREE.MeshStandardMaterial({
  color: new THREE.Color(0.8, 0.25, 0.42),
  emissive: new THREE.Color(0.25, 0.04, 0.12),
  emissiveIntensity: 0.5,
  metalness: 0.96,
  roughness: 0.04,
  envMap: cubeRenderTarget.texture,
  envMapIntensity: 3.5,
});

// ── Chrome 3D Title ──
let titleMesh = null;
const ttfLoader = new TTFLoader();
ttfLoader.load('/assets/fonts/UnifrakturMaguntia-Regular.ttf', (json) => {
  const font = new Font(json);
  const titleGeo = new TextGeometry('Tooth Gemz', {
    font,
    size: 0.52,
    depth: 0.11,
    curveSegments: 12,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.022,
    bevelSegments: 8,
  });
  titleGeo.computeBoundingBox();
  const w = titleGeo.boundingBox.max.x - titleGeo.boundingBox.min.x;
  titleMesh = new THREE.Mesh(titleGeo, chromeMaterial);
  titleMesh.position.set(-w / 2, 2.85, 0);
  scene.add(titleMesh);
});

const { starA, starB, starC } = createStarfield(scene);

const mouse = new THREE.Vector2(0, 0);

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

  if (titleMesh) titleMesh.visible = false;
  cubeCamera.update(renderer, scene);
  if (titleMesh) titleMesh.visible = true;

  starA.rotation.y =  t * 0.007;
  starB.rotation.y = -t * 0.004;
  starC.rotation.y =  t * 0.0025;

  starA.position.x += (mouse.x * 0.28 - starA.position.x) * 0.018;
  starA.position.y += (mouse.y * 0.18 - starA.position.y) * 0.018;
  starB.position.x += (mouse.x * 0.12 - starB.position.x) * 0.012;

  renderer.render(scene, camera);
})();

window.addEventListener('mousemove', (e) => {
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});
