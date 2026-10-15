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
      DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
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
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
