import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { createStarfield } from '../scene/starfield.js';
import { setupLights } from '../scene/lights.js';

// ── Background Scene (starfield + 3D "Gallery" title) ──
(function initScene() {
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
  const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(0, 1.6, 7.2);
  camera.lookAt(0, 0.35, 0);

  setupLights(scene);

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

  const titleSpot = new THREE.SpotLight(0xffffff, 10, 20, Math.PI / 8, 0.35, 1.5);
  titleSpot.position.set(0, 7, 5);
  titleSpot.target.position.set(0, 2.85, 0);
  scene.add(titleSpot);
  scene.add(titleSpot.target);

  // Starfield
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
    color: new THREE.Color(0.8, 0.25, 0.42),
    emissive: new THREE.Color(0.25, 0.04, 0.12),
    emissiveIntensity: 0.5,
    metalness: 0.96,
    roughness: 0.04,
    envMap: cubeRenderTarget.texture,
    envMapIntensity: 3.5,
  });

  let titleMesh = null;

  const ttfLoader = new TTFLoader();
  ttfLoader.load('/assets/fonts/UnifrakturMaguntia-Regular.ttf', (json) => {
    const font = new Font(json);
    const titleGeo = new TextGeometry('Gallery', {
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

  // Mouse for star parallax
  const mouse = new THREE.Vector2(0, 0);
  window.addEventListener('mousemove', e => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });

  const clock = new THREE.Clock();
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();

    pinkLight1.position.x = Math.sin(t * 0.8) * 2.5;
    pinkLight1.position.y = 3.5 + Math.sin(t * 0.6) * 0.5;
    pinkLight2.position.z = 1 + Math.cos(t * 0.55) * 2;
    whiteSpec.position.x  = Math.sin(t * 0.4) * 4;

    starA.rotation.y =  t * 0.007;
    starB.rotation.y = -t * 0.004;
    starC.rotation.y =  t * 0.0025;
    starA.position.x += (mouse.x * 0.28 - starA.position.x) * 0.018;
    starA.position.y += (mouse.y * 0.18 - starA.position.y) * 0.018;
    starB.position.x += (mouse.x * 0.12 - starB.position.x) * 0.012;

    if (titleMesh) titleMesh.visible = false;
    cubeCamera.update(renderer, scene);
    if (titleMesh) titleMesh.visible = true;

    renderer.render(scene, camera);
  })();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();

// Custom cursor
const cursor = document.getElementById('cursor');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top  = e.clientY + 'px';
});

// Preloaded photos (served from public/assets/photos/)
const PRELOADED_PHOTOS = [
  '/assets/photos/8CE2B6A5-AC88-48CC-815C-EC62A22EAB63.jpg',
  '/assets/photos/B093A471-5528-4D7D-9DEB-462151E34212.jpg',
  '/assets/photos/IMG_0056.jpg',
  '/assets/photos/IMG_7143.jpg',
  '/assets/photos/IMG_7935.jpg',
  '/assets/photos/IMG_7937.jpg',
  '/assets/photos/IMG_7940.jpg',
  '/assets/photos/IMG_8566.jpg',
  '/assets/photos/IMG_8568.jpg',
  '/assets/photos/IMG_8576.jpg',
  '/assets/photos/IMG_8577.jpg',
  '/assets/photos/RenderedImage.JPEG',
];

// Photo gallery state
let photos = [...PRELOADED_PHOTOS];
let current = 0;

const screen      = document.getElementById('screen');
const screenPhoto = document.getElementById('screen-photo');
const screenPrompt= document.getElementById('screen-prompt');
const screenHud   = document.getElementById('screen-hud');
const photoCounter= document.getElementById('photo-counter');
const fileInput   = document.getElementById('file-input');
const arrowLeft   = document.getElementById('arrow-left');
const arrowRight  = document.getElementById('arrow-right');

function showPhoto(index) {
  if (!photos.length) return;
  current = (index + photos.length) % photos.length;
  screenPhoto.src = photos[current];
  screenPhoto.style.display = 'block';
  screenPrompt.style.display = 'none';
  screenHud.style.display = 'block';
  arrowLeft.style.display  = photos.length > 1 ? 'flex' : 'none';
  arrowRight.style.display = photos.length > 1 ? 'flex' : 'none';
  photoCounter.textContent = `${current + 1} / ${photos.length}`;
}

function clearScreen() {
  screenPhoto.style.display = 'none';
  screenPrompt.style.display = 'flex';
  screenHud.style.display = 'none';
  arrowLeft.style.display = 'none';
  arrowRight.style.display = 'none';
  photos = [];
  current = 0;
}

// Show preloaded photos immediately on load
showPhoto(0);

// Auto-rotate every 3 seconds
let slideshowTimer = setInterval(() => showPhoto(current + 1), 3000);

// Click screen to upload
screen.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', e => {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  let loaded = 0;
  const newPhotos = [];
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      newPhotos.push(ev.target.result);
      loaded++;
      if (loaded === files.length) {
        photos = photos.concat(newPhotos);
        showPhoto(photos.length - newPhotos.length);
      }
    };
    reader.readAsDataURL(file);
  });
  // reset input so same file can be re-added
  e.target.value = '';
});

function navigate(dir) {
  showPhoto(current + dir);
  // Reset auto-rotate timer on manual nav
  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = setInterval(() => showPhoto(current + 1), 3000);
  }
}

// Arrow nav (on-screen)
arrowLeft.addEventListener('click',  e => { e.stopPropagation(); navigate(-1); });
arrowRight.addEventListener('click', e => { e.stopPropagation(); navigate(1); });

// D-pad nav
document.getElementById('dpad-left') .addEventListener('click', () => navigate(-1));
document.getElementById('dpad-right').addEventListener('click', () => navigate(1));
document.getElementById('dpad-up')   .addEventListener('click', () => fileInput.click());
document.getElementById('dpad-ok')   .addEventListener('click', () => fileInput.click());

// Menu button — add more photos
document.getElementById('btn-menu').addEventListener('click', () => fileInput.click());

// Play button — toggle slideshow
document.getElementById('btn-play').addEventListener('click', () => {
  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
    return;
  }
  if (photos.length < 2) return;
  slideshowTimer = setInterval(() => showPhoto(current + 1), 2000);
});

// Keyboard nav
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
});
