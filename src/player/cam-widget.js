// ─── STATE ───
const PRELOADED_PHOTOS = [
  { src: '/assets/photos/8CE2B6A5-AC88-48CC-815C-EC62A22EAB63.jpg', name: 'charm 1' },
  { src: '/assets/photos/B093A471-5528-4D7D-9DEB-462151E34212.jpg', name: 'charm 2' },
  { src: '/assets/photos/IMG_0056.jpg', name: 'IMG 0056' },
  { src: '/assets/photos/IMG_7143.jpg', name: 'IMG 7143' },
  { src: '/assets/photos/IMG_7935.jpg', name: 'IMG 7935' },
  { src: '/assets/photos/IMG_7937.jpg', name: 'IMG 7937' },
  { src: '/assets/photos/IMG_7940.jpg', name: 'IMG 7940' },
  { src: '/assets/photos/IMG_8566.jpg', name: 'IMG 8566' },
  { src: '/assets/photos/IMG_8568.jpg', name: 'IMG 8568' },
  { src: '/assets/photos/IMG_8576.jpg', name: 'IMG 8576' },
  { src: '/assets/photos/IMG_8577.jpg', name: 'IMG 8577' },
  { src: '/assets/photos/RenderedImage.JPEG', name: 'Rendered' },
];

let photos  = [...PRELOADED_PHOTOS];
let current = 0;
let curView = 'cp';

const fileInput  = document.getElementById('cam-file');
const photoEl    = document.getElementById('cam-photo');
const canvas     = document.getElementById('cam-canvas');
const uploadHint = document.getElementById('cam-upload-hint');
const hud        = document.getElementById('cam-hud');
const countFill  = document.getElementById('cam-count-fill');
const countLabel = document.getElementById('cam-count-label');
const photoName  = document.getElementById('cam-photo-name');
const gridScroll = document.getElementById('cam-grid-scroll');
const camScreen  = document.getElementById('cam-screen');
const ctx        = canvas.getContext('2d');

