// Ajustes del panel guardados en admin.settings (clave → jsonb).

import { DEFAULT_APPEARANCE, parseAppearance, type Appearance } from '@/features/admin/core/domain/schema';
import { exec, one } from '@/shared/server/db';

/** Apariencia guardada, completada con los valores por defecto. Si la base falla, los valores por defecto. */
export async function getAppearance(): Promise<Appearance> {
  try {
    const row = await one<{ value: Partial<Appearance> }>("SELECT value FROM admin.settings WHERE key = 'appearance'");
    if (!row) return DEFAULT_APPEARANCE;
    const parsed = parseAppearance({ ...DEFAULT_APPEARANCE, ...row.value });
    return parsed.ok ? parsed.value : DEFAULT_APPEARANCE;
  } catch (e) {
    console.error('[admin] no se pudo leer la apariencia:', e);
    return DEFAULT_APPEARANCE;
  }
}

export async function saveAppearance(a: Appearance) {
  await exec(
    `INSERT INTO admin.settings (key, value) VALUES ('appearance', ?::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [JSON.stringify(a)],
  );
}
