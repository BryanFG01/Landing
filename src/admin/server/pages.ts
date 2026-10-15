// Resumen del inicio del panel.
import type { DashboardStats } from '../ui/DashboardView';
import { query, one } from './db';

export async function getDashboardStats(): Promise<DashboardStats> {
  const [modules, total, admins, recent] = await Promise.all([
    query<DashboardStats['modules'][number]>(
      `SELECT m.module_key, m.name, m.icon, m.description,
         (SELECT COUNT(*)::int FROM admin.records r WHERE r.module_id = m.id) AS records
       FROM admin.modules m WHERE m.is_active ORDER BY m.sort_order, m.name`,
    ),
    one<{ n: number }>('SELECT COUNT(*)::int AS n FROM admin.records'),
    one<{ n: number }>('SELECT COUNT(*)::int AS n FROM admin.users WHERE is_active'),
    query<DashboardStats['recent'][number]>(
      `SELECT a.action, a.created_at, a.record_id, u.name AS user, m.name AS module
       FROM admin.audit_log a
       LEFT JOIN admin.users u ON u.id = a.user_id
       LEFT JOIN admin.modules m ON m.id = a.module_id
       WHERE a.action NOT IN ('login_failed', 'logout')
       ORDER BY a.id DESC LIMIT 10`,
    ),
  ]);
  return { modules, totalRecords: total?.n ?? 0, admins: admins?.n ?? 0, recent };
}
