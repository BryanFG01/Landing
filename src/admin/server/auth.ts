import type { AstroCookies } from 'astro';
import type { AdminUser } from '../schema';
import { audit, exec, one } from './db';
import { verifyPassword } from './password';

export const SESSION_COOKIE = 'admin_session';
const SESSION_DAYS = 7;
const MAX_FAILED = 5;
const FAILED_WINDOW_MIN = 15;

const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const sha256 = async (s: string) => toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));

export type LoginResult = { ok: true; user: AdminUser } | { ok: false; error: string; status: number };

export async function login(email: string, password: string): Promise<LoginResult> {
  const subject = email.trim().toLowerCase();

  // Límite de intentos por correo: 5 fallos en 15 minutos.
  const failed = await one<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM admin.audit_log
     WHERE action = 'login_failed' AND subject = ? AND created_at >= now() - make_interval(mins => ?)`,
    [subject, FAILED_WINDOW_MIN],
  );
  if ((failed?.n ?? 0) >= MAX_FAILED) {
    return { ok: false, status: 429, error: `Demasiados intentos. Espera ${FAILED_WINDOW_MIN} minutos.` };
  }

  const row = await one<{ id: number; email: string; name: string; password_hash: string; is_active: boolean }>(
    'SELECT id, email, name, password_hash, is_active FROM admin.users WHERE lower(email) = ?',
    [subject],
  );

  // Se verifica igual aunque el usuario no exista, para no revelar qué correos hay por el tiempo de respuesta.
  const valid = await verifyPassword(password, row?.password_hash ?? 'pbkdf2$100000$AAAAAAAAAAAAAAAAAAAAAA==$AAAA');
  if (!row || !valid || !row.is_active) {
    await audit({ action: 'login_failed', subject });
    return { ok: false, status: 401, error: 'Correo o contraseña incorrectos.' };
  }

  await exec('UPDATE admin.users SET last_login_at = now() WHERE id = ?', [row.id]);
  await audit({ userId: row.id, action: 'login', subject });
  return { ok: true, user: { id: row.id, email: row.email, name: row.name } };
}

export async function createSession(userId: number, cookies: AstroCookies, secure: boolean) {
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const expires = new Date(Date.now() + SESSION_DAYS * 86_400_000);
  await exec('INSERT INTO admin.sessions (id, user_id, expires_at) VALUES (?, ?, ?)', [await sha256(token), userId, expires]);
  // Limpieza oportunista de sesiones caducadas.
  await exec('DELETE FROM admin.sessions WHERE expires_at < now()');
  cookies.set(SESSION_COOKIE, token, { httpOnly: true, secure, sameSite: 'lax', path: '/', expires });
}

export async function getSessionUser(cookies: AstroCookies): Promise<AdminUser | null> {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (!token || !/^[0-9a-f]{64}$/.test(token)) return null;
  return one<AdminUser>(
    `SELECT u.id, u.email, u.name FROM admin.sessions s
     JOIN admin.users u ON u.id = s.user_id
     WHERE s.id = ? AND s.expires_at > now() AND u.is_active`,
    [await sha256(token)],
  );
}

export async function destroySession(cookies: AstroCookies) {
  const token = cookies.get(SESSION_COOKIE)?.value;
  if (token) await exec('DELETE FROM admin.sessions WHERE id = ?', [await sha256(token)]);
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

/** Cierra todas las sesiones de un usuario (al desactivarlo o cambiarle la contraseña). */
export async function destroyUserSessions(userId: number) {
  await exec('DELETE FROM admin.sessions WHERE user_id = ?', [userId]);
}
