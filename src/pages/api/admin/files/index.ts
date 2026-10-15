import type { APIRoute } from 'astro';
import type { FileRef } from '../../../../admin/schema';
import { one } from '../../../../admin/server/db';
import { fail, json } from '../../../../admin/server/http';

export const prerender = false;

/** Vercel no acepta cuerpos de más de 4,5 MB en una función. */
const FILE_MAX = 4 * 1024 * 1024;

/**
 * Sube un archivo (multipart, campo "file") y devuelve su referencia para guardarla en un campo de foto o archivo.
 * Pueden subir los administradores y los usuarios con permiso de edición en algún módulo.
 */
export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.adminUser!;
  if (user.role !== 'admin' && !(await one('SELECT 1 FROM admin.user_modules WHERE user_id = ? AND can_edit', [user.id]))) {
    return fail(403, 'No tienes permiso para subir archivos.');
  }
  if (Number(request.headers.get('content-length')) > FILE_MAX + 64 * 1024) {
    return fail(413, 'El archivo pesa más de 4 MB.');
  }

  let file: File | null = null;
  try {
    const value = (await request.formData()).get('file');
    file = value instanceof File ? value : null;
  } catch {
    return fail(400, 'No se pudo leer el archivo.');
  }
  if (!file || !file.size) return fail(400, 'Elige un archivo.');
  if (file.size > FILE_MAX) return fail(413, 'El archivo pesa más de 4 MB.');

  const name = (file.name || 'archivo').replace(/[\\/\0]/g, '_').slice(0, 200);
  const mime = (file.type || 'application/octet-stream').slice(0, 100);
  const row = await one<{ id: string }>(
    'INSERT INTO admin.files (name, mime, size, data, created_by) VALUES (?, ?, ?, ?, ?) RETURNING id',
    [name, mime, file.size, Buffer.from(await file.arrayBuffer()), user.id],
  );
  const ref: FileRef = { id: row!.id, name, mime, size: file.size };
  return json({ file: ref }, 201);
};
