export const isMobile = window.innerWidth < 768;
export const pixelRatio = Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2);
