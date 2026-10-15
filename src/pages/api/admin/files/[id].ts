import type { APIRoute } from 'astro';
import { UUID_RE } from '../../../../admin/schema';
import { one } from '../../../../admin/server/db';
import { fail } from '../../../../admin/server/http';

export const prerender = false;

// Solo estas imágenes se muestran en el navegador; el resto (incluido SVG y HTML) se descarga.
const INLINE = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']);

/** Contenido de un archivo subido. Requiere sesión (lo comprueba el middleware). */
export const GET: APIRoute = async ({ params }) => {
  if (!UUID_RE.test(params.id ?? '')) return fail(404, 'El archivo no existe.');
  const file = await one<{ name: string; mime: string; data: Buffer }>(
    'SELECT name, mime, data FROM admin.files WHERE id = ?',
    [params.id],
  );
  if (!file) return fail(404, 'El archivo no existe.');
  const inline = INLINE.has(file.mime);
  return new Response(new Uint8Array(file.data), {
    headers: {
      'content-type': inline ? file.mime : 'application/octet-stream',
      'content-disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; sandbox",
      // El id no cambia nunca: se puede guardar en la caché del navegador (no en cachés compartidas).
      'cache-control': 'private, max-age=31536000, immutable',
    },
  });
};
