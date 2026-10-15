// Cliente de la API del admin.

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

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`/api/admin${path}`, {
    method: init.method ?? 'GET',
    headers: init.body !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    credentials: 'same-origin',
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (res.status === 401 && !path.startsWith('/auth/')) {
    location.href = `/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`;
  }
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

/** Sube un archivo a /api/admin/files y devuelve su referencia. */
export async function uploadFile(file: File) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/admin/files', { method: 'POST', body: form, credentials: 'same-origin' });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(res.status, body);
  return body.file as import('../schema').FileRef;
}

/** Descarga un archivo de la API (exportar CSV) con el nombre que manda el servidor. */
export async function download(path: string) {
  const res = await fetch(`/api/admin${path}`, { credentials: 'same-origin' });
  if (!res.ok) throw new ApiError(res.status, (await res.json().catch(() => ({}))) as Record<string, unknown>);
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? 'descarga.csv';
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
