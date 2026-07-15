export function initCursor() {

  // ── 1. Hide the default system cursor everywhere ──
  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after { cursor: none !important; }
  `;
  document.head.appendChild(style);

  // ── 2. Build the cursor SVG ──
  const cursorEl = document.createElement('div');
  cursorEl.id = 'charm-cursor';
  cursorEl.style.cssText = `
    position: fixed;
    top: 0; left: 0;
    width: 36px; height: 42px;
    pointer-events: none;
    z-index: 99999;
    transform: translate(-2px, -2px);
    will-change: transform;
    transition: opacity 0.2s;
    filter: drop-shadow(0 0 6px rgba(255, 100, 160, 0.7))
            drop-shadow(0 0 14px rgba(255, 60, 120, 0.4));
  `;

  cursorEl.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42" fill="none">
      <defs>
        <linearGradient id="cg1" x1="4" y1="2" x2="28" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="#ffacd4"/>
          <stop offset="35%"  stop-color="#f0538a"/>
          <stop offset="65%"  stop-color="#c41a5e"/>
          <stop offset="100%" stop-color="#8a0a3e"/>
        </linearGradient>
        <linearGradient id="cg2" x1="6" y1="4" x2="16" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="rgba(255,230,240,0.85)"/>
          <stop offset="100%" stop-color="rgba(255,180,210,0)"/>
        </linearGradient>
        <linearGradient id="cg3" x1="28" y1="10" x2="20" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stop-color="rgba(220,40,100,0.5)"/>
          <stop offset="100%" stop-color="rgba(100,0,40,0)"/>
        </linearGradient>
        <filter id="cshadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(180,0,80,0.6)"/>
        </filter>
      </defs>
      <path
        d="M4 2 L4 34 L12 26 L18 40 L23 38 L17 24 L28 24 Z"
        fill="url(#cg1)"
        filter="url(#cshadow)"
        stroke="rgba(255,80,140,0.4)"
        stroke-width="0.6"
      />
      <path
        d="M6 4 L6 18 L11 13 L14 20 L15 18 L12 11 L18 11 Z"
        fill="url(#cg2)"
        opacity="0.7"
      />
      <path
        d="M22 12 L28 24 L24 24 L17 24 L23 38 L25 37 L20 25 L28 25 Z"
        fill="url(#cg3)"
        opacity="0.55"
      />
      <g transform="translate(4, 2)" opacity="0.9">
        <line x1="0" y1="-4" x2="0" y2="4"  stroke="white" stroke-width="1" opacity="0.8"/>
        <line x1="-4" y1="0" x2="4" y2="0"  stroke="white" stroke-width="1" opacity="0.8"/>
        <line x1="-2.5" y1="-2.5" x2="2.5" y2="2.5" stroke="white" stroke-width="0.6" opacity="0.5"/>
        <line x1="2.5" y1="-2.5" x2="-2.5" y2="2.5" stroke="white" stroke-width="0.6" opacity="0.5"/>
      </g>
    </svg>
  `;
  document.body.appendChild(cursorEl);

  // ── 3. Smooth follow with lerp ──
  let realX = -100, realY = -100;
  let drawX = -100, drawY = -100;

  window.addEventListener('mousemove', (e) => {
    realX = e.clientX;
    realY = e.clientY;
  });

  document.addEventListener('mouseleave', () => { cursorEl.style.opacity = '0'; });
  document.addEventListener('mouseenter', () => { cursorEl.style.opacity = '1'; });

  // ── 4. Sparkle particle pool ──
  const PARTICLE_COUNT = 24;
  const particles = [];

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = document.createElement('div');
    p.style.cssText = `
      position: fixed;
      top: 0; left: 0;
      width: 5px; height: 5px;
      border-radius: 50%;
      pointer-events: none;
      z-index: 99998;
      will-change: transform, opacity;
    `;
    document.body.appendChild(p);
    particles.push({ el: p, life: 0, active: false, x: 0, y: 0, vx: 0, vy: 0, color: '' });
  }

  let particleIdx = 0;
  let lastSpawnX = -999, lastSpawnY = -999;
  const SPAWN_DIST = 8;

  const GEM_COLORS = [
    '#ffacd4', '#ff6eb4', '#ff3399',
    '#ffffff', '#ffe0f0',
    '#d4af37', '#ffd700',
    '#cc66ff', '#ee88ff',
  ];

  function spawnParticle(x, y) {
    const p = particles[particleIdx % PARTICLE_COUNT];
    particleIdx++;

    const color = GEM_COLORS[Math.floor(Math.random() * GEM_COLORS.length)];
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 1.4;
    const size  = 2 + Math.random() * 4;

    p.x = x + (Math.random() - 0.5) * 10;
    p.y = y + (Math.random() - 0.5) * 10;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed - 0.5;
    p.life = 1.0;
    p.active = true;
    p.color = color;

    p.el.style.width  = size + 'px';
    p.el.style.height = size + 'px';
    p.el.style.background = color;
    p.el.style.boxShadow = `0 0 ${size + 2}px ${color}`;
    p.el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
  }

  // ── 5. Animation loop ──
  const LERP_SPEED = 0.18;

  function tick() {
    requestAnimationFrame(tick);

    drawX += (realX - drawX) * LERP_SPEED;
    drawY += (realY - drawY) * LERP_SPEED;
    cursorEl.style.transform = `translate(${drawX - 2}px, ${drawY - 2}px)`;

    const dx = realX - lastSpawnX;
    const dy = realY - lastSpawnY;
    if (Math.sqrt(dx * dx + dy * dy) > SPAWN_DIST) {
      spawnParticle(realX, realY);
      lastSpawnX = realX;
      lastSpawnY = realY;
    }

    for (const p of particles) {
      if (!p.active) continue;

      p.life -= 0.038;
      if (p.life <= 0) {
        p.active = false;
        p.el.style.opacity = '0';
        continue;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.04;
      p.vx *= 0.97;

      p.el.style.opacity   = p.life.toFixed(3);
      p.el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${(1 - p.life) * 180}deg)`;
    }
  }

  tick();

  // ── 6. Click burst ──
  window.addEventListener('click', () => {
    for (let i = 0; i < 12; i++) spawnParticle(realX, realY);
  });

  // ── 7. Scale cursor on interactive elements ──
  const hoverTargets = 'a, button, [data-hover], .btn-submit, .faq-q, .price-card, .social-link';
  document.addEventListener('mouseover', (e) => {
    if (e.target.matches(hoverTargets) || e.target.closest(hoverTargets)) {
      cursorEl.style.filter = `
        drop-shadow(0 0 10px rgba(255, 100, 160, 1))
        drop-shadow(0 0 22px rgba(255, 60, 120, 0.7))
      `;
    }
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.matches(hoverTargets) || e.target.closest(hoverTargets)) {
      cursorEl.style.filter = `
        drop-shadow(0 0 6px rgba(255, 100, 160, 0.7))
        drop-shadow(0 0 14px rgba(255, 60, 120, 0.4))
      `;
    }
  });
}
