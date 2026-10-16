// Vídeo en bucle solo mientras se ve: se descarga al acercarse y se pausa al salir (IntersectionObserver, sin
// escuchar el scroll). Con movimiento reducido se queda el póster.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const video = entry.target as HTMLVideoElement;
        if (entry.isIntersecting) {
          if (!video.getAttribute('src')) video.src = video.dataset.src ?? '';
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    },
    { rootMargin: '200px 0px' },
  );
  document.querySelectorAll<HTMLVideoElement>('video[data-autoplay]').forEach((video) => io.observe(video));
}
