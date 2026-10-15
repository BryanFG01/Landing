// Cliente de la API del admin. Toda llamada del navegador a /api/admin pasa por aquí (lo usan los hooks).
import type { FileRef } from '../schema';

export class ApiError extends Error {
  status: number;
  fieldErrors: Record<string, string>;
  errors: string[];

  constructor(status: number, body: Record<string, unknown>) {
    super(typeof body.error === 'string' ? body.error : 'Algo ha fallado. Inténtalo de nuevo.');
    this.status = status;
    this.fieldErrors = (body.fieldErrors as Record<string, string>) ?? {};
    this.errors = (body.errors as string[]) ?? [];
  }
}

/** Sesión caducada: al login, volviendo luego a la página actual. */
export function loginRedirect() {
  location.href = `/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`;
}

/** Mensaje de un error cualquiera para mostrarlo a la persona. */
export const errorMessage = (e: unknown, fallback = 'Algo ha fallado. Inténtalo de nuevo.') =>
  e instanceof Error && e.message ? e.message : fallback;

async function parse<T>(res: Response, path: string): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 401 && !path.startsWith('/auth/')) loginRedirect();
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

export async function api<T = unknown>(
  path: string,
  init: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    method: init.method ?? 'GET',
    headers: init.body === undefined ? undefined : { 'content-type': 'application/json' },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    signal: init.signal,
    credentials: 'same-origin',
  });
  return parse<T>(res, path);
}

/** La petición se canceló porque la vista cambió (no es un error que mostrar). */
export const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError';

/** Sube un archivo a /api/admin/files. `publico`: imagen de la landing (se sirve sin sesión en /media/<id>). */
export async function uploadFile(file: File, { publico = false } = {}) {
  const form = new FormData();
  form.append('file', file);
  const path = `/files${publico ? '?publico=1' : ''}`;
  const res = await fetch(`/api/admin${path}`, { method: 'POST', body: form, credentials: 'same-origin' });
  return (await parse<{ file: FileRef }>(res, path)).file;
}

/** Descarga un archivo de la API (exportar) con el nombre que manda el servidor. */
export async function download(path: string) {
  const res = await fetch(`/api/admin${path}`, { credentials: 'same-origin' });
  if (!res.ok) throw new ApiError(res.status, (await res.json().catch(() => ({}))) as Record<string, unknown>);
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? 'descarga';
  saveBlob(await res.blob(), name);
}

/** Guarda un archivo generado en el navegador (plantillas, descargas). */
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
