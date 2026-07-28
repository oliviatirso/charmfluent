import * as THREE from 'three';

// Brand palette tints — white weighted ~60%, colored ~40%
const TINTS = [
  [1.00, 1.00, 1.00], // white (×3 for weighting)
  [1.00, 1.00, 1.00],
  [1.00, 1.00, 1.00],
  [1.00, 0.43, 0.78], // pink
  [0.91, 0.12, 0.55], // hot pink
  [0.83, 0.69, 0.22], // gold
  [0.60, 0.25, 1.00], // purple
];

function isWhite(t) { return t[0] === 1 && t[1] === 1 && t[2] === 1; }

function buildPoints(positions, phases, speeds, baseRGBArr, size, opacity) {
  const count = phases.length;
  const geo   = new THREE.BufferGeometry();
  const colors = new Float32Array(baseRGBArr); // copy as initial colors

  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
  geo.setAttribute('color',    new THREE.BufferAttribute(colors, 3));
  geo.userData.phases  = new Float32Array(phases);
  geo.userData.speeds  = new Float32Array(speeds);
  geo.userData.baseRGB = new Float32Array(baseRGBArr);

  return new THREE.Points(geo, new THREE.PointsMaterial({
    size,
    transparent: true,
    opacity,
    vertexColors: true,
    sizeAttenuation: true,
  }));
}

function makeStars(count, spread, size, opacity) {
  const group = new THREE.Group();

  const wPos = [], wPh = [], wSp = [], wRGB = [];
  const cPos = [], cPh = [], cSp = [], cRGB = [];

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * spread;
    const y = (Math.random() - 0.5) * spread;
    const z = -Math.random() * spread * 0.6 - 2;
    const phase = Math.random() * Math.PI * 2;
    const speed = 0.4 + Math.random() * 2.2;
    const tint  = TINTS[Math.floor(Math.random() * TINTS.length)];

    if (isWhite(tint)) {
      wPos.push(x, y, z); wPh.push(phase); wSp.push(speed); wRGB.push(1, 1, 1);
    } else {
      cPos.push(x, y, z); cPh.push(phase); cSp.push(speed); cRGB.push(...tint);
    }
  }

  if (wPos.length) group.add(buildPoints(wPos, wPh, wSp, wRGB, size,        opacity));
  if (cPos.length) group.add(buildPoints(cPos, cPh, cSp, cRGB, size * 1.75, opacity));

  return group;
}

function twinklePoints(pts, t) {
  const attr    = pts.geometry.attributes.color;
  const phases  = pts.geometry.userData.phases;
  const speeds  = pts.geometry.userData.speeds;
  const baseRGB = pts.geometry.userData.baseRGB;
  for (let i = 0; i < phases.length; i++) {
    const b = Math.max(0.05, 0.5 + Math.sin(t * speeds[i] + phases[i]) * 0.5);
    attr.array[i * 3]     = baseRGB[i * 3]     * b;
    attr.array[i * 3 + 1] = baseRGB[i * 3 + 1] * b;
    attr.array[i * 3 + 2] = baseRGB[i * 3 + 2] * b;
  }
  attr.needsUpdate = true;
}

export function twinkleStars(group, t) {
  for (const pts of group.children) twinklePoints(pts, t);
}

export function createStarfield(scene) {
  const starA = makeStars(1800, 42, 0.055, 0.85);
  const starB = makeStars(840,  52, 0.09,  0.40);
  const starC = makeStars(360,  38, 0.12,  0.22);

  scene.add(starA, starB, starC);
  return { starA, starB, starC };
}