import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        shell:     'index.html',
        landing:   'pages/home.html',
        toothGemz: 'pages/tooth-gemz.html',
        camera:    'pages/camera.html',
        about:     'pages/about.html',
        prices:    'pages/prices.html',
        notFound:  'pages/404.html',
      },
    },
  },
});
