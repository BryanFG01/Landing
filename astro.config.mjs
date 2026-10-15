// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import { fotosPublicas, ogImage } from './src/data/imagenes.ts';

// https://astro.build/config
export default defineConfig({
  // URL de la landing. Canónica, sitemap, robots.txt, og:image y JSON-LD salen de aquí.
  site: 'http://localhost:4321',
  // La landing sigue siendo estática (se prerenderiza). Solo /admin y /api/admin se ejecutan como funciones de Vercel,
  // conectadas a Neon (PostgreSQL).
  adapter: vercel(),
  // Las sesiones del admin van en la base (admin.sessions): no se usan las sesiones de Astro.
  session: false,
  env: {
    schema: {
      // Cadena de Neon con pooling (-pooler). En local sale de .env; en Vercel, de las variables del proyecto.
      // Opcional para el build: la landing se prerenderiza sin base de datos. Se lee al abrir la primera conexión
      // (src/admin/server/db.ts) y, si falta, el admin responde con un error claro.
      DATABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      // Deploy Hook de Vercel (Settings → Git → Deploy Hooks). Con él, "Publicar" en Sitio web despliega la landing.
      VERCEL_DEPLOY_HOOK: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  integrations: [
    react(),
    sitemap({
      // El panel de administración no se indexa.
      filter: (page) => !new URL(page).pathname.startsWith('/admin'),
      // La portada lleva sus imágenes en el sitemap: la de redes y las fotos de la finca.
      serialize(item) {
        if (new URL(item.url).pathname !== '/') return item;
        const images = [
          { src: ogImage.src, title: ogImage.title, caption: ogImage.alt },
          ...fotosPublicas.map((foto) => ({ src: foto.src, title: foto.lugar, caption: foto.alt })),
        ];
        return { ...item, img: images.map(({ src, ...rest }) => ({ url: new URL(src, item.url).href, ...rest })) };
      },
    }),
  ],
  // Fuentes servidas desde el propio dominio, recortadas a latin con pyftsubset
  // (las originales son japonesas y pesan varios MB). Licencias OFL junto a los archivos.
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Hina Mincho',
      cssVariable: '--font-hina',
      fallbacks: ['serif'],
      options: {
        variants: [{ src: ['./src/assets/fonts/hina-mincho-latin-400.woff2'], weight: 400, style: 'normal' }],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Zen Kaku Gothic New',
      cssVariable: '--font-zen',
      fallbacks: ['sans-serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/zen-kaku-gothic-new-latin-400.woff2'], weight: 400, style: 'normal' },
          { src: ['./src/assets/fonts/zen-kaku-gothic-new-latin-500.woff2'], weight: 500, style: 'normal' },
        ],
      },
    },
    // Tipografías que se pueden elegir desde el panel (Sitio web → Colores y tipografía). Se descargan en el build y
    // se sirven desde el propio dominio; la página solo carga las dos elegidas. La lista vive en FONTS (src/data/sitio.ts).
    ...[
      ['Playfair Display', '--font-playfair', 'serif'],
      ['Fraunces', '--font-fraunces', 'serif'],
      ['DM Serif Display', '--font-dmserif', 'serif'],
      ['Lora', '--font-lora', 'serif'],
      ['Manrope', '--font-manrope', 'sans-serif'],
      ['Poppins', '--font-poppins', 'sans-serif'],
      ['Nunito Sans', '--font-nunito', 'sans-serif'],
    ].map(([name, cssVariable, fallback]) => ({
      provider: fontProviders.google(),
      name,
      cssVariable,
      weights: /** @type {[number, number]} */ ([400, 500]),
      styles: /** @type {['normal']} */ (['normal']),
      subsets: /** @type {[string]} */ (['latin']),
      fallbacks: /** @type {[string]} */ ([fallback]),
    })),
    // Las de las plantillas llevan también fino (300) y negrita (700), para el grosor de títulos que eligen.
    ...[
      ['Rubik', '--font-rubik'],
      ['Inter Tight', '--font-intertight'],
      ['DM Sans', '--font-dmsans'],
    ].map(([name, cssVariable]) => ({
      provider: fontProviders.google(),
      name,
      cssVariable,
      weights: /** @type {[number, number, number, number]} */ ([300, 400, 500, 700]),
      styles: /** @type {['normal']} */ (['normal']),
      subsets: /** @type {[string]} */ (['latin']),
      fallbacks: /** @type {[string]} */ (['sans-serif']),
    })),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
