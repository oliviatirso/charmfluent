// ─── TRACK DATA ───
const TRACKS = [
  {
    title:  'Tell Me What You Want',
    artist: 'Sasha Keable',
    src:    '/assets/audio/sasha-keable-tell-me-what-you-want.mp3',
    pal:    ['#ff60b8', '#c9006a', '#ffaada', '#180026'],
  },
  {
    title:  'Heal Something',
    artist: 'Sasha Keable',
    src:    '/assets/audio/Sasha Keable - heal something (Visualiser).mp3',
    pal:    ['#b06aff', '#5500cc', '#ddb0ff', '#0e0018'],
  },
];

// ─── AUDIO ELEMENT ───
const audio = new Audio();
audio.preload = 'metadata';
let curTrack = 0;
let vol = 0.7;
audio.volume = vol;

function loadTrack(i, autoplay = false) {
  curTrack = i;
  audio.src = TRACKS[i].src;
  audio.load();
  updateNP();
  updateList();
  drawFrame();
  if (autoplay) audio.play().catch(() => {});
}

function togglePlay() {
  if (audio.paused) {
    audio.play().catch(() => {});
  } else {
    audio.pause();
  }
}

audio.addEventListener('play',  () => { setPauseIcon(); startEQ(); if (!artRaf) animArt(); });
audio.addEventListener('pause', () => { setPlayIcon();  stopEQ(); });
audio.addEventListener('ended', () => {
  loadTrack((curTrack + 1) % TRACKS.length, true);
});
audio.addEventListener('timeupdate', updateProg);
audio.addEventListener('loadedmetadata', updateProg);

// ─── EQ ANIMATION ───
let eqRaf = null;
const eqEls = [0,1,2,3].map(i => document.getElementById('eq' + i));
const EQH   = [10, 14, 8, 12];

function animEQ() {
  eqEls.forEach((el, i) => {
    el.style.height = (Math.random() * EQH[i] * 0.65 + EQH[i] * 0.35) + 'px';
  });
  eqRaf = requestAnimationFrame(animEQ);
}
function startEQ() { if (!eqRaf) eqRaf = requestAnimationFrame(animEQ); }
function stopEQ()  {
  if (eqRaf) { cancelAnimationFrame(eqRaf); eqRaf = null; }
  eqEls.forEach(el => el.style.height = '2px');
}

// ─── ALBUM ART CANVAS ───
let artRaf = null, frame = 0;
const ac = document.getElementById('ac');
ac.width = 142; ac.height = 142;
const ax = ac.getContext('2d');

function drawFrame() {
  const T = TRACKS[curTrack], [c1, , c3, cbg] = T.pal;
  const W = ac.width, H = ac.height, t = frame * 0.022;
  ax.clearRect(0, 0, W, H);
  ax.fillStyle = cbg; ax.fillRect(0, 0, W, H);

  // Orbs
  for (let i = 0; i < 5; i++) {
    const x  = W * (0.5 + Math.sin(t * 0.8 + i * 1.3) * 0.36);
    const y  = H * (0.5 + Math.cos(t * 0.6 + i * 1.75) * 0.35);
    const r  = 28 + i * 14 + Math.sin(t * 1.4 + i) * 9;
    const gr = ax.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, (i % 2 ? c3 : c1) + '58');
    gr.addColorStop(1, 'transparent');
    ax.beginPath(); ax.arc(x, y, r, 0, Math.PI * 2);
    ax.fillStyle = gr; ax.fill();
  }

  // Grid
  ax.save(); ax.globalAlpha = 0.11; ax.strokeStyle = c1; ax.lineWidth = 0.8;
  const gx = (t * 14) % 20;
  for (let x = -20 + gx % 20; x < W; x += 20) {
    ax.beginPath(); ax.moveTo(x, 0); ax.lineTo(x, H); ax.stroke();
  }
  for (let y = 0; y < H; y += 20) {
    ax.beginPath(); ax.moveTo(0, y); ax.lineTo(W, y); ax.stroke();
  }
  ax.restore();

  
  // Perspective grid
  ax.save(); ax.globalAlpha = 0.14; ax.strokeStyle = c3; ax.lineWidth = 0.7;
  const hy = H * 0.68;
  for (let i = -6; i <= 6; i++) {
    ax.beginPath(); ax.moveTo(W / 2, hy); ax.lineTo(W / 2 + i * W * 0.13, H); ax.stroke();
  }
  for (let i = 0; i < 5; i++) {
    const y = hy + (H - hy) * Math.pow(i / 4, 2);
    ax.beginPath(); ax.moveTo(0, y); ax.lineTo(W, y); ax.stroke();
  }
  ax.restore();

  // Floating sparkles
  for (let i = 0; i < 9; i++) {
    const sx = W * (0.08 + 0.84 * ((i * 0.13 + Math.sin(t * 0.9 + i * 0.72) * 0.06 + 1) % 1));
    const sy = H * (0.08 + 0.84 * ((i * 0.17 + Math.cos(t * 0.7 + i * 0.88) * 0.06 + 1) % 1));
    const sa = 0.25 + Math.sin(t * 2.2 + i) * 0.3;
    ax.save(); ax.globalAlpha = sa; ax.fillStyle = c3;
    ax.font = 'bold 9px Nunito,sans-serif';
    ax.textAlign = 'center'; ax.textBaseline = 'middle';
    ax.fillText('✦', sx, sy); ax.restore();
  }

  // Brand text
  ax.save();
  const pulse = 0.88 + Math.sin(t * 3.2) * 0.1;
  ax.translate(W / 2, H * 0.41); ax.scale(pulse, pulse);
  ax.font = 'bold 12px Nunito,sans-serif';
  ax.textAlign = 'center'; ax.textBaseline = 'middle';
  ax.shadowColor = c1; ax.shadowBlur = 16;
  ax.fillStyle = c1 + 'cc';
  ax.fillText('✦ CHARMFLUENT ✦', 0, 0);
  ax.restore();

  ax.save();
  ax.font = 'bold 10px Nunito,sans-serif';
  ax.textAlign = 'center'; ax.textBaseline = 'middle';
  ax.shadowColor = c3; ax.shadowBlur = 8;
  ax.fillStyle = 'rgba(255,255,255,.4)';
  ax.fillText(TRACKS[curTrack].title, W / 2, H * 0.62);
  ax.restore();
}

