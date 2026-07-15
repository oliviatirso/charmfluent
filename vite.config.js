import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        shell:     'index.html',
        landing:   'pages/home.html',
        toothGemz: 'pages/tooth-gemz.html',
        camera:    'pages/camera.html',
      },
    },
  },
});
