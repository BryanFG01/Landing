// Decisiones de la consola SQL y su panel de tablas (sin React).
import type { TableInfo } from '@/features/admin/core/ui/lib/sql';

/** Ctrl + Enter (o Cmd + Enter en Mac) ejecuta la consulta desde el editor. */
export const isRunShortcut = (e: { ctrlKey: boolean; metaKey: boolean; key: string }) =>
  (e.ctrlKey || e.metaKey) && e.key === 'Enter';

/** Consulta para ver las primeras filas de una tabla o vista. */
export const rowsQuery = (name: string) => `SELECT * FROM ${name} LIMIT 100`;

/** Lo que el panel de tablas pinta según el tipo de objeto: solo una tabla con clave primaria se edita en un módulo. */
export function tableFlags(t: TableInfo) {
  const isTable = t.kind === 'tabla';
  return {
    isView: t.kind === 'vista',
    editable: isTable && !!t.pk,
    withoutPk: isTable && !t.pk,
    icon: isTable ? 'table' : 'eye',
  };
}