// size canvas to match screen pixel size
function resizeCanvas() {
  canvas.width  = camScreen.offsetWidth  || 300;
  canvas.height = camScreen.offsetHeight || 225;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// ─── IDLE ANIMATION ───
let idleFrame = 0, idleRaf = null;

function drawIdle() {
  const W = canvas.width, H = canvas.height;
  const t = idleFrame * 0.022;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#060410'; ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 4; i++) {
    const x = W * (0.5 + Math.sin(t * 0.7 + i * 1.4) * 0.32);
    const y = H * (0.5 + Math.cos(t * 0.5 + i * 1.9) * 0.30);
    const r = Math.min(W, H) * (0.12 + i * 0.06 + Math.sin(t + i) * 0.04);
    const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(255,72,190,${0.16 + i * 0.04})`);
    gr.addColorStop(1, 'transparent');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = gr; ctx.fill();
  }

  // Grid
  ctx.save(); ctx.globalAlpha = 0.09; ctx.strokeStyle = '#ff50b4'; ctx.lineWidth = 0.7;
  const off = (t * 14) % 20;
  for (let x = off % 20 - 20; x < W; x += 20) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 20)              { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.restore();

  // Perspective grid
  ctx.save(); ctx.globalAlpha = 0.11; ctx.strokeStyle = '#ffaada'; ctx.lineWidth = 0.6;
  const hy = H * 0.68;
  for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(W/2, hy); ctx.lineTo(W/2 + i*W*0.12, H); ctx.stroke(); }
  for (let i = 0; i < 4; i++) { const y = hy + (H - hy) * Math.pow(i/3, 2); ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
  ctx.restore();

  // Sparkles
  for (let i = 0; i < 7; i++) {
    const sx = W * (0.08 + 0.84 * ((i * 0.15 + Math.sin(t * 0.8 + i * 0.7) * 0.05 + 1) % 1));
    const sy = H * (0.08 + 0.84 * ((i * 0.19 + Math.cos(t * 0.6 + i * 0.9) * 0.05 + 1) % 1));
    ctx.save(); ctx.globalAlpha = 0.18 + Math.sin(t * 2 + i) * 0.12;
    ctx.fillStyle = '#ffb0e0'; ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✦', sx, sy); ctx.restore();
  }

  idleFrame++;
  idleRaf = requestAnimationFrame(drawIdle);
}

function startIdle() { if (!idleRaf) idleRaf = requestAnimationFrame(drawIdle); }
function stopIdle()  { if (idleRaf) { cancelAnimationFrame(idleRaf); idleRaf = null; } }
startIdle();

// ─── SHOW PHOTO ───
function showPhoto(index) {
  if (!photos.length) return;
  current = (index + photos.length) % photos.length;
  const p = photos[current];

  stopIdle();
  canvas.style.display     = 'none';
  uploadHint.style.display = 'none';
  photoEl.src              = p.src;
  photoEl.style.display    = 'block';
  hud.style.display        = 'block';

  photoName.textContent  = p.name;
  countLabel.textContent = `${current + 1} / ${photos.length}`;
  countFill.style.width  = ((current + 1) / photos.length * 100) + '%';
  updateGrid();
}

function clearToIdle() {
  photoEl.style.display    = 'none';
  canvas.style.display     = 'block';
  uploadHint.style.display = 'flex';
  hud.style.display        = 'none';
  countLabel.textContent   = '0 / 0';
  countFill.style.width    = '0%';
  photoName.textContent    = '';
  startIdle();
  updateGrid();
}

// ─── GRID ───
function updateGrid() {
  gridScroll.innerHTML = '';
  photos.forEach((p, i) => {
    const img = document.createElement('img');
    img.src = p.src;
    img.className = 'cam-thumb' + (i === current ? ' active' : '');
    img.addEventListener('click', () => { showPhoto(i); showView('cp'); });
    gridScroll.appendChild(img);
  });
  const addBtn = document.createElement('div');
  addBtn.className = 'cam-thumb-add';
  addBtn.textContent = '+';
  addBtn.addEventListener('click', () => fileInput.click());
  gridScroll.appendChild(addBtn);
}
updateGrid();

// Show preloaded photos immediately and auto-rotate
showPhoto(0);
let autoTimer = setInterval(() => showPhoto(current + 1), 3000);

// ─── VIEW TOGGLE ───
function showView(v) {
  curView = v;
  document.querySelectorAll('#cam-widget .cam-view').forEach(el => el.classList.remove('active'));
  document.getElementById('v-c' + v.slice(1)).classList.add('active');
}

// ─── FILE UPLOAD ───
fileInput.addEventListener('change', e => {
  const files = Array.from(e.target.files);
  if (!files.length) return;
  let loaded = 0;
  const newPhotos = [];
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      newPhotos.push({ src: ev.target.result, name: file.name.replace(/\.[^.]+$/, '') });
      if (++loaded === files.length) {
        const start = photos.length;
        photos = photos.concat(newPhotos);
        showPhoto(start);
        showView('cp');
      }
    };
    reader.readAsDataURL(file);
  });
  e.target.value = '';
});

// ─── BUTTONS ───

// MENU toggle (both old and new ID)
function toggleView() { showView(curView === 'cp' ? 'cg' : 'cp'); }
document.getElementById('cam-hb').addEventListener('click', () => fileInput.click()); // top + btn
document.getElementById('cam-hb2').addEventListener('click', toggleView);             // MENU btn
document.getElementById('cam-home-btn').addEventListener('click', toggleView);        // HOME btn

// D-pad prev/next — reset auto-rotate on manual nav
function navigate(dir) {
  if (!photos.length) return;
  showPhoto(current + dir);
  clearInterval(autoTimer);
  autoTimer = setInterval(() => showPhoto(current + 1), 3000);
}
document.getElementById('cam-pb').addEventListener('click', () => navigate(-1));
document.getElementById('cam-nb').addEventListener('click', () => navigate(1));

// OK center — add if empty, else full gallery
document.getElementById('cam-ppb').addEventListener('click', () => {
  if (!photos.length) fileInput.click();
  else window.open('/pages/camera.html', '_blank');
});

// Play slideshow
let slideshowTimer = null;
document.getElementById('cam-play-btn').addEventListener('click', () => {
  if (slideshowTimer) { clearInterval(slideshowTimer); slideshowTimer = null; return; }
  if (photos.length < 2) return;
  slideshowTimer = setInterval(() => showPhoto(current + 1), 2000);
});

// Click photo → open gallery; click empty screen → add photos
photoEl.addEventListener('click', () => { window.location.href = '/pages/camera.html'; });
camScreen.addEventListener('click', () => { if (!photos.length) fileInput.click(); });

// Keyboard nav
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft')  navigate(-1);
  if (e.key === 'ArrowRight') navigate(1);
});
