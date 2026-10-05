
// halftoneBg.js — ThreeUI "Predictive Arc / halftone-flow" for Charmfluent (Three.js r128, Vite)
//
// The fragment shader body is the authored ThreeUI source, copied verbatim.
// Only the host boundary is adapted:
//   • vertex shader uses Three's `position` attribute instead of `aVertexPosition`
//   • it runs as a full-screen plane inside your existing renderer (no second WebGL context)
//   • an optional hue / saturation / brightness grade is applied AFTER the authored
//     color, mirroring the package's props. Defaults (0 / 1 / 1) leave the output untouched.
//
// Usage (scene.js):
//   import { createHalftoneBackground } from './halftoneBg.js';
//   const halftone = createHalftoneBackground(renderer, { hue: 0, saturation: 1, brightness: 1 });
//   scene.add(halftone.mesh);q
//   scene.background = null;
//   // animate loop:
//   halftone.update(clock.getElapsedTime());

import * as THREE from 'three';

const vertexShader = /* glsl */ `
  void main() {
    // Pinned to the screen at the far plane; ignores the camera.
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;

  // Host-boundary grade (not part of the authored shader)
  uniform float u_hue;         // degrees
  uniform float u_saturation;  // 1.0 = authored
  uniform float u_brightness;  // 1.0 = authored
  uniform vec3  u_colBright;   // highlight color (authored: amber 1.0, 0.6, 0.2)

  mat2 rot(float a) {
      float s = sin(a), c = cos(a);
      return mat2(c, -s, s, c);
  }

  vec3 grade(vec3 c) {
      // Hue rotation around the luma axis (YIQ), then saturation + brightness.
      float a = radians(u_hue);
      mat3 toYIQ = mat3(0.299, 0.596, 0.211,
                        0.587, -0.274, -0.523,
                        0.114, -0.322, 0.312);
      mat3 toRGB = mat3(1.0, 1.0, 1.0,
                        0.956, -0.272, -1.106,
                        0.621, -0.647, 1.703);
      vec3 yiq = toYIQ * c;
      float s = sin(a), co = cos(a);
      yiq.yz = mat2(co, s, -s, co) * yiq.yz;
      yiq.yz *= u_saturation;
      return clamp(toRGB * yiq * u_brightness, 0.0, 1.0);
  }

  void main() {
      // ---- authored ThreeUI halftone-flow source (verbatim) ----
      vec2 uv = gl_FragCoord.xy / u_resolution.xy;
      vec2 p = uv * 2.0 - 1.0;
      p.x *= u_resolution.x / u_resolution.y;

      vec2 flow_uv = p;
      float time = u_time * 0.4;

      for(float i = 1.0; i < 4.0; i++) {
          flow_uv *= rot(time * 0.1);
          flow_uv.x += sin(flow_uv.y * 2.0 * i + time) * 0.5;
          flow_uv.y += cos(flow_uv.x * 1.5 * i - time * 0.8) * 0.5;
      }

      float intensity = sin(flow_uv.x * 2.0 + flow_uv.y * 3.0) * 0.5 + 0.5;

      vec3 col_dark = vec3(0.02, 0.0, 0.0);
      vec3 col_red = vec3(0.8, 0.1, 0.05);
      vec3 col_bright = u_colBright; // was vec3(1.0, 0.6, 0.2) amber — now light pink

      vec3 fluid_color = mix(col_dark, col_red, smoothstep(0.2, 0.6, intensity));
      fluid_color = mix(fluid_color, col_bright, smoothstep(0.7, 1.0, intensity));

      float gridSize = 6.0;
      vec2 grid_uv = gl_FragCoord.xy / gridSize;
      vec2 cell_uv = fract(grid_uv) - 0.5;

      float dist = length(cell_uv);
      float radius = intensity * 0.45;
      float dot_mask = smoothstep(radius, radius - 0.1, dist);

      vec3 final_color = mix(vec3(0.0), fluid_color, dot_mask);
      final_color += fluid_color * 0.15;
      // ---- end authored source ----

      gl_FragColor = vec4(grade(final_color), 1.0);
  }
`;

export function createHalftoneBackground(renderer, opts = {}) {
  const {
    hue = 0,
    saturation = 1,
    brightness = 1,
    speed = 1,
    highlight = '#ffc2e0', // light pink (replaces the authored amber)
  } = opts;

  const bufferSize = new THREE.Vector2();
  renderer.getDrawingBufferSize(bufferSize);

  const uniforms = {
    u_resolution: { value: bufferSize.clone() },
    u_time:       { value: 0 },
    u_hue:        { value: hue },
    u_saturation: { value: saturation },
    u_brightness: { value: brightness },
    u_colBright:  { value: new THREE.Color(highlight) },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    depthWrite: false,
    depthTest: false,
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000; // draw before starfield, sprites and models

  const onResize = () => {
    renderer.getDrawingBufferSize(bufferSize);
    uniforms.u_resolution.value.copy(bufferSize);
  };
  window.addEventListener('resize', onResize);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return {
    mesh,
    uniforms, // e.g. halftone.uniforms.u_hue.value = 320;
    update(elapsedSeconds) {
      if (!reduceMotion) uniforms.u_time.value = elapsedSeconds * speed;
    },
    resize: onResize, // call after renderer.setSize() if your own resize handler runs later
    dispose() {
      window.removeEventListener('resize', onResize);
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
