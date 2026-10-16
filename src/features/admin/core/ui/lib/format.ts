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

/**
 * Enlace de WhatsApp para un teléfono de un registro. Un celular colombiano de 10 dígitos (3xx…) lleva el indicativo 57;
 * los que ya traen indicativo se dejan igual. Null si no parece un teléfono.
 */
export function whatsappHref(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return null;
  const full = digits.length === 10 && digits.startsWith('3') ? `57${digits}` : digits;
  return `https://wa.me/${full}`;
}

const pesosFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
/** 40000 → "$40.000". */
export const formatPesos = (n: number) => pesosFmt.format(n).replace(/\s/g, '');

const dayFmt = new Intl.DateTimeFormat('es-CO', { weekday: 'short', day: 'numeric' });
const weekdayFmt = new Intl.DateTimeFormat('es-CO', { weekday: 'short' });
const atNoon = (day: string) => new Date(`${day}T12:00:00`);
/** "2026-10-15" → "jue 15" (para el gráfico de pedidos por día). */
export const dayShort = (day: string) => dayFmt.format(atNoon(day)).replaceAll('.', '');
/** "2026-10-15" → { weekday: "jue", num: "15" } (en móvil el gráfico solo muestra el número). */
export const dayParts = (day: string) => ({ weekday: weekdayFmt.format(atNoon(day)).replaceAll('.', ''), num: String(Number(day.slice(8))) });

/** Alto de cada barra del gráfico, en % del día con más pedidos (mínimo visible si hubo alguno). */
export function barHeights(values: number[]) {
  const max = Math.max(...values, 1);
  return values.map((v) => (v ? Math.max(6, Math.round((v / max) * 100)) : 0));
}

/** Texto del contador de un módulo en el inicio. */
export function recordsLabel(records: number | null, sourceType: string) {
  if (records !== null) return `${records} registro(s)`;
  return sourceType === 'query' ? 'Consulta' : 'Tabla no disponible';
}
