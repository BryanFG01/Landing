// Contenido de la landing desde el panel: borrador, publicación (con historial) y despliegue en Vercel.

import { getSecret } from 'astro:env/server';
import { parseSite, SITE_DEFAULTS, type SiteContent } from '../../data/sitio';
import { exec, one, query, transaction } from './db';

type Row = { value: unknown; updated_at: Date };

async function getSetting(key: string) {
  return one<Row>('SELECT value, updated_at FROM admin.settings WHERE key = ?', [key]);
}

/** Borrador (o, si no hay, lo publicado, o el contenido por defecto) y su estado frente a lo publicado. */
export async function getSiteState() {
  const [draft, published, versions] = await Promise.all([
    getSetting('site_draft'),
    getSetting('site_published'),
    query<{ id: number; published_at: Date; published_by: string | null }>(
      `SELECT v.id, v.published_at, u.name AS published_by
       FROM admin.site_versions v LEFT JOIN admin.users u ON u.id = v.published_by
       ORDER BY v.id DESC LIMIT 15`,
    ),
  ]);
  const content = parseSite(draft?.value ?? published?.value ?? SITE_DEFAULTS).value;
  const publishedContent = published ? parseSite(published.value).value : SITE_DEFAULTS;
  return {
    content,
    unpublished: JSON.stringify(content) !== JSON.stringify(publishedContent),
    draft_updated_at: draft?.updated_at ?? null,
    published_at: published?.updated_at ?? null,
    versions,
    deploy_hook: !!getSecret('VERCEL_DEPLOY_HOOK'),
  };
}

export async function getDraft(): Promise<SiteContent> {
  const row = (await getSetting('site_draft')) ?? (await getSetting('site_published'));
  return row ? parseSite(row.value).value : SITE_DEFAULTS;
}

const upsert = (key: string) =>
  `INSERT INTO admin.settings (key, value) VALUES ('${key}', ?::jsonb)
   ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;

export async function saveDraft(content: SiteContent) {
  await exec(upsert('site_draft'), [JSON.stringify(content)]);
}

/** Copia el borrador a lo publicado y lo guarda en el historial. */
export async function publishDraft(userId: number) {
  const content = await getDraft();
  await transaction(async (q) => {
    await q(upsert('site_published'), [JSON.stringify(content)]);
    await q(upsert('site_draft'), [JSON.stringify(content)]);
    await q('INSERT INTO admin.site_versions (content, published_by) VALUES (?::jsonb, ?)', [JSON.stringify(content), userId]);
    // Se guardan las 50 últimas publicaciones.
    await q('DELETE FROM admin.site_versions WHERE id NOT IN (SELECT id FROM admin.site_versions ORDER BY id DESC LIMIT 50)');
  });
}

/** Lleva una versión publicada al borrador (para revisarla y volver a publicarla). */
export async function restoreVersion(id: number) {
  const row = await one<{ content: unknown }>('SELECT content FROM admin.site_versions WHERE id = ?', [id]);
  if (!row) return false;
  await saveDraft(parseSite(row.content).value);
  return true;
}

/**
 * Lanza un despliegue en Vercel con el Deploy Hook. El build vuelve a leer lo publicado.
 * 'sin_hook': no está configurado (lo publicado sale en el próximo despliegue normal).
 */
export async function triggerDeploy(): Promise<'ok' | 'sin_hook' | 'error'> {
  const hook = getSecret('VERCEL_DEPLOY_HOOK');
  if (!hook) return 'sin_hook';
  try {
    const res = await fetch(hook, { method: 'POST' });
    return res.ok ? 'ok' : 'error';
  } catch (e) {
    console.error('[sitio] el Deploy Hook falló:', e);
    return 'error';
  }
}
