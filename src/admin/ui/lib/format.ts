// Formatos de texto comunes del panel (fechas, tamaños, actividad).

export const dateTimeFmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

/** "2026-10-15T08:24:00Z" → "15 oct 2026, 3:24 a. m." */
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

export const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

const ACTIONS: Record<string, string> = {
  create: 'creó un registro en',
  update: 'editó un registro de',
  delete: 'borró un registro de',
  import: 'importó registros en',
  export: 'exportó',
  module_create: 'creó el módulo',
  module_update: 'configuró el módulo',
  module_delete: 'borró un módulo',
  login: 'entró al panel',
  user_create: 'creó un usuario',
  user_update: 'editó un usuario',
  user_delete: 'borró un usuario',
  group_create: 'creó un grupo del menú',
  sql: 'ejecutó SQL en la consola',
  appearance_update: 'cambió la apariencia',
  site_draft: 'editó el borrador de la web',
  site_publish: 'publicó la web',
  site_restore: 'recuperó una versión de la web',
  web_order: 'hizo un pedido por el chat en',
};

/** Frase de la actividad reciente para una acción de la auditoría. */
export const describeAction = (action: string) => ACTIONS[action] ?? action;

/** Quién hizo la acción: el usuario del panel o, en los pedidos de la web, un cliente. */
export const activityActor = (a: { action: string; user: string | null }) =>
  a.user ?? (a.action === 'web_order' ? 'Un cliente' : 'Alguien');

/** Texto del contador de un módulo en el inicio. */
export function recordsLabel(records: number | null, sourceType: string) {
  if (records !== null) return `${records} registro(s)`;
  return sourceType === 'query' ? 'Consulta' : 'Tabla no disponible';
}