function animArt() {
  frame++;
  drawFrame();
  artRaf = requestAnimationFrame(animArt);
}

// ─── UI ───
function updateNP() {
  const T  = TRACKS[curTrack];
  const el = document.getElementById('npt');
  el.textContent = T.title.toUpperCase();
  document.getElementById('npa').textContent = T.artist + ' ✦';
}

function updateProg() {
  const elapsed = audio.currentTime;
  const total   = audio.duration || 0;
  const em = Math.floor(elapsed / 60), es = Math.floor(elapsed % 60);
  const tm = Math.floor(total / 60),   ts = Math.floor(total % 60);
  document.getElementById('te').textContent = `${em}:${es.toString().padStart(2, '0')}`;
  document.getElementById('td').textContent = total ? `${tm}:${ts.toString().padStart(2, '0')}` : '0:00';
  document.getElementById('pf').style.width = total ? (elapsed / total * 100) + '%' : '0%';
}

function setPlayIcon()  { document.getElementById('ppi').innerHTML = '<path d="M8 5v14l11-7z"/>'; }
function setPauseIcon() { document.getElementById('ppi').innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>'; }

function buildList() {
  const el = document.getElementById('tl');
  el.innerHTML = '';
  TRACKS.forEach((T, i) => {
    const d = document.createElement('div');
    d.className = 'ti' + (i === curTrack ? ' act' : '');
    d.innerHTML = `
      <div class="ti-num">${i + 1}</div>
      <div class="ti-dot"></div>
      <div class="ti-info">
        <div class="ti-name">${T.title}</div>
        <div class="ti-artist">${T.artist}</div>
      </div>`;
    d.addEventListener('click', () => { loadTrack(i, true); showView('np'); });
    el.appendChild(d);
  });
}

function updateList() {
  document.querySelectorAll('.ti').forEach((el, i) => el.classList.toggle('act', i === curTrack));
}

let curView = 'np';
function showView(v) {
  curView = v;
  document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
  document.getElementById('v-' + v).classList.add('active');
}

// ─── SEEK (click progress bar) ───
document.getElementById('prog-track-h').addEventListener('click', e => {
  const r = e.currentTarget.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
  if (audio.duration) audio.currentTime = pct * audio.duration;
});

// ─── BUTTONS ───
document.getElementById('ppb').addEventListener('click', togglePlay);

document.getElementById('nb').addEventListener('click', () => {
  loadTrack((curTrack + 1) % TRACKS.length, true);
});

document.getElementById('pb').addEventListener('click', () => {
  if (audio.currentTime > 3) { audio.currentTime = 0; return; }
  loadTrack((curTrack - 1 + TRACKS.length) % TRACKS.length, !audio.paused);
});

document.getElementById('hb').addEventListener('click', () => {
  showView(curView === 'np' ? 'tl' : 'np');
});

// ─── INIT ───
loadTrack(0);
buildList();
drawFrame();
if (!artRaf) animArt();
