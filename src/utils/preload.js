export function preloadImage(src) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => res(true);
      img.onerror = () => res(false);
      img.src = src;
    });
  }
  