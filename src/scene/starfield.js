import * as THREE from 'three';

function makeStars(count, spread, size, opacity) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    pos[i * 3]     = (Math.random() - 0.5) * spread;
    pos[i * 3 + 1] = (Math.random() - 0.5) * spread;
    pos[i * 3 + 2] = -(Math.random()) * spread * 0.6 - 2;
  }

  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xffffff,
    size,
    transparent: true,
    opacity,
    sizeAttenuation: true
  }));
}

export function createStarfield(scene) {
  const starA = makeStars(900, 42, 0.055, 0.85); // dense, small
  const starB = makeStars(420, 52, 0.09,  0.40); // mid
  const starC = makeStars(180, 38, 0.12,  0.22); // sparse, large

  scene.add(starA, starB, starC);
  return { starA, starB, starC };
}