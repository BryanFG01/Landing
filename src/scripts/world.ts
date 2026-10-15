import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Key = { y: number; v: number };

// Interpola un valor por tramos según la posición de scroll.
const piecewise = (y: number, keys: Key[]) => {
  if (y <= keys[0].y) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (y <= b.y) return a.v + (b.v - a.v) * ((y - a.y) / (b.y - a.y || 1));
  }
  return keys[keys.length - 1].v;
};

const clamp = gsap.utils.clamp(0, 1);

// Paseo por la finca: el scroll mueve los clips (o las fotos, mientras el clip del tramo no ha cargado) y cada parada
// muestra su texto. `w` es la posición en el paseo: 0 en la primera parada, 1 en la segunda, 2.5 a medio camino entre
// la tercera y la cuarta. Al acabar la sección vale `stops.length`.
// Cada clip es el contenido de su parada, así que ocupa el mismo tramo que su texto: de la mitad del camino anterior a
// la mitad del siguiente (el primero empieza en 0 y el último acaba al final de la sección). Vídeo y texto cambian a la vez.
export function initWorld(world: HTMLElement, reduceMotion: boolean) {
  const stage = world.querySelector<HTMLElement>('[data-stage]');
  if (!stage) return;
  const stops = [...world.querySelectorAll<HTMLElement>('[data-stop]')];
  const frames = [...stage.querySelectorAll<HTMLElement>('[data-frame]')];
  const links = [...stage.querySelectorAll<HTMLAnchorElement>('[data-goto]')];
  const fill = stage.querySelector<HTMLElement>('[data-rail-fill]');
  const hint = stage.querySelector<HTMLElement>('[data-hint]');
  const clips = [...stage.querySelectorAll<HTMLVideoElement>('[data-clip]')];
  // Clips automáticos: se reproducen solos, en bucle, en vez de avanzar con el scroll.
  const auto = clips.map((clip) => clip.dataset.auto !== undefined);
  // Qué clip se ve en cada parada: el suyo, o el de la anterior si la parada "continúa" (el vídeo no se corta).
  const owner: number[] = [];
  clips.forEach((clip, i) => owner.push(i > 0 && clip.dataset.continua !== undefined ? owner[i - 1] : i));
  const last = stops.length - 1;
  const focus = stops.map((stop) => Number(stop.dataset.focus ?? 50));

  // Cada parada llega cuando su artículo toca el borde superior; el paseo termina al acabar la sección.
  const marks = stops.map((stop) => ScrollTrigger.create({ trigger: stop, start: 'top top' }));
  const ready = clips.map(() => false);
  let current = -1;
  let w = 0;
  // Posición que pinta el vídeo: sigue a `w` con suavizado para que cada búsqueda caiga cerca de la anterior y el scrub
  // no vaya a saltos cuando el scroll llega a trompicones (sobre todo con el dedo, donde Lenis no actúa).
  let v = 0;
  let active = 0;
  let shown = -1;
  let time = 0;
  // Si el paseo está en pantalla: fuera de él no se reproduce ningún clip automático.
  let visible = true;

  const setCurrent = (index: number) => {
    if (index === current) return;
    current = index;
    stops.forEach((stop, i) => stop.classList.toggle('is-current', i === index));
    links.forEach((link, i) => link.setAttribute('aria-current', String(i === index)));
  };

  // El clip del tramo entra en cuanto ha buscado su fotograma. Si aún no ha cargado, las fotos vuelven a verse.
  const show = () => {
    if (shown !== active) {
      shown = active;
      clips.forEach((clip, i) => clip.classList.toggle('is-shown', i === active));
    }
    stage.dataset.mode = 'video';
  };

  // Pausa los clips automáticos que no son el activo (o todos, si se pasa -1).
  const pauseAuto = (except: number) =>
    clips.forEach((clip, i) => {
      if (auto[i] && i !== except && !clip.paused) clip.pause();
    });

  const sync = () => {
    const clip = clips[active];
    if (!clip || !ready[active]) {
      delete stage.dataset.mode;
      return;
    }
    // Automático: solo se asegura de que se esté reproduciendo.
    if (auto[active]) {
      show();
      if (!visible) clip.pause();
      else if (clip.paused) clip.play().catch(() => {});
      return;
    }
    if (clip.seeking) return;
    if (Math.abs(clip.currentTime - time) > 0.01) clip.currentTime = time;
    else show();
  };

  clips.forEach((clip, i) =>
    clip.addEventListener('seeked', () => {
      if (i !== active) return;
      show();
      sync();
    }),
  );

  const render = (self: ScrollTrigger) => {
    const y = self.scroll();
    w = piecewise(y, [...marks.map((mark, i) => ({ y: mark.start, v: i })), { y: self.end, v: stops.length }]);
    const at = Math.min(w, last);

    setCurrent(Math.round(at));
    stage.style.setProperty('--focus-x', `${piecewise(y, marks.map((mark, i) => ({ y: mark.start, v: focus[i] })))}%`);
    if (fill) fill.style.transform = `scaleY(${at / last})`;
    if (hint) hint.style.opacity = String(clamp(1 - w * 4));

    // Fotogramas (debajo de los clips): cada uno entra al empezar su tramo, donde empieza su clip, así el vídeo entra
    // encima sin que se note. Se ven solos en los tramos sin vídeo o mientras el clip carga; se acercan al avanzar.
    frames.forEach((frame, i) => {
      const start = i === 0 ? 0 : i - 0.5;
      frame.style.opacity = String(i === 0 ? 1 : clamp((w - start) / 0.2));
      if (!reduceMotion) frame.style.transform = `scale(${1 + 0.06 * clamp(w - start)})`;
    });

    // Un salto de más de un tramo (enlace del raíl, recarga a media página) no se recorre: se va directo.
    if (Math.abs(w - v) > 1) v = w;
    scrub();
  };

  const scrub = () => {
    if (!clips.length) return;
    const lastClip = clips.length - 1;
    const stop = Math.min(lastClip, Math.max(0, Math.floor(v + 0.5)));
    active = owner[stop];
    pauseAuto(active);
    if (auto[active]) {
      sync();
      return;
    }
    const start = active === 0 ? 0 : active - 0.5;
    const end = active === lastClip ? stops.length : active + 0.5;
    const { duration } = clips[active];
    // 10 ms antes del final: dentro del último fotograma (al final exacto algunos navegadores pintan negro).
    if (ready[active]) time = Math.min(clamp((v - start) / (end - start)) * duration, duration - 0.01);
    sync();
  };

  // Persigue `w` a un ritmo que no depende de los fps de la pantalla.
  gsap.ticker.add(() => {
    if (v === w) return;
    const d = w - v;
    v = Math.abs(d) < 0.0005 ? w : v + d * (1 - Math.pow(0.7, gsap.ticker.deltaRatio()));
    scrub();
  });

  const span = ScrollTrigger.create({
    trigger: world,
    start: 'top top',
    end: 'bottom bottom',
    onUpdate: render,
    onRefresh: render,
  });
  render(span);

  // Fuera del paseo, ningún clip automático se queda reproduciéndose oculto; al volver, sigue donde iba.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) scrub();
    else pauseAuto(-1);
  }).observe(world);

  // Con movimiento reducido o ahorro de datos se quedan las fotos.
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (!clips.length || reduceMotion || saveData) return;

  // Los clips se cargan de uno en uno: primero el del tramo actual y después el más cercano a la posición del scroll.
  // A igual distancia va antes el que viene por delante.
  // Distancia de `w` al tramo del clip i ([i − 0.5, i + 0.5)); los de atrás pesan algo más.
  const distance = (i: number) => {
    if (i === active) return -1;
    if (i - 0.5 > w) return i - 0.5 - w;
    return w - (i + 0.5) + 0.5;
  };
  // Los tramos sin vídeo (solo foto) no se cargan: se quedan con su póster.
  const queue = clips.map((_, i) => i).filter((i) => clips[i].dataset.src);

  const loadNext = async () => {
    queue.sort((a, b) => distance(a) - distance(b));
    const i = queue.shift();
    if (i === undefined) return;
    const clip = clips[i];
    const src = clip.dataset.src ?? '';
    clip.preload = 'auto';

    // Cada clip se descarga entero (blob) para que el scrub no dependa de la red.
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error(res.statusText);
      clip.src = URL.createObjectURL(await res.blob());
    } catch {
      clip.src = src;
    }

    const loaded = await new Promise<boolean>((resolve) => {
      clip.addEventListener('loadeddata', () => resolve(true), { once: true });
      clip.addEventListener('error', () => resolve(false), { once: true });
    });
    if (loaded) {
      // iOS no pinta los fotogramas buscados hasta que el vídeo se ha reproducido una vez.
      await clip.play().catch(() => {});
      clip.pause();
      ready[i] = true;
      render(span);
    }
    loadNext();
  };

  if (document.readyState === 'complete') loadNext();
  else window.addEventListener('load', loadNext, { once: true });
}
