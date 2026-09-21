import './style.css';
import { initScene } from './scene/scene.js';
import { startLoader } from './utils/loader.js';

if (localStorage.getItem('cf_loaded')) {
  initScene();
} else {
  localStorage.setItem('cf_loaded', '1');
  startLoader(() => initScene());
}