import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { createStarfield, twinkleStars } from '../scene/starfield.js';
import { setupLights } from '../scene/lights.js';

// ── Background Scene (starfield + 3D "Gallery" title) ──
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
    const titleGeo = new TextGeometry('Gallery', {
      font,
      size: isMobile ? 0.68 : 1.02,
      depth: isMobile ? 0.13 : 0.20,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: isMobile ? 0.026 : 0.038,
      bevelSize: isMobile ? 0.018 : 0.028,
      bevelSegments: 8,
    });
    titleGeo.computeBoundingBox();
    const w = titleGeo.boundingBox.max.x - titleGeo.boundingBox.min.x;
    titleMesh = new THREE.Mesh(titleGeo, chromeMaterial);
    titleMesh.position.set(-w / 2, isMobile ? 2.3 : 2.55, 0);
    scene.add(titleMesh);
  });

  // Mouse / touch for star parallax
  const mouse = new THREE.Vector2(0, 0);
  window.addEventListener('mousemove', e => {
    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  });
  window.addEventListener('touchmove', e => {
    const t = e.touches[0];
    mouse.x =  (t.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(t.clientY / window.innerHeight) * 2 + 1;
  }, { passive: true });

  function transitionTo(url) {
    window.parent.postMessage('cf:out', '*');
    setTimeout(function () { window.location.href = url; }, 270);
  }
  const backBtn = document.getElementById('back-btn');
  if (backBtn) backBtn.addEventListener('click', function (e) { e.preventDefault(); transitionTo('/pages/home.html'); });

  const clock = new THREE.Clock();
  let readySignalled = false;
  (function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    if (!readySignalled) { readySignalled = true; window.parent.postMessage('cf:ready', '*'); }

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
  // ── Grillz ──
  { src: '/assets/photos/grills/IMG_7936.jpg',       category: 'grills' },
  { src: '/assets/photos/grills/IMG_8569.jpg',       category: 'grills' },
  { src: '/assets/photos/grills/IMG_7143.jpg',       category: 'grills' },
  { src: '/assets/photos/grills/IMG_7935.jpg',       category: 'grills' },
  { src: '/assets/photos/grills/IMG_7937.jpg',       category: 'grills' },
  { src: '/assets/photos/grills/IMG_7940.jpg',       category: 'grills' },
  { src: '/assets/photos/grills/IMG_8566.jpg',       category: 'grills' },
  { src: '/assets/photos/grills/IMG_8568.jpg',       category: 'grills' },
  { src: '/assets/photos/grills/RenderedImage.JPEG', category: 'grills' },
  // ── Tooth Gems ──
  { src: '/assets/photos/gems/IMG_0056.jpg', category: 'gems' },
  { src: '/assets/photos/gems/IMG_8576.jpg', category: 'gems' },
  { src: '/assets/photos/gems/IMG_8577.jpg', category: 'gems' },
];

let allPhotos = [...PRELOADED_PHOTOS];
let activeCategory = 'all';
let visiblePhotos  = [...allPhotos];
let current        = 0;

const mainPhoto    = document.getElementById('main-photo');
const filmstrip    = document.getElementById('filmstrip');
const photoCounter = document.getElementById('photo-counter');
const photoWrap    = document.getElementById('photo-wrap');

// ── Filter ──
function applyFilter(cat) {
  activeCategory = cat;
  document.querySelectorAll('.filter-pill').forEach(p =>
    p.classList.toggle('active', p.dataset.cat === cat));
  visiblePhotos = cat === 'all' ? allPhotos : allPhotos.filter(p => p.category === cat);
  current = 0;
  buildFilmstrip();
  if (visiblePhotos.length > 0) showPhoto(0);
  else showEmpty();
}

document.querySelectorAll('.filter-pill').forEach(pill =>
  pill.addEventListener('click', () => applyFilter(pill.dataset.cat)));

// ── Filmstrip ──
function buildFilmstrip() {
  filmstrip.innerHTML = '';
  visiblePhotos.forEach((photo, i) => {
    const img = document.createElement('img');
    img.src = photo.src;
    img.alt = `Charmfluent ${photo.category} thumbnail ${i + 1}`;
    img.className = 'thumb' + (i === current ? ' active' : '');
    img.addEventListener('click', () => showPhoto(i));
    filmstrip.appendChild(img);
  });
}

function showEmpty() {
  mainPhoto.classList.remove('visible');
  mainPhoto.src = '';
  photoCounter.textContent = '0 / 0';
  if (!photoWrap.querySelector('#empty-state')) {
    const el = document.createElement('div');
    el.id = 'empty-state';
    el.textContent = 'No photos in this category yet';
    photoWrap.appendChild(el);
  }
}

function showPhoto(index) {
  const emptyEl = photoWrap.querySelector('#empty-state');
  if (emptyEl) emptyEl.remove();

  current = (index + visiblePhotos.length) % visiblePhotos.length;
  const photo = visiblePhotos[current];

  mainPhoto.classList.remove('visible');
  setTimeout(() => {
    mainPhoto.src = photo.src;
    mainPhoto.alt = `Charmfluent ${photo.category} — photo ${current + 1} of ${visiblePhotos.length}`;
    mainPhoto.onload = () => mainPhoto.classList.add('visible');
  }, 150);

  photoCounter.textContent = `${current + 1} / ${visiblePhotos.length}`;

  document.querySelectorAll('.thumb').forEach((t, i) =>
    t.classList.toggle('active', i === current));

  const activeThumb = filmstrip.children[current];
  if (activeThumb) activeThumb.scrollIntoView({ inline: 'center', behavior: 'smooth' });
}

// Show preloaded photos immediately, then replace with API photos if available
applyFilter('all');

fetch('/api/photos')
  .then(r => r.ok ? r.json() : [])
  .then(apiPhotos => {
    if (!apiPhotos.length) return;
    allPhotos = apiPhotos.map(p => ({ src: p.url, category: p.category }));
    applyFilter(activeCategory);
  })
  .catch(() => { /* keep preloaded photos */ });

// ── Auto-slideshow ──
let slideshowTimer = setInterval(() => {
  if (visiblePhotos.length > 1) showPhoto(current + 1);
}, 3500);

function navigate(dir) {
  if (visiblePhotos.length === 0) return;
  clearInterval(slideshowTimer);
  showPhoto(current + dir);
  slideshowTimer = setInterval(() => {
    if (visiblePhotos.length > 1) showPhoto(current + 1);
  }, 3500);
}

document.getElementById('arrow-left') .addEventListener('click', () => navigate(-1));
document.getElementById('arrow-right').addEventListener('click', () => navigate(1));

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
});

// ── Touch swipe ──
let swipeStartX = null;
photoWrap.addEventListener('touchstart', e => {
  swipeStartX = e.touches[0].clientX;
}, { passive: true });
photoWrap.addEventListener('touchend', e => {
  if (swipeStartX === null) return;
  const dx = e.changedTouches[0].clientX - swipeStartX;
  if (Math.abs(dx) > 40) navigate(dx < 0 ? 1 : -1);
  swipeStartX = null;
}, { passive: true });


