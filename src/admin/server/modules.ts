import type { ColumnConfig, FieldConfig, FilterConfig, ModuleDefinition, ModuleGroup, NavModule } from '../schema';
import { exec, one, query } from './db';

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
};

export type LoadedModule = ModuleDefinition & { id: number };

// Las columnas jsonb llegan ya como objetos.
const COLUMNS = `id, module_key, name, description, group_id, icon, sort_order, fields, column_configs, filters,
  default_sort, default_dir, page_size, is_active`;

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

/** Lo que pinta el sidebar: grupos y módulos activos, en orden. */
export async function getNav(): Promise<{ groups: ModuleGroup[]; modules: NavModule[] }> {
  const [groups, modules] = await Promise.all([
    listGroups(),
    query<NavModule>(
      'SELECT id, module_key, name, icon, group_id FROM admin.modules WHERE is_active ORDER BY sort_order, name',
    ),
  ]);
  return { groups, modules };
}

/** Comprueba que los módulos relacionados existen y tienen el campo de etiqueta. */
export async function checkRelations(def: ModuleDefinition): Promise<string[]> {
  const errors: string[] = [];
  for (const f of def.fields.filter((f) => f.type === 'relation')) {
    const target = await getModuleByKey(f.relation_module!, { activeOnly: false });
    if (!target) errors.push(`Campo ${f.label}: el módulo "${f.relation_module}" no existe.`);
    else if (!target.fields.some((tf) => tf.key === f.relation_label)) {
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
];

export async function insertModule(d: ModuleDefinition) {
  const row = await one<{ id: number }>(
    `INSERT INTO admin.modules (module_key, name, description, group_id, icon, sort_order, fields, column_configs,
       filters, default_sort, default_dir, page_size, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?::jsonb, ?, ?, ?, ?) RETURNING id`,
    moduleParams(d),
  );
  return row!.id;
}

export async function updateModule(id: number, d: ModuleDefinition) {
  await exec(
    `UPDATE admin.modules SET module_key = ?, name = ?, description = ?, group_id = ?, icon = ?, sort_order = ?,
       fields = ?::jsonb, column_configs = ?::jsonb, filters = ?::jsonb, default_sort = ?, default_dir = ?,
       page_size = ?, is_active = ?, updated_at = now()
     WHERE id = ?`,
    [...moduleParams(d), id],
  );
}

/** Módulos cuyos campos apuntan a este (no se puede borrar ni renombrar sin romperlos). */
export async function modulesReferencing(key: string) {
  const all = await listModules();
  return all.filter((m) => m.fields.some((f) => f.type === 'relation' && f.relation_module === key));
}

export async function countRecords(moduleId: number) {
  const row = await one<{ n: number }>('SELECT COUNT(*)::int AS n FROM admin.records WHERE module_id = ?', [moduleId]);
  return row?.n ?? 0;
}

// ─── Grupos ──────────────────────────────────────────────────────────────────

export function listGroups() {
  return query<ModuleGroup>('SELECT id, name, sort_order FROM admin.module_groups ORDER BY sort_order, name');
}
