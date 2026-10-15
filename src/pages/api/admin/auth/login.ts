import type { APIRoute } from 'astro';
import { createSession, login } from '../../../../admin/server/auth';
import { fail, json, readJson } from '../../../../admin/server/http';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, url }) => {
  const body = (await readJson(request)) as { email?: unknown; password?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password) return fail(400, 'Escribe tu correo y tu contraseña.');

  const result = await login(email, password);
  if (!result.ok) return fail(result.status, result.error);

  await createSession(result.user.id, cookies, url.protocol === 'https:');
  return json({ user: result.user });
};
