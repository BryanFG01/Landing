// Validación de la definición de un módulo al guardarla. Además de las reglas de schema.ts, comprueba contra la base
// que la tabla existe y tiene clave primaria, o que la consulta se ejecuta, y con qué columnas.

import { parseModuleDefinition, type ColumnDataType, type FieldConfig, type ModuleDefinition } from '../schema';
import { friendlyDbError } from './db';
import { checkQuerySql, columnMaps, describeQuery, getTable, queryFields, QueryShapeError } from './datos';
import { checkRelations } from './modules';

export type DefinitionResult = { ok: true; value: ModuleDefinition } | { ok: false; errors: string[] };

/** Mensaje para un error al probar una consulta. */
export function queryErrorMessage(e: unknown) {
  if (e instanceof QueryShapeError) return e.message;
  const friendly = friendlyDbError(e);
  if (friendly) return friendly;
  if (e instanceof Error && 'code' in e) return `Error en la consulta: ${e.message}`;
  return null;
}

export async function validateDefinition(input: unknown): Promise<DefinitionResult> {
  const raw = { ...((input ?? {}) as Record<string, unknown>) };
  let columns: Map<string, ColumnDataType> | undefined;

  if (raw.source_type === 'table') {
    const name = typeof raw.source === 'string' ? raw.source.trim() : '';
    const table = name ? await getTable(name) : null;
    if (!table) return { ok: false, errors: [name ? `La tabla "${name}" no existe en el esquema datos.` : 'Elige la tabla.'] };
    if (table.kind !== 'tabla') {
      return { ok: false, errors: [`"${name}" es una vista: para mostrarla usa un módulo de consulta (SELECT * FROM ${name}).`] };
    }
    if (!table.pk) {
      return { ok: false, errors: [`La tabla "${name}" necesita una clave primaria de una sola columna para poder editar filas.`] };
    }
    raw.source_pk = table.pk;
    columns = columnMaps(table).types;
  }

  if (raw.source_type === 'query') {
    const sql = typeof raw.source === 'string' ? raw.source : '';
    const error = checkQuerySql(sql);
    if (error) return { ok: false, errors: [error] };
    try {
      const described = await describeQuery(sql, 0);
      columns = new Map(described.columns.map((c) => [c.name, c.type]));
      // Las columnas (y su tipo) las manda la consulta; las etiquetas, el constructor.
      const labels = new Map(
        (Array.isArray(raw.fields) ? (raw.fields as FieldConfig[]) : []).map((f) => [f?.key, f?.label] as const),
      );
      raw.fields = queryFields(described.columns).map((f) => ({ ...f, label: labels.get(f.key) || f.label }));
    } catch (e) {
      const msg = queryErrorMessage(e);
      if (msg) return { ok: false, errors: [msg] };
      throw e;
    }
  }

  const parsed = parseModuleDefinition(raw, { columns });
  if (!parsed.ok) return parsed;

  const relErrors = await checkRelations(parsed.value, async (t) => (await getTable(t))?.columns.map((c) => c.name) ?? null);
  if (relErrors.length) return { ok: false, errors: relErrors };
  return parsed;
}
