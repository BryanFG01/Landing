// Constructor de módulos: datos listos para pintar las piezas del editor (qué controles lleva cada campo, opciones de
// los selectores de origen, tabla y filtro). Sin React: los componentes solo reciben el resultado.
import {
  FILTER_CONTROLS,
  SOURCE_TYPES,
  type FieldConfig,
  type FilterConfig,
  type SourceType,
} from '@/features/admin/core/domain/schema';
import type { TableInfo } from '@/features/admin/core/ui/lib/sql';
import { filterControls, type Choice, type EditorModule, type SourceColumn } from './moduleEditor';

/** Número opcional de un input: vacío → sin límite. */
export const optionalNumber = (v: string) => (v === '' ? undefined : Number(v));

/** Qué ajustes extra muestra la fila de un campo según su tipo. */
export function fieldKinds(field: FieldConfig) {
  return {
    isNumber: field.type === 'number' || field.type === 'currency',
    isText: field.type === 'text' || field.type === 'textarea',
    isList: field.type === 'select' || field.type === 'multiselect',
    isRelation: field.type === 'relation',
  };
}

/** Campos del módulo relacionado que se pueden mostrar (sin módulo elegido, el selector queda desactivado). */
export function relationLabelChoices(modules: EditorModule[], relationModule: string | undefined) {
  const target = modules.find((m) => m.module_key === relationModule);
  return {
    hasTarget: !!target,
    options: (target?.fields ?? []).map((f) => ({ value: f.key, label: f.label })),
  };
}

/** Tipos de origen en el orden en que se ofrecen. */
export const SOURCE_CHOICES = Object.entries(SOURCE_TYPES) as [SourceType, string][];

/** Selector de tabla: solo tablas reales (no vistas); las que no tienen clave primaria se ven pero no se eligen. */
export function tableSourceView(tables: TableInfo[] | null) {
  const realTables = (tables ?? []).filter((t) => t.kind === 'tabla');
  return {
    /** Ya se cargaron y no hay ninguna: se invita a crear la primera. */
    noTables: !!tables && !realTables.length,
    options: realTables.map((t) => ({ value: t.name, label: t.pk ? t.name : `${t.name} (sin clave primaria)`, disabled: !t.pk })),
  };
}

/** Controles posibles para el campo de un filtro, como opciones del selector. */
export const filterControlChoices = (mod: EditorModule, sourceColumns: SourceColumn[], field: string): Choice[] =>
  filterControls(mod, sourceColumns, field).map((c) => ({ value: c, label: FILTER_CONTROLS[c] }));

/** Los filtros numéricos llevan además la condición (igual, mayor, menor…). */
export const isNumberFilter = (filter: FilterConfig) => filter.control === 'number';
