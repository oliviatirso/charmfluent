export function startLoader(onComplete) {
    const loader = document.getElementById('loader');
    const fill   = document.getElementById('loader-fill');
  
    let progress = 0;
  
    const interval = setInterval(() => {
      progress += Math.random() * 7 + 4;
  
      if (progress >= 100) {
        progress = 100;
        fill.style.width = '100%';
        clearInterval(interval);
  
        setTimeout(() => {
          loader.classList.add('hidden');
          setTimeout(onComplete, 700);
        }, 400);
      } else {
        fill.style.width = progress + '%';
      }
    }, 110);
  }