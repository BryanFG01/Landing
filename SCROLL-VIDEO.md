# Video con scroll (scroll world)

Guía para reutilizar en otras webs la animación de esta landing: un video a pantalla completa que **avanza y retrocede con el scroll**, dividido en "paradas" con texto que entra y sale.

Implementación de referencia en este repo:

- [src/features/landing/scripts/world.ts](src/features/landing/scripts/world.ts): toda la lógica.
- [src/features/landing/components/ScrollWorld.astro](src/features/landing/components/ScrollWorld.astro): HTML y CSS del escenario.
- [src/features/landing/components/Stop.astro](src/features/landing/components/Stop.astro): cada parada de texto.
- [src/features/landing/scripts/motion.ts](src/features/landing/scripts/motion.ts): Lenis + GSAP.
- [src/features/landing/domain/finca.ts](src/features/landing/domain/finca.ts): datos de las paradas y comandos de ffmpeg.

---

## 1. Cómo funciona

```
<section data-world>                 ← alto = suma de las paradas (≈ 200svh cada una)
  <div data-stage sticky h-lvh>      ← se queda fijo en pantalla
    [data-frame] × N                 ← póster (primer fotograma) de cada clip, debajo
    <video data-clip> × N            ← un clip por tramo, encima
    velos / raíl / pista
  </div>
  <article data-stop> × N            ← marcan la distancia de scroll y llevan el texto
</section>
```

1. El escenario es `sticky`, así que se queda fijo mientras la sección pasa.
2. Cada `<article data-stop>` mide `200svh`. Cuando su borde superior toca el de la pantalla, empieza su tramo.
3. Se calcula `w`, la posición en el paseo: `0` en la primera parada, `1` en la segunda, `2.5` a medio camino entre la tercera y la cuarta… Al final de la sección `w = N`.
4. Clip activo = `floor(w)`. Tiempo del clip = `(w - activo) × duración`. Se escribe en `video.currentTime` (no se reproduce: se **busca** el fotograma, *scrubbing*).
5. Debajo de los videos están los pósters. Se ven mientras el clip no ha cargado, o si el usuario tiene movimiento reducido o ahorro de datos.
6. El texto de cada parada aparece con la clase `.is-current`.

**Truco clave:** el último fotograma del clip N es el primero del clip N+1, y el póster de cada parada es exactamente el primer fotograma de su clip. Por eso los cambios de clip y la entrada del video sobre la foto no se notan.

---

## 2. Dependencias

```bash
npm i gsap lenis
```

- **GSAP + ScrollTrigger**: posiciones de scroll de cada parada y `onUpdate`.
- **Lenis**: scroll suave. Sin él el scrub va a saltos con la rueda del ratón.
- **ffmpeg**: para preparar los videos.

---

## 3. Preparar los videos (lo más importante)

Si el video no está bien codificado, el scrub va a tirones aunque el código esté perfecto.

### 3.1 Material de origen

- Un clip por tramo, **16:9**, sin audio, de 3 a 8 s.
- El final de cada clip debe coincidir con el inicio del siguiente. Con video generado por IA, usa el último fotograma del clip anterior como fotograma inicial del siguiente.
- Movimiento de cámara lento y continuo (dolly, travelling). Los cortes y los movimientos bruscos se ven mal al hacer scrub.

### 3.2 Codificar para scrub

**Regla de oro: fotogramas por tramo.** Cada tramo son ~200svh de scroll (unos 1700 px en un móvil). Un clip de 1,3 s a 24 fps tiene solo 33 fotogramas, uno cada 50 px, y se siente "pegado". Por eso los clips se **interpolan ×3** (24 → 72 fps, unos 97 fotogramas por tramo).

```bash
# N = fotogramas del clip original:
#   ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of csv=p=0 clip.mp4
# end_frame = (N - 1) * 3 + 1   →  con 33 fotogramas: 97
ffmpeg -i clip.mp4 -an \
  -vf "scale=1920:-2,tpad=stop_mode=clone:stop=3,minterpolate=fps=72:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1:scd=fdiff:scd_threshold=6,trim=end_frame=97" \
  -c:v libx264 -preset slow -crf 27 \
  -g 3 -keyint_min 3 -sc_threshold 0 -bf 0 \
  -pix_fmt yuv420p \
  -color_primaries bt709 -color_trc iec61966-2-1 -colorspace bt709 -color_range tv \
  -movflags +faststart+write_colr \
  public/video/tramo-1.mp4
```

| Opción | Por qué |
| --- | --- |
| `-an` | Sin audio: pesa menos y permite `muted` + autoplay en iOS. |
| `minterpolate=fps=72` | Triplica los fotogramas inventando los intermedios. Con factor entero (×3), los originales caen justo en cada tercero, así que el primero y el último no cambian. |
| `tpad=…clone:stop=3` + `trim` | Sin esto minterpolate **pierde el último fotograma** y se nota el salto al pasar al clip siguiente. |
| `scd=fdiff:scd_threshold=6` | En los **cortes de escena** no inventa fotogramas. Sin esto mezcla dos escenas y salen bloques. |
| `-g 3 -bf 0` | Un keyframe cada 3 fotogramas y sin B-frames: cada búsqueda decodifica como mucho 2 fotogramas. **Imprescindible** para que no se trabe. |
| `-crf 27` | Calidad/peso razonable. Sube a 30 si pesa mucho, baja a 23 si se ve mal. |
| `-color_trc iec61966-2-1` + `write_colr` | Marca el color como sRGB. Sin esto el navegador pinta el video más claro que el póster y se nota el cambio. |
| `+faststart` | Los metadatos van al principio del archivo. |

Objetivo: **unos 1,5–2 MB por clip**. Revisa siempre algunos fotogramas intermedios: si el clip tiene movimientos muy bruscos, la interpolación puede dejar artefactos (prueba `scd_threshold=3`).

### 3.3 Sacar el póster de cada clip

```bash
ffmpeg -i public/video/tramo-1.mp4 -frames:v 1 \
  -vf "scale=in_color_matrix=bt709:in_range=tv:out_range=pc,format=rgb24" \
  tramo-1.png
```

Convierte el PNG a WebP/AVIF (en Astro, `<Picture>` lo hace solo). Debe salir del **MP4 ya codificado**, no del original, para que encaje píxel a píxel.

---

## 4. HTML

Versión agnóstica (sin Astro). Repite el póster, el `<video>` y el `<article>` una vez por parada.

```html
<section data-world aria-label="Recorrido" class="world">
  <div data-stage class="stage" style="--focus-x: 50%">
    <div aria-hidden="true" class="layer">
      <!-- Pósters: el primero visible, el resto con opacity 0 -->
      <div data-frame class="frame"><img src="/img/tramo-1.webp" alt="" fetchpriority="high"></div>
      <div data-frame class="frame" style="opacity:0"><img src="/img/tramo-2.webp" alt="" loading="lazy"></div>

      <!-- Clips: sin src; se carga desde data-src -->
      <div class="clips">
        <video data-clip data-src="/video/tramo-1.mp4" muted playsinline preload="none"
               disablepictureinpicture disableremoteplayback tabindex="-1" class="clip"></video>
        <video data-clip data-src="/video/tramo-2.mp4" muted playsinline preload="none"
               disablepictureinpicture disableremoteplayback tabindex="-1" class="clip"></video>
      </div>
    </div>

    <!-- Velo para que el texto se lea sobre el video -->
    <div aria-hidden="true" class="veil"></div>

    <!-- Opcional: raíl de progreso y pista -->
    <span aria-hidden="true" class="rail"><span data-rail-fill class="rail-fill"></span></span>
    <p data-hint aria-hidden="true" class="hint">Desliza para recorrer</p>
  </div>

  <!-- Paradas: suben sobre el escenario con margin-top negativo -->
  <div class="stops">
    <article id="parada-1" data-stop data-focus="50" class="stop">
      <div class="stop-body">
        <h1>Titular de la primera parada</h1>
        <p>Texto…</p>
      </div>
    </article>
    <article id="parada-2" data-stop data-focus="65" class="stop">
      <div class="stop-body">
        <h2>Segunda parada</h2>
        <p>Texto…</p>
      </div>
    </article>
  </div>
</section>
```

`data-focus` (0–100) es el punto horizontal del video que queda a la vista en móvil, donde el 16:9 se recorta. Se interpola entre paradas.

---

## 5. CSS

```css
:root {
  --ease-fluid: cubic-bezier(0.32, 0.72, 0, 1);
}

.world { position: relative; }

.stage {
  position: sticky;
  top: 0;
  height: 100lvh;           /* lvh: no salta al esconderse la barra del navegador en móvil */
  overflow: hidden;
  background: #111;
}

.layer, .frame, .clips, .clip, .veil { position: absolute; inset: 0; }

.frame { will-change: opacity, transform; }
.frame img,
.clip {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: var(--focus-x) 50%;
}

/* Los clips entran con un fundido cuando el primero está listo */
.clips { opacity: 0; transition: opacity 1200ms var(--ease-fluid); }
[data-mode='video'] .clips { opacity: 1; }

/* Solo se ve el clip del tramo actual; el cambio es instantáneo porque comparten fotograma */
.clip { visibility: hidden; }
.clip.is-shown { visibility: visible; }

.veil {
  background: linear-gradient(to top, rgb(0 0 0 / .85) 15%, rgb(0 0 0 / .4) 50%, transparent 80%);
}

/* Móvil en vertical: un 16:9 a toda la altura solo deja ver ~1/4 del ancho y se ve enorme y borroso.
   El video ocupa la parte de arriba y se funde con el fondo; el texto queda debajo. */
@media (max-width: 1023.98px) and (orientation: portrait) {
  .layer {
    bottom: auto;
    height: 58svh;
    mask-image: linear-gradient(to bottom, #000 72%, transparent);
  }
  .veil {
    background: linear-gradient(to top, rgb(0 0 0 / .9) 30%, rgb(0 0 0 / .7) 55%, transparent 80%);
  }
}

/* Paradas */
.stops { position: relative; z-index: 10; margin-top: -100lvh; }

.stop {
  min-height: 200svh;       /* distancia de scroll de cada tramo: más alto = más lento */
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  pointer-events: none;
}

.stop-body {
  position: sticky;
  bottom: 0;
  max-width: 42rem;
  padding: 8rem 1rem 3rem;
  pointer-events: auto;
}

/* Entrada del texto (solo con JS) */
.js .stop-body > * {
  opacity: 0;
  transform: translateY(2rem);
  transition: opacity 700ms var(--ease-fluid), transform 700ms var(--ease-fluid);
}
.js .stop.is-current .stop-body > *,
.js .stop-body:focus-within > * {
  opacity: 1;
  transform: none;
  transition-duration: 1000ms;
}
.stop.is-current .stop-body > :nth-child(2) { transition-delay: 60ms; }
.stop.is-current .stop-body > :nth-child(3) { transition-delay: 120ms; }
.stop.is-current .stop-body > :nth-child(4) { transition-delay: 180ms; }
.js .stop:not(.is-current) .stop-body:not(:focus-within) { pointer-events: none; }

/* Raíl de progreso (opcional) */
.rail { position: absolute; top: 25%; bottom: 25%; right: 2rem; width: 1px; background: rgb(255 255 255 / .2); }
.rail-fill { position: absolute; inset: 0; transform-origin: top; transform: scaleY(0); background: #c4622d; }

@media (prefers-reduced-motion: reduce) {
  .js .stop-body > * { transform: none; }
}
```

Pon la clase `js` en `<html>` lo antes posible, para que sin JS el texto se vea:

```html
<script>document.documentElement.classList.add('js')</script>
```

---

## 6. JavaScript

### 6.1 Arranque: Lenis + ScrollTrigger

```ts
// motion.ts
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initWorld } from './world';

gsap.registerPlugin(ScrollTrigger);
// En móvil la barra del navegador cambia el alto al hacer scroll; recalcular ahí hace saltar el paseo.
ScrollTrigger.config({ ignoreMobileResize: true });

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!reduceMotion) {
  const lenis = new Lenis({ autoRaf: false, anchors: true });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

const world = document.querySelector<HTMLElement>('[data-world]');
if (world) initWorld(world, reduceMotion);
```

### 6.2 El escenario

Copia de [src/features/landing/scripts/world.ts](src/features/landing/scripts/world.ts), lista para pegar en otro proyecto.

```ts
// world.ts
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

export function initWorld(world: HTMLElement, reduceMotion: boolean) {
  const stage = world.querySelector<HTMLElement>('[data-stage]');
  if (!stage) return;
  const stops = [...world.querySelectorAll<HTMLElement>('[data-stop]')];
  const frames = [...stage.querySelectorAll<HTMLElement>('[data-frame]')];
  const fill = stage.querySelector<HTMLElement>('[data-rail-fill]');
  const hint = stage.querySelector<HTMLElement>('[data-hint]');
  const clips = [...stage.querySelectorAll<HTMLVideoElement>('[data-clip]')];
  const last = stops.length - 1;
  const focus = stops.map((stop) => Number(stop.dataset.focus ?? 50));

  // Cada parada llega cuando su artículo toca el borde superior.
  const marks = stops.map((stop) => ScrollTrigger.create({ trigger: stop, start: 'top top' }));
  const ready = clips.map(() => false);
  let current = -1;
  let w = 0;
  // Posición que pinta el video: sigue a `w` con suavizado para que cada búsqueda caiga cerca de la anterior
  // y el scrub no vaya a saltos cuando el scroll llega a trompicones (sobre todo con el dedo).
  let v = 0;
  let active = 0;
  let shown = -1;
  let time = 0;

  const setCurrent = (index: number) => {
    if (index === current) return;
    current = index;
    stops.forEach((stop, i) => stop.classList.toggle('is-current', i === index));
  };

  // El clip del tramo entra en cuanto ha buscado su fotograma.
  const show = () => {
    if (shown !== active) {
      shown = active;
      clips.forEach((clip, i) => clip.classList.toggle('is-shown', i === active));
    }
    stage.dataset.mode = 'video';
  };

  // Una sola búsqueda a la vez: si ya está buscando, se espera al `seeked`.
  const sync = () => {
    const clip = clips[active];
    if (!clip || !ready[active]) {
      delete stage.dataset.mode;
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
    w = piecewise(y, [...marks.map((m, i) => ({ y: m.start, v: i })), { y: self.end, v: stops.length }]);
    const at = Math.min(w, last);

    setCurrent(Math.round(at));
    stage.style.setProperty('--focus-x', `${piecewise(y, marks.map((m, i) => ({ y: m.start, v: focus[i] })))}%`);
    if (fill) fill.style.transform = `scaleY(${at / last})`;
    if (hint) hint.style.opacity = String(clamp(1 - w * 4));

    // Pósters: cada uno aparece en la segunda mitad del tramo anterior y se acerca al avanzar.
    frames.forEach((frame, i) => {
      frame.style.opacity = String(i === 0 ? 1 : clamp((w - i + 0.5) / 0.5));
      if (!reduceMotion) frame.style.transform = `scale(${1 + 0.06 * clamp(w - i)})`;
    });

    // Un salto de más de un tramo (enlace, recarga a media página) no se recorre: se va directo.
    if (Math.abs(w - v) > 1) v = w;
    scrub();
  };

  const scrub = () => {
    if (!clips.length) return;
    active = Math.min(clips.length - 1, Math.floor(v));
    const { duration } = clips[active];
    // A 72 fps cada fotograma dura ~14 ms: 10 ms antes del final cae dentro del último.
    if (ready[active]) time = Math.min((v - active) * duration, duration - 0.01);
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

  // Con movimiento reducido o ahorro de datos se quedan los pósters.
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  if (!clips.length || reduceMotion || saveData) return;

  // Carga de uno en uno: primero el tramo actual, luego el más cercano (a igual distancia, el de delante).
  const distance = (i: number) => {
    if (i === active) return -1;
    if (i > w) return i - w;
    return w - (i + 1) + 0.5;
  };
  const queue = clips.map((_, i) => i);

  const loadNext = async () => {
    queue.sort((a, b) => distance(a) - distance(b));
    const i = queue.shift();
    if (i === undefined) return;
    const clip = clips[i];
    const src = clip.dataset.src ?? '';
    clip.preload = 'auto';

    // Se descarga entero (blob) para que el scrub no dependa de la red.
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
      // iOS no pinta los fotogramas buscados hasta que el video se ha reproducido una vez.
      await clip.play().catch(() => {});
      clip.pause();
      ready[i] = true;
      render(span);
    }
    loadNext();
  };

  if (document.readyState === 'complete') loadNext();
  else addEventListener('load', loadNext, { once: true });
}
```

### Por qué está hecho así

| Decisión | Motivo |
| --- | --- |
| Varios clips cortos en vez de uno largo | Cada uno carga por separado; el primero aparece rápido. |
| `fetch` → `blob` → `createObjectURL` | Con el video entero en memoria, buscar un fotograma no espera a la red. |
| Una búsqueda a la vez (`seeking` + `seeked`) | Si se asigna `currentTime` en cada frame de scroll, el navegador cancela búsquedas y no pinta nada. |
| `play()` + `pause()` al cargar | Sin esto iOS Safari se queda en negro al buscar. |
| `duration - 0.01` | Al final exacto algunos navegadores pintan negro; 10 ms antes sigue dentro del último fotograma. |
| Suavizado `v → w` en el ticker | Las búsquedas caen siempre cerca de la anterior (decodificación barata) y el video no salta cuando el scroll táctil llega a trompicones. |
| `ignoreMobileResize` | La barra del navegador móvil cambia el alto; sin esto ScrollTrigger recalcula y el paseo da un salto. |
| Pósters debajo | Se ve algo desde el primer momento, y sirven de respaldo con movimiento reducido o ahorro de datos. |
| Cola por cercanía | Si el usuario salta al final, se carga primero lo que va a ver. |

---

## 7. Ajustes rápidos

| Quiero… | Cambia |
| --- | --- |
| Que el video avance más lento | `.stop { min-height }` de `200svh` a `300svh`. |
| Menos zoom en los pósters | `0.06` en `scale(1 + 0.06 * …)`. |
| Que el póster siguiente aparezca antes | `0.5` en `(w - i + 0.5) / 0.5`. |
| Otro encuadre en móvil | `data-focus` de cada parada. |
| Más o menos video en móvil | `height: 58svh` de `.layer` en el bloque de móvil vertical: más bajo = menos recorte. |
| Más o menos inercia en el video | `0.7` en `Math.pow(0.7, …)`: más alto = más suave pero con más retraso. |
| Un solo video en vez de varios | Funciona igual con un `<video data-clip>` y N paradas, pero `active` siempre es 0: cambia el cálculo de `time` por `w / stops.length * duration`. |

---

## 8. Checklist para una web nueva

- [ ] Clips 16:9 sin audio, con el final de cada uno igual al inicio del siguiente.
- [ ] Interpolados ×3, con `-g 3 -bf 0` y el color marcado (sección 3.2). ~1,5–2 MB cada uno.
- [ ] Primer y último fotograma iguales al original (sin pérdidas por la interpolación).
- [ ] Pósters sacados del MP4 final (sección 3.3).
- [ ] Mismo número de `[data-frame]`, `<video data-clip>` y `<article data-stop>`, en el mismo orden.
- [ ] `<video>` con `muted playsinline preload="none"` y `data-src` (no `src`).
- [ ] Clase `js` en `<html>`.
- [ ] Lenis conectado a `ScrollTrigger.update`.
- [ ] Probado en iPhone (Safari), Android (Chrome) y escritorio con rueda y trackpad.
- [ ] Probado con "Reducir movimiento" activado: deben verse los pósters y el texto.
- [ ] Lighthouse: el LCP es el primer póster (`fetchpriority="high"`), no el video.

---

## 9. Problemas comunes

| Síntoma | Causa probable |
| --- | --- |
| El scrub va a tirones / se "pega" | Pocos fotogramas por tramo o keyframes muy separados. Interpola ×3 y recodifica con `-g 3 -bf 0` (sección 3.2). |
| En móvil el video se ve muy recortado y borroso | Falta el bloque de móvil vertical del CSS: el 16:9 no puede llenar una pantalla vertical sin perder ~3/4 del ancho. |
| Bloques o imágenes mezcladas a mitad del clip | La interpolación cruzó un corte de escena. Baja `scd_threshold`. |
| El paseo salta al aparecer/ocultarse la barra del navegador | Falta `ScrollTrigger.config({ ignoreMobileResize: true })`. |
| Se nota un salto de brillo al entrar el video | Falta marcar el color (`-color_trc iec61966-2-1 -movflags +write_colr`) o el póster no salió del MP4 final. |
| Pantalla negra en iPhone | Falta `muted playsinline` o el `play()`/`pause()` tras `loadeddata`. |
| El video no aparece nunca | Mira la consola: el `fetch` falla (ruta mal o CORS). Revisa `data-src`. |
| El texto no aparece | Falta la clase `.js` o las paradas no tienen `data-stop`. |
| Posiciones mal tras cargar fuentes o imágenes | Llama a `ScrollTrigger.refresh()` después de `load`. |
| Salto al cambiar de clip | El último fotograma del clip N no coincide con el primero del N+1. |
