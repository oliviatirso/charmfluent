import './style.css';
import { initScene } from './scene/scene.js';
import { startLoader } from './utils/loader.js';
// Start loading animation, then init scene
startLoader(() => {
  initScene();
});