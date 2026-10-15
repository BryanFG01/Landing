// Datos de módulos preparados para pintar en el constructor.
import type { ModuleDefinition, ModuleGroup } from '../../schema';

export type Mod = ModuleDefinition & { id: number };

export function sourceLabel(m: Pick<ModuleDefinition, 'source_type' | 'source'>) {
  if (m.source_type === 'table') return `Tabla ${m.source}`;
  if (m.source_type === 'query') return 'Consulta SQL';
  return 'Registros';
}

/** Filas de la tabla del constructor. */
export function moduleRows(modules: Mod[], groups: ModuleGroup[]) {
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  return modules.map((m) => ({
    id: m.id,
    name: m.name,
    module_key: m.module_key,
    icon: m.icon,
    group: m.group_id ? (groupName.get(m.group_id) ?? '—') : 'Sin grupo',
    source: sourceLabel(m),
    fields: m.fields.length,
    filters: m.filters.length,
    is_active: m.is_active,
  }));
}

export type ModuleRow = ReturnType<typeof moduleRows>[number];
