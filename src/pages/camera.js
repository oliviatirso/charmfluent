import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { createStarfield, twinkleStars } from '../scene/starfield.js';
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

    twinkleStars(starA, t);
    twinkleStars(starB, t);
    twinkleStars(starC, t);

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

// ── Photo gallery ──
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

let photos  = [...PRELOADED_PHOTOS];
let current = 0;

const mainPhoto    = document.getElementById('main-photo');
const filmstrip    = document.getElementById('filmstrip');
const photoCounter = document.getElementById('photo-counter');
const fileInput    = document.getElementById('file-input');

function buildFilmstrip() {
  filmstrip.innerHTML = '';
  photos.forEach((src, i) => {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.className = 'thumb' + (i === current ? ' active' : '');
    img.addEventListener('click', () => showPhoto(i));
    filmstrip.appendChild(img);
  });
}

function showPhoto(index) {
  current = (index + photos.length) % photos.length;

  mainPhoto.classList.remove('visible');
  setTimeout(() => {
    mainPhoto.src = photos[current];
    mainPhoto.onload = () => mainPhoto.classList.add('visible');
  }, 150);

  photoCounter.textContent = `${current + 1} / ${photos.length}`;

  document.querySelectorAll('.thumb').forEach((t, i) => {
    t.classList.toggle('active', i === current);
  });

  // Scroll active thumb into view
  const activeThumb = filmstrip.children[current];
  if (activeThumb) activeThumb.scrollIntoView({ inline: 'center', behavior: 'smooth' });
}

buildFilmstrip();
showPhoto(0);

// Auto-slideshow
let slideshowTimer = setInterval(() => showPhoto(current + 1), 3500);

function navigate(dir) {
  clearInterval(slideshowTimer);
  showPhoto(current + dir);
  slideshowTimer = setInterval(() => showPhoto(current + 1), 3500);
}

document.getElementById('arrow-left') .addEventListener('click', () => navigate(-1));
document.getElementById('arrow-right').addEventListener('click', () => navigate(1));

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
});
