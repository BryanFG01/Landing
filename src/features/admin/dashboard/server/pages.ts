// Resumen del inicio del panel.
import { topProducts, WEB_ORDERS_MODULE, type SalesStats } from '@/features/admin/core/domain/sales';
import type { AdminUser, DashboardStats } from '@/features/admin/core/domain/schema';
import { one, query } from '@/shared/server/db';
import { accessMap, listModules } from '@/features/admin/core/server/modules';
import { countRows } from '@/features/admin/core/server/sources';
import { webEventTotals } from './webEvents';

// Días y semanas en hora de Colombia (la base guarda en UTC).
const TZ = 'America/Bogota';

/** Números de los pedidos de la web: hoy, 7 días, pendientes, ventas, por día (14) y más pedidos (30 días). */
async function salesStats(moduleId: number): Promise<SalesStats> {
  const [totals, byDay, products, web] = await Promise.all([
    one<{ today: number; week: number; pending: number; week_total: string | null }>(
      `SELECT
         count(*) FILTER (WHERE (created_at AT TIME ZONE '${TZ}')::date = (now() AT TIME ZONE '${TZ}')::date)::int AS today,
         count(*) FILTER (WHERE created_at >= now() - interval '7 days')::int AS week,
         count(*) FILTER (WHERE data->>'estado' = 'pendiente')::int AS pending,
         sum((data->>'total')::numeric) FILTER (WHERE created_at >= now() - interval '7 days' AND data->>'estado' <> 'cancelado') AS week_total
       FROM admin.records WHERE module_id = ?`,
      [moduleId],
    ),
    query<{ day: string; n: number }>(
      `SELECT to_char(d, 'YYYY-MM-DD') AS day, count(r.id)::int AS n
       FROM generate_series((now() AT TIME ZONE '${TZ}')::date - 13, (now() AT TIME ZONE '${TZ}')::date, interval '1 day') d
       LEFT JOIN admin.records r ON r.module_id = ? AND (r.created_at AT TIME ZONE '${TZ}')::date = d::date
       GROUP BY d ORDER BY d`,
      [moduleId],
    ),
    query<{ productos: string | null }>(
      `SELECT data->>'productos' AS productos FROM admin.records
       WHERE module_id = ? AND created_at >= now() - interval '30 days' AND data->>'estado' <> 'cancelado'`,
      [moduleId],
    ),
    webEventTotals(),
  ]);
  return {
    today: totals?.today ?? 0,
    week: totals?.week ?? 0,
    pending: totals?.pending ?? 0,
    weekTotal: Number(totals?.week_total ?? 0),
    byDay,
    top: topProducts(products.map((p) => p.productos ?? '')),
    web: { visitas: web.visita, whatsapp: web.whatsapp, chats: web.chat },
  };
}

export async function getDashboardStats(user: AdminUser): Promise<DashboardStats> {
  const access = await accessMap(user);
  const visible = (await listModules()).filter((m) => m.is_active && access(m.id) !== 'none');
  visible.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const ids = visible.map((m) => m.id);

  const webOrders = visible.find((m) => m.module_key === WEB_ORDERS_MODULE && m.source_type === 'records');
  const [counts, admins, recent, sales] = await Promise.all([
    Promise.all(visible.map(countRows)),
    user.role === 'admin' ? one<{ n: number }>('SELECT COUNT(*)::int AS n FROM admin.users WHERE is_active') : null,
    // Los usuarios solo ven la actividad de sus módulos; los administradores, toda.
    query<DashboardStats['recent'][number]>(
      `SELECT a.action, a.created_at, a.record_id, u.name AS user, m.name AS module
       FROM admin.audit_log a
       LEFT JOIN admin.users u ON u.id = a.user_id
       LEFT JOIN admin.modules m ON m.id = a.module_id
       WHERE a.action NOT IN ('login_failed', 'logout', 'sql_error')
         ${user.role === 'admin' ? '' : 'AND a.module_id = ANY(?::int[])'}
       ORDER BY a.id DESC LIMIT 10`,
      user.role === 'admin' ? [] : [ids],
    ),
    webOrders ? salesStats(webOrders.id) : null,
  ]);

  const modules = visible.map((m, i) => ({
    module_key: m.module_key,
    name: m.name,
    icon: m.icon ?? null,
    description: m.description ?? null,
    source_type: m.source_type,
    records: counts[i],
  }));
  return {
    modules,
    totalRecords: counts.reduce<number>((s, n) => s + (n ?? 0), 0),
    admins: admins?.n ?? null,
    recent,
    sales,
  };
}
