import * as THREE from 'three';

export function setupLights(scene) {
  // Ambient
  scene.add(new THREE.AmbientLight(0xffffff, 0.28));

  // Key light — warm white
  const key = new THREE.PointLight(0xfff8e8, 1.1, 28);
  key.position.set(1.8, 4, 3.5);
  scene.add(key);

  // Rim light — purple
  const rim = new THREE.PointLight(0x7755cc, 0.75, 22);
  rim.position.set(-1.5, 2.5, -3);
  scene.add(rim);

  // Fill light — gold
  const fill = new THREE.PointLight(0xd4af37, 0.25, 18);
  fill.position.set(-2.8, 0.8, 2.2);
  scene.add(fill);

  // Directional light — soft top-front
  const dir = new THREE.DirectionalLight(0xffffff, 0.6);
  dir.position.set(2, 6, 4);
  scene.add(dir);
}