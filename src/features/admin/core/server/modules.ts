import type {
  AdminUser,
  ColumnConfig,
  FieldConfig,
  FilterConfig,
  ModuleAccess,
  ModuleDefinition,
  ModuleGroup,
  NavModule,
  SourceType,
} from '../domain/schema';
import { hasPendingState } from '../domain/schema';
import { exec, one, query } from '@/shared/server/db';

type ModuleRow = {
  id: number;
  module_key: string;
  name: string;
  description: string | null;
  group_id: number | null;
  icon: string | null;
  sort_order: number;
  fields: FieldConfig[];
  column_configs: ColumnConfig[];
  filters: FilterConfig[];
  default_sort: string;
  default_dir: 'asc' | 'desc';
  page_size: number;
  is_active: boolean;
  source_type: SourceType;
  source: string | null;
  source_pk: string | null;
};

export type LoadedModule = ModuleDefinition & { id: number };

// Las columnas jsonb llegan ya como objetos.
const COLUMNS = `id, module_key, name, description, group_id, icon, sort_order, fields, column_configs, filters,
  default_sort, default_dir, page_size, is_active, source_type, source, source_pk`;

const toModule = (r: ModuleRow): LoadedModule => ({
  ...r,
  fields: r.fields ?? [],
  column_configs: r.column_configs ?? [],
  filters: r.filters ?? [],
});

export async function getModuleByKey(key: string, { activeOnly = true } = {}) {
  const row = await one<ModuleRow>(
    `SELECT ${COLUMNS} FROM admin.modules WHERE module_key = ?${activeOnly ? ' AND is_active' : ''}`,
    [key],
  );
  return row ? toModule(row) : null;
}

export async function getModuleById(id: number) {
  const row = await one<ModuleRow>(`SELECT ${COLUMNS} FROM admin.modules WHERE id = ?`, [id]);
  return row ? toModule(row) : null;
}

export async function listModules() {
  const rows = await query<ModuleRow>(
    `SELECT ${COLUMNS} FROM admin.modules ORDER BY group_id NULLS LAST, sort_order, name`,
  );
  return rows.map(toModule);
}

// ─── Permisos ────────────────────────────────────────────────────────────────

/** Acceso de un usuario a cada módulo. Los administradores tienen acceso total a todos. */
export async function accessMap(user: AdminUser): Promise<(moduleId: number) => ModuleAccess> {
  if (user.role === 'admin') return () => 'edit';
  const rows = await query<{ module_id: number; can_edit: boolean }>(
    'SELECT module_id, can_edit FROM admin.user_modules WHERE user_id = ?',
    [user.id],
  );
  const map = new Map(rows.map((r) => [r.module_id, r.can_edit ? 'edit' : 'view'] as const));
  return (id) => map.get(id) ?? 'none';
}

export async function moduleAccess(user: AdminUser, moduleId: number): Promise<ModuleAccess> {
  return (await accessMap(user))(moduleId);
}

/** Lo que pinta el sidebar: grupos y módulos activos que el usuario puede ver, en orden. */
export async function getNav(user: AdminUser): Promise<{ groups: ModuleGroup[]; modules: NavModule[] }> {
  const [groups, rows, access] = await Promise.all([
    listGroups(),
    query<Omit<NavModule, 'pending'> & { source_type: string; fields: FieldConfig[] }>(
      'SELECT id, module_key, name, icon, group_id, source_type, fields FROM admin.modules WHERE is_active ORDER BY sort_order, name',
    ),
    accessMap(user),
  ]);
  const visible = rows.filter((m) => access(m.id) !== 'none');
  const pending = await pendingCounts(visible.filter((m) => m.source_type === 'records' && hasPendingState(m.fields)).map((m) => m.id));
  const modules = visible.map(({ source_type: _s, fields: _f, ...m }) => ({ ...m, pending: pending.get(m.id) ?? 0 }));
  return { groups, modules };
}

/** Cuántos registros en estado "pendiente" tiene cada módulo (una sola consulta). */
async function pendingCounts(moduleIds: number[]) {
  if (!moduleIds.length) return new Map<number, number>();
  const rows = await query<{ module_id: number; n: number }>(
    `SELECT module_id, count(*)::int AS n FROM admin.records
     WHERE module_id = ANY(?::int[]) AND data->>'estado' = 'pendiente' GROUP BY module_id`,
    [moduleIds],
  );
  return new Map(rows.map((r) => [r.module_id, r.n]));
}

/** Comprueba que los módulos relacionados existen y tienen el campo de etiqueta. */
export async function checkRelations(def: ModuleDefinition, tableColumns?: (table: string) => Promise<string[] | null>) {
  const errors: string[] = [];
  for (const f of def.fields.filter((f) => f.type === 'relation')) {
    const target = await getModuleByKey(f.relation_module!, { activeOnly: false });
    if (!target) {
      errors.push(`Campo ${f.label}: el módulo "${f.relation_module}" no existe.`);
      continue;
    }
    if (target.source_type === 'query') {
      errors.push(`Campo ${f.label}: no se puede relacionar con un módulo de consulta.`);
      continue;
    }
    const labels =
      target.source_type === 'table' && target.source && tableColumns
        ? ((await tableColumns(target.source)) ?? [])
        : target.fields.map((tf) => tf.key);
    if (!labels.includes(f.relation_label!)) {
      errors.push(`Campo ${f.label}: el módulo "${target.name}" no tiene el campo "${f.relation_label}".`);
    }
  }
  return errors;
}

const moduleParams = (d: ModuleDefinition) => [
  d.module_key,
  d.name,
  d.description ?? null,
  d.group_id,
  d.icon ?? null,
  d.sort_order,
  JSON.stringify(d.fields),
  JSON.stringify(d.column_configs),
  JSON.stringify(d.filters),
  d.default_sort,
  d.default_dir,
  d.page_size,
  d.is_active,
  d.source_type,
  d.source,
  d.source_pk,
];

export async function insertModule(d: ModuleDefinition) {
  const row = await one<{ id: number }>(
    `INSERT INTO admin.modules (module_key, name, description, group_id, icon, sort_order, fields, column_configs,
       filters, default_sort, default_dir, page_size, is_active, source_type, source, source_pk)
     VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?::jsonb, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    moduleParams(d),
  );
  return row!.id;
}

export async function updateModule(id: number, d: ModuleDefinition) {
  await exec(
    `UPDATE admin.modules SET module_key = ?, name = ?, description = ?, group_id = ?, icon = ?, sort_order = ?,
       fields = ?::jsonb, column_configs = ?::jsonb, filters = ?::jsonb, default_sort = ?, default_dir = ?,
       page_size = ?, is_active = ?, source_type = ?, source = ?, source_pk = ?, updated_at = now()
     WHERE id = ?`,
    [...moduleParams(d), id],
  );
}

/** Módulos cuyos campos apuntan a este (no se puede borrar ni renombrar sin romperlos). */
export async function modulesReferencing(key: string) {
  const all = await listModules();
  return all.filter((m) => m.fields.some((f) => f.type === 'relation' && f.relation_module === key));
}

/** Registros guardados en el panel (solo módulos de tipo records; las tablas reales no se borran con el módulo). */
export async function countRecords(moduleId: number) {
  const row = await one<{ n: number }>('SELECT COUNT(*)::int AS n FROM admin.records WHERE module_id = ?', [moduleId]);
  return row?.n ?? 0;
}

// ─── Grupos ──────────────────────────────────────────────────────────────────

export function listGroups() {
  return query<ModuleGroup>('SELECT id, name, sort_order FROM admin.module_groups ORDER BY sort_order, name');
}
