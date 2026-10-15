// Resumen del inicio del panel.
import type { AdminUser, DashboardStats } from '../schema';
import { one, query } from './db';
import { accessMap, listModules } from './modules';
import { countRows } from './sources';

export async function getDashboardStats(user: AdminUser): Promise<DashboardStats> {
  const access = await accessMap(user);
  const visible = (await listModules()).filter((m) => m.is_active && access(m.id) !== 'none');
  visible.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
  const ids = visible.map((m) => m.id);

  const [counts, admins, recent] = await Promise.all([
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
  };
}
