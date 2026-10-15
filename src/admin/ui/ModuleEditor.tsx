// Constructor de módulos: lo que aquí se guarda es la fila de admin.modules que define el módulo entero
// (sidebar, formulario, tabla y filtros).
import * as React from 'react';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../components/ui/toast';
import { cn } from '../../components/lib/utils';
import {
  COLUMN_TYPES,
  columnTypeFor,
  FIELD_TYPES,
  FILTER_CONTROLS,
  filterControlsFor,
  ICONS,
  NUMBER_OPERATORS,
  SOURCE_TYPES,
  SYSTEM_FIELDS,
  type ColumnConfig,
  type ColumnDataType,
  type FieldConfig,
  type FieldType,
  type FilterConfig,
  type ModuleDefinition,
  type ModuleGroup,
  type SourceType,
} from '../schema';
import { PageHeader } from './AdminShell';
import { api, ApiError } from './api';
import { Icon } from './icons';
import { useNav } from './nav';
import { useRouter } from './router';
import { QUERY_HANDOFF_KEY, type TableInfo } from './SqlConsole';

type Mod = ModuleDefinition & { id?: number };

type Table = TableInfo & { suggested_fields: FieldConfig[] };
type QueryColumn = { name: string; type: ColumnDataType; array: boolean };
type Preview = { columns: QueryColumn[]; rows: Record<string, unknown>[]; fields: FieldConfig[] };

/** "Precio de venta" → "precio_de_venta" */
export function slugify(s: string) {
  const slug = s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  return /^[a-z]/.test(slug) ? slug : slug ? `c_${slug}`.slice(0, 48) : '';
}

const entries = <T extends string>(o: Record<T, string>) =>
  (Object.entries(o) as [T, string][]).map(([value, label]) => ({ value, label }));

const NEW_MODULE: Mod = {
  module_key: '',
  source_type: 'records',
  source: null,
  source_pk: null,
  name: '',
  description: '',
  group_id: null,
  icon: 'squares',
  sort_order: 0,
  fields: [{ key: 'nombre', label: 'Nombre', type: 'text', required: true }],
  column_configs: [],
  filters: [],
  default_sort: 'created_at',
  default_dir: 'desc',
  page_size: 20,
  is_active: true,
};

/** Columnas sugeridas: los primeros campos y, en registros, la fecha de creación. */
function suggestColumns(fields: FieldConfig[], source: SourceType = 'records', types?: Map<string, ColumnDataType>): ColumnConfig[] {
  const cols: ColumnConfig[] = fields
    .filter((f) => f.type !== 'textarea' && f.type !== 'file')
    .slice(0, source === 'query' ? 10 : 6)
    .map((f) => {
      const data_type = types?.get(f.key) ?? columnTypeFor(f.type);
      return {
        column: f.key,
        headerText: f.label,
        data_type,
        align: (data_type === 'number' || data_type === 'currency' ? 'right' : 'left') as ColumnConfig['align'],
        sortable: f.type !== 'multiselect' && f.type !== 'image',
        null_display: '—',
      };
    });
  if (source === 'records') {
    cols.push({ column: 'created_at', headerText: 'Creado', data_type: 'datetime', align: 'left', sortable: true, null_display: '—' });
  }
  return cols;
}

/** Filtros sugeridos: búsqueda general + listas, sí/no y fechas. */
function suggestFilters(fields: FieldConfig[]): FilterConfig[] {
  const out: FilterConfig[] = [{ name: 'buscar', label: 'Buscar', field: '*', control: 'text' }];
  for (const f of fields) {
    if (['select', 'multiselect', 'relation'].includes(f.type)) {
      out.push({ name: f.key, label: f.label, field: f.key, control: 'multiselect' });
    } else if (f.type === 'boolean' || f.type === 'date') {
      out.push({ name: f.key, label: f.label, field: f.key, control: filterControlsFor(f.type)[0] });
    }
  }
  return out;
}

/** Tipo de columna de PostgreSQL para cada tipo de campo, al generar el CREATE TABLE. */
const SQL_TYPES: Record<FieldType, string> = {
  text: 'text',
  textarea: 'text',
  email: 'text',
  url: 'text',
  phone: 'text',
  number: 'numeric',
  currency: 'numeric(14,2)',
  date: 'date',
  boolean: 'boolean',
  select: 'text',
  multiselect: 'text[]',
  relation: 'integer',
  image: 'jsonb',
  file: 'jsonb',
};

/** CREATE TABLE de partida a partir del nombre del módulo y de los campos que ya tenga. */
function createTableSql(name: string, fields: FieldConfig[]) {
  const table = slugify(name) || 'mi_tabla';
  const cols = fields.filter((f) => /^[a-z_][a-z0-9_]*$/.test(f.key) && !['id', 'creado', 'updated_at'].includes(f.key));
  const lines = [
    'id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY',
    ...(cols.length
      ? cols.map((f) =>
          f.type === 'boolean'
            ? `${f.key} boolean NOT NULL DEFAULT false`
            : `${f.key} ${SQL_TYPES[f.type]}${f.required ? ' NOT NULL' : ''}`,
        )
      : ['nombre text NOT NULL', 'descripcion text', 'precio numeric(14,2)', 'activo boolean NOT NULL DEFAULT true']),
    'creado timestamptz NOT NULL DEFAULT now()',
    'updated_at timestamptz',
  ];
  return `CREATE TABLE ${table} (\n  ${lines.join(',\n  ')}\n);`;
}

// Opciones de lista en texto: una por línea, "valor | Etiqueta" o solo "Etiqueta".
const optionsToText = (o: FieldConfig['options']) =>
  (o ?? []).map((x) => (slugify(x.label) === x.value ? x.label : `${x.value} | ${x.label}`)).join('\n');
const textToOptions = (t: string) =>
  t
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [a, b] = line.split('|').map((s) => s.trim());
      return b ? { value: a, label: b } : { value: slugify(a) || a, label: a };
    });

function move<T>(list: T[], i: number, delta: number) {
  const j = i + delta;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** Botones de ordenar y quitar de cada fila. */
function RowTools({ onUp, onDown, onRemove }: { onUp: () => void; onDown: () => void; onRemove: () => void }) {
  return (
    <div className="flex shrink-0 gap-1">
      <Button type="button" variant="ghost" size="icon" aria-label="Subir" onClick={onUp}>
        <Icon name="arrow-up" />
      </Button>
      <Button type="button" variant="ghost" size="icon" aria-label="Bajar" onClick={onDown}>
        <Icon name="arrow-down" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Quitar"
        className="text-destructive hover:text-destructive"
        onClick={onRemove}
      >
        <Icon name="trash" />
      </Button>
    </div>
  );
}

// ─── Campo ───────────────────────────────────────────────────────────────────

function FieldRow({
  field,
  index,
  autoKey,
  modules,
  columnChoices,
  onChange,
  tools,
}: {
  field: FieldConfig;
  index: number;
  autoKey: boolean;
  modules: Mod[];
  /** Módulos de tabla: la clave es una columna de la tabla. */
  columnChoices?: { value: string; label: string }[];
  onChange: (f: FieldConfig, keyTouched?: boolean) => void;
  tools: React.ReactNode;
}) {
  const [optionsText, setOptionsText] = React.useState(() => optionsToText(field.options));
  const target = modules.find((m) => m.module_key === field.relation_module);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground tabular-nums">{index + 1}.</span>
          {field.label || 'Campo sin nombre'}
          <Badge variant="muted" size="sm">
            {FIELD_TYPES[field.type]}
          </Badge>
        </p>
        {tools}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Etiqueta"
          value={field.label}
          onChange={(e) =>
            onChange({
              ...field,
              label: e.target.value,
              key: autoKey && !columnChoices ? slugify(e.target.value) : field.key,
            })
          }
        />
        {columnChoices ? (
          <Select
            label="Columna"
            options={columnChoices}
            value={field.key || undefined}
            placeholder="Elegir columna"
            onValueChange={(key) => onChange({ ...field, key }, true)}
          />
        ) : (
          <Input
            label="Clave"
            helperText="Nombre interno (slug)"
            value={field.key}
            onChange={(e) => onChange({ ...field, key: e.target.value.toLowerCase() }, true)}
          />
        )}
        <Select
          label="Tipo"
          options={entries(FIELD_TYPES)}
          value={field.type}
          onValueChange={(type) => onChange({ ...field, type: type as FieldType })}
        />
        <div className="flex items-end pb-1.5">
          <Switch
            label="Obligatorio"
            checked={field.required === true}
            onCheckedChange={(required) => onChange({ ...field, required })}
          />
        </div>
        <Input
          label="Texto de ejemplo"
          value={field.placeholder ?? ''}
          onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
        />
        <Input label="Ayuda" value={field.help ?? ''} onChange={(e) => onChange({ ...field, help: e.target.value })} />

        {(field.type === 'number' || field.type === 'currency') && (
          <>
            <Input
              label="Mínimo"
              type="number"
              value={field.min ?? ''}
              onChange={(e) => onChange({ ...field, min: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
            <Input
              label="Máximo"
              type="number"
              value={field.max ?? ''}
              onChange={(e) => onChange({ ...field, max: e.target.value === '' ? undefined : Number(e.target.value) })}
            />
          </>
        )}

        {(field.type === 'text' || field.type === 'textarea') && (
          <Input
            label="Máximo de caracteres"
            type="number"
            value={field.max_length ?? ''}
            onChange={(e) =>
              onChange({ ...field, max_length: e.target.value === '' ? undefined : Number(e.target.value) })
            }
          />
        )}

        {(field.type === 'select' || field.type === 'multiselect') && (
          <div className="sm:col-span-2 lg:col-span-4">
            <Textarea
              label="Opciones"
              helperText='Una por línea. Escribe "valor | Etiqueta" para fijar el valor guardado.'
              rows={4}
              value={optionsText}
              onChange={(e) => {
                setOptionsText(e.target.value);
                onChange({ ...field, options: textToOptions(e.target.value) });
              }}
            />
          </div>
        )}

        {field.type === 'relation' && (
          <>
            <Select
              label="Módulo relacionado"
              options={modules
                .filter((m) => m.module_key && m.source_type !== 'query')
                .map((m) => ({ value: m.module_key, label: m.name }))}
              value={field.relation_module || undefined}
              onValueChange={(relation_module) => onChange({ ...field, relation_module, relation_label: '' })}
            />
            <Select
              label="Campo que se muestra"
              options={(target?.fields ?? []).map((f) => ({ value: f.key, label: f.label }))}
              value={field.relation_label || undefined}
              disabled={!target}
              onValueChange={(relation_label) => onChange({ ...field, relation_label })}
            />
          </>
        )}
      </div>
    </Card>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────

export function ModuleEditor({
  initial,
  recordCount,
  groups,
  modules,
}: {
  initial: Mod | null;
  recordCount: number;
  groups: ModuleGroup[];
  modules: Mod[];
}) {
  const { toast } = useToast();
  const isNew = !initial?.id;
  const [mod, setMod] = React.useState<Mod>(() => {
    const base = initial ?? NEW_MODULE;
    return {
      ...base,
      column_configs: base.column_configs.length ? base.column_configs : suggestColumns(base.fields, base.source_type),
    };
  });
  // Mientras no se toque a mano, la clave sigue al nombre (módulo nuevo) o a la etiqueta (campo nuevo).
  const [keyTouched, setKeyTouched] = React.useState(!isNew);
  const [fieldKeyTouched, setFieldKeyTouched] = React.useState<boolean[]>(() => mod.fields.map(() => !isNew));
  const [fieldIds, setFieldIds] = React.useState<number[]>(() => mod.fields.map((_, i) => i));
  const nextId = React.useRef(mod.fields.length);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  // Clave guardada en la base (puede diferir de la que se está editando).
  const [savedKey, setSavedKey] = React.useState(initial?.module_key ?? '');
  const { path, navigate } = useRouter();
  const { refreshNav } = useNav();
  const [tables, setTables] = React.useState<Table[] | null>(null);
  const [preview, setPreview] = React.useState<Preview | null>(null);
  const [previewError, setPreviewError] = React.useState('');
  const [previewing, setPreviewing] = React.useState(false);
  // SQL de la tabla escrito desde el constructor (CREATE TABLE / ALTER TABLE).
  const [tableSql, setTableSql] = React.useState<string | null>(null);
  const [tableSqlError, setTableSqlError] = React.useState('');
  const [runningTableSql, setRunningTableSql] = React.useState(false);

  const set = (patch: Partial<Mod>) => setMod((m) => ({ ...m, ...patch }));
  const otherModules = modules.filter((m) => m.id !== mod.id);
  const table = tables?.find((t) => t.name === mod.source);

  React.useEffect(() => {
    if (mod.source_type !== 'table' || tables) return;
    api<{ tables: Table[] }>('/tables')
      .then((r) => setTables(r.tables))
      .catch(() => setTables([]));
  }, [mod.source_type, tables]);

  /** Sustituye todos los campos (al traer columnas de una tabla o probar una consulta). */
  function replaceFields(fields: FieldConfig[], patch: Partial<Mod> = {}) {
    setMod((m) => ({ ...m, fields, ...patch }));
    setFieldKeyTouched(fields.map(() => true));
    setFieldIds(fields.map(() => nextId.current++));
  }

  /** Módulo sobre una tabla: campos, columnas y filtros sugeridos a partir de sus columnas. */
  function applyTable(t: Table) {
    const types = new Map(t.columns.map((c) => [c.name, c.data_type as ColumnDataType]));
    const fields = t.suggested_fields;
    const pkCol: ColumnConfig = { column: t.pk!, headerText: 'ID', data_type: 'number', align: 'left', sortable: true, null_display: '—' };
    replaceFields(fields, {
      source: t.name,
      source_pk: t.pk,
      column_configs: [pkCol, ...suggestColumns(fields, 'table', types).filter((c) => c.column !== t.pk)],
      filters: suggestFilters(fields),
      default_sort: t.pk ?? '',
      ...(mod.name ? {} : { name: t.name.charAt(0).toUpperCase() + t.name.slice(1).replace(/_/g, ' ') }),
      ...(keyTouched ? {} : { module_key: slugify(t.name) }),
    });
  }

  /**
   * Ejecuta el SQL de la tabla (crear o cambiar columnas), recarga las tablas y trae sus columnas al módulo.
   * Usa la misma API que la consola, con cambios permitidos y el mismo rol limitado al esquema datos.
   */
  async function runTableSql() {
    if (!tableSql?.trim()) return;
    setRunningTableSql(true);
    setTableSqlError('');
    try {
      await api('/sql/run', { method: 'POST', body: { sql: tableSql, allow_write: true } });
      const r = await api<{ tables: Table[] }>('/tables');
      setTables(r.tables);
      // La tabla afectada: la del CREATE/ALTER TABLE, o la que ya estaba elegida.
      const name = /\b(?:create|alter)\s+table\s+(?:if\s+(?:not\s+)?exists\s+)?(?:datos\.)?"?([a-z_][a-z0-9_]*)/i.exec(tableSql)?.[1]?.toLowerCase();
      const t = r.tables.find((x) => x.name === (name ?? mod.source));
      if (t?.pk) applyTable(t);
      else if (t) set({ source: t.name });
      setTableSql(null);
      toast({ variant: 'success', title: t ? `Tabla ${t.name} lista` : 'SQL ejecutado' });
    } catch (e) {
      setTableSqlError(e instanceof Error ? e.message : 'No se pudo ejecutar.');
    } finally {
      setRunningTableSql(false);
    }
  }

  async function runPreview(sql = mod.source ?? '') {
    setPreviewing(true);
    setPreviewError('');
    try {
      const r = await api<Preview>('/sql/preview', { method: 'POST', body: { sql } });
      setPreview(r);
      const labels = new Map(mod.fields.map((f) => [f.key, f.label]));
      const fields = r.fields.map((f) => ({ ...f, label: labels.get(f.key) ?? f.label }));
      const types = new Map(r.columns.map((c) => [c.name, c.type]));
      const names = new Set(r.columns.map((c) => c.name));
      // Las columnas y filtros que ya no existen en la consulta se quitan; si no queda ninguna, se sugieren.
      const kept = mod.column_configs.filter((c) => names.has(c.column));
      replaceFields(fields, {
        column_configs: kept.length ? kept : suggestColumns(fields, 'query', types),
        filters: mod.filters.filter((f) => f.field === '*' || names.has(f.field)),
        default_sort: names.has(mod.default_sort) ? mod.default_sort : (r.columns[0]?.name ?? ''),
      });
    } catch (e) {
      setPreview(null);
      setPreviewError(e instanceof Error ? e.message : 'No se pudo probar la consulta.');
    } finally {
      setPreviewing(false);
    }
  }

  // Al llegar desde la consola SQL: ?tabla=<nombre> o ?origen=consulta (el SQL viene en sessionStorage).
  const started = React.useRef(false);
  React.useEffect(() => {
    if (!isNew || started.current) return;
    started.current = true;
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const tabla = params.get('tabla');
    if (tabla) {
      set({ source_type: 'table', source: tabla, fields: [], column_configs: [], filters: [] });
      api<{ tables: Table[] }>('/tables').then((r) => {
        setTables(r.tables);
        const t = r.tables.find((x) => x.name === tabla);
        if (t?.pk) applyTable(t);
      });
    } else if (params.get('origen') === 'consulta') {
      let sql = '';
      try {
        sql = sessionStorage.getItem(QUERY_HANDOFF_KEY) ?? '';
        sessionStorage.removeItem(QUERY_HANDOFF_KEY);
      } catch {}
      set({ source_type: 'query', source: sql, fields: [], column_configs: [], filters: [], icon: 'chart' });
      if (sql) runPreview(sql);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Campos disponibles para columnas, orden y filtros.
  const sourceColumns =
    mod.source_type === 'table'
      ? (table?.columns ?? []).map((c) => ({ value: c.name, label: c.name, type: c.data_type as ColumnDataType }))
      : [];
  const fieldChoices = [
    ...mod.fields.filter((f) => f.key).map((f) => ({ value: f.key, label: f.label || f.key })),
    ...(mod.source_type === 'records'
      ? Object.entries(SYSTEM_FIELDS).map(([value, s]) => ({ value, label: `${s.label} (sistema)` }))
      : sourceColumns
          .filter((c) => !mod.fields.some((f) => f.key === c.value))
          .map((c) => ({ value: c.value, label: `${c.label} (columna)` }))),
  ];
  const typeOf = (key: string) =>
    mod.fields.find((f) => f.key === key)?.type ??
    (mod.source_type === 'records' ? SYSTEM_FIELDS[key]?.type : sourceColumns.find((c) => c.value === key)?.type);

  function updateField(i: number, f: FieldConfig, touched?: boolean) {
    set({ fields: mod.fields.map((x, j) => (j === i ? f : x)) });
    if (touched) setFieldKeyTouched((t) => t.map((x, j) => (j === i ? true : x)));
  }

  function addField() {
    set({ fields: [...mod.fields, { key: '', label: '', type: 'text' }] });
    setFieldKeyTouched((t) => [...t, false]);
    setFieldIds((ids) => [...ids, nextId.current++]);
  }

  function moveField(i: number, d: number) {
    set({ fields: move(mod.fields, i, d) });
    setFieldKeyTouched((t) => move(t, i, d));
    setFieldIds((ids) => move(ids, i, d));
  }

  function removeField(i: number) {
    set({ fields: mod.fields.filter((_, j) => j !== i) });
    setFieldKeyTouched((t) => t.filter((_, j) => j !== i));
    setFieldIds((ids) => ids.filter((_, j) => j !== i));
  }

  async function save() {
    setSaving(true);
    setErrors([]);
    try {
      if (isNew) {
        await api<{ id: number }>('/modules', { method: 'POST', body: mod });
        await refreshNav();
        toast({ variant: 'success', title: 'Módulo creado' });
        navigate(`/admin/m/${mod.module_key}`);
        return;
      }
      await api(`/modules/${mod.id}`, { method: 'PUT', body: mod });
      setSavedKey(mod.module_key);
      await refreshNav();
      toast({ variant: 'success', title: 'Módulo guardado' });
    } catch (err) {
      if (err instanceof ApiError && err.errors.length) setErrors(err.errors);
      else toast({ variant: 'error', title: err instanceof Error ? err.message : 'No se pudo guardar.' });
      // El que se desplaza es el <main> del layout, no la ventana.
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await api(`/modules/${mod.id}`, { method: 'DELETE' });
      await refreshNav();
      toast({ variant: 'success', title: 'Módulo borrado' });
      navigate('/admin/modulos');
    } catch (err) {
      setConfirmDelete(false);
      toast({ variant: 'error', title: err instanceof Error ? err.message : 'No se pudo borrar.' });
    }
  }

  return (
    <>
      <PageHeader
        title={isNew ? 'Nuevo módulo' : `Configurar · ${initial!.name}`}
        description="Lo que configures aquí define el módulo completo: su entrada en el menú, el formulario, la tabla y los filtros."
        icon="wrench"
        actions={
          <>
            {!isNew && (
              <Button variant="outline" onClick={() => navigate(`/admin/m/${savedKey}`)}>
                Ver módulo
              </Button>
            )}
            <Button onClick={save} disabled={saving}>
              {saving ? 'Guardando…' : isNew ? 'Crear módulo' : 'Guardar cambios'}
            </Button>
          </>
        }
      />

      {errors.length > 0 && (
        <Alert variant="error" title="Revisa la configuración" className="mb-4">
          <ul className="list-disc space-y-0.5 pl-4">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Tabs defaultValue="general">
        <TabsList className="max-w-full overflow-x-auto">
          <TabsTrigger value="general">General</TabsTrigger>
          {mod.source_type !== 'query' && <TabsTrigger value="campos">Campos ({mod.fields.length})</TabsTrigger>}
          <TabsTrigger value="tabla">Tabla ({mod.column_configs.length})</TabsTrigger>
          <TabsTrigger value="filtros">Filtros ({mod.filters.length})</TabsTrigger>
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="general" className="space-y-4">
          <Card className="space-y-4 p-5">
            <div>
              <h2 className="font-sans text-base font-semibold">Origen de los datos</h2>
              <p className="text-sm text-muted-foreground">De dónde salen las filas que muestra el módulo.</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {(Object.entries(SOURCE_TYPES) as [SourceType, string][]).map(([value, label]) => {
                const selected = mod.source_type === value;
                const help = {
                  records: 'Formulario libre. Los datos se guardan en el panel.',
                  table: 'Ver y editar una tabla real de la base. Se puede crear aquí mismo con SQL.',
                  query: 'Un SELECT: reportes, totales, cruces. Solo lectura.',
                }[value];
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={selected}
                    disabled={!isNew && !selected}
                    onClick={() => {
                      if (selected) return;
                      setPreview(null);
                      setPreviewError('');
                      replaceFields(value === 'records' ? NEW_MODULE.fields : [], {
                        source_type: value,
                        source: null,
                        source_pk: null,
                        column_configs: value === 'records' ? suggestColumns(NEW_MODULE.fields) : [],
                        filters: [],
                        default_sort: value === 'records' ? 'created_at' : '',
                      });
                    }}
                    className={cn(
                      'rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                      selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted',
                    )}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium">
                      <Icon name={value === 'records' ? 'file' : value === 'table' ? 'table' : 'code'} />
                      {label}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">{help}</span>
                  </button>
                );
              })}
            </div>
            {!isNew && <p className="text-xs text-muted-foreground">El tipo de origen no se cambia en un módulo ya creado.</p>}

            {mod.source_type === 'table' && (
              <div className="space-y-3">
                {tables && !tables.some((t) => t.kind === 'tabla') ? (
                  <Alert variant="info" title="Aún no hay tablas en la base">
                    Crea la primera aquí mismo con "Crear tabla con SQL".
                  </Alert>
                ) : (
                  <div className="flex flex-wrap items-end gap-3">
                    <Select
                      className="min-w-56 flex-1"
                      label="Tabla"
                      placeholder={tables ? 'Elegir tabla' : 'Cargando…'}
                      options={(tables ?? [])
                        .filter((t) => t.kind === 'tabla')
                        .map((t) => ({ value: t.name, label: t.pk ? t.name : `${t.name} (sin clave primaria)`, disabled: !t.pk }))}
                      value={mod.source ?? undefined}
                      onValueChange={(name) => set({ source: name })}
                    />
                    <Button variant="outline" disabled={!table?.pk} onClick={() => table && applyTable(table)}>
                      Traer columnas
                    </Button>
                  </div>
                )}
                {table && (
                  <p className="text-xs text-muted-foreground">
                    Clave primaria: <code className="font-mono">{table.pk ?? '—'}</code> · {table.columns.length} columnas. "Traer
                    columnas" rehace campos, columnas y filtros con lo que tiene la tabla.
                  </p>
                )}

                {/* Crear o cambiar la tabla con SQL sin salir del constructor. */}
                {tableSql === null ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTableSqlError('');
                        setTableSql(createTableSql(mod.name || mod.module_key, mod.fields));
                      }}
                    >
                      <Icon name="code" /> Crear tabla con SQL
                    </Button>
                    {table && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTableSqlError('');
                          setTableSql(`ALTER TABLE ${table.name}\n  ADD COLUMN nueva_columna text;`);
                        }}
                      >
                        <Icon name="code" /> Cambiar columnas de {table.name}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 rounded-lg border border-border p-3">
                    <Textarea
                      label="SQL de la tabla"
                      rows={9}
                      className="font-mono text-sm"
                      spellCheck={false}
                      helperText="Se ejecuta en el esquema datos. Al terminar, el módulo trae las columnas de la tabla. Para borrar columnas o tablas, usa la consola SQL."
                      value={tableSql}
                      onChange={(e) => setTableSql(e.target.value)}
                    />
                    {tableSqlError && (
                      <Alert variant="error" title="No se pudo ejecutar">
                        <span className="font-mono text-xs whitespace-pre-wrap">{tableSqlError}</span>
                      </Alert>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={runTableSql} disabled={runningTableSql || /\b(drop|truncate|delete)\b/i.test(tableSql)}>
                        <Icon name="terminal" /> {runningTableSql ? 'Ejecutando…' : 'Ejecutar y traer columnas'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setTableSql(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {mod.source_type === 'query' && (
              <div className="space-y-3">
                <Textarea
                  label="Consulta SQL"
                  rows={8}
                  className="font-mono text-sm"
                  spellCheck={false}
                  placeholder={"SELECT data->>'estado' AS estado, count(*) AS pedidos\nFROM registros WHERE modulo = 'pedidos'\nGROUP BY 1"}
                  helperText="Un solo SELECT sobre el esquema datos. Los registros del panel están en la vista registros. Los filtros y el orden se aplican sobre el resultado."
                  value={mod.source ?? ''}
                  onChange={(e) => set({ source: e.target.value })}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="outline" onClick={() => runPreview()} disabled={previewing || !mod.source?.trim()}>
                    <Icon name="terminal" /> {previewing ? 'Probando…' : 'Probar consulta'}
                  </Button>
                  {preview && (
                    <span className="text-sm text-muted-foreground">
                      {preview.columns.length} columnas · {preview.rows.length} fila(s) de muestra
                    </span>
                  )}
                </div>
                {previewError && (
                  <Alert variant="error" title="La consulta no funciona">
                    <span className="font-mono text-xs whitespace-pre-wrap">{previewError}</span>
                  </Alert>
                )}
                {preview && preview.rows.length > 0 && (
                  <div className="max-h-64 overflow-auto rounded-lg border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-muted">
                        <tr>
                          {preview.columns.map((c) => (
                            <th key={c.name} className="px-3 py-2 font-medium whitespace-nowrap">
                              {c.name} <span className="font-normal text-muted-foreground">({COLUMN_TYPES[c.type]})</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {preview.rows.map((row, i) => (
                          <tr key={i}>
                            {preview.columns.map((c) => (
                              <td key={c.name} className="px-3 py-1.5 font-mono whitespace-nowrap">
                                {row[c.name] === null ? '—' : typeof row[c.name] === 'object' ? JSON.stringify(row[c.name]) : String(row[c.name])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="space-y-5 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Nombre *"
                placeholder="Ej. Productos"
                value={mod.name}
                onChange={(e) => set({ name: e.target.value, ...(keyTouched ? {} : { module_key: slugify(e.target.value) }) })}
              />
              <Input
                label="Clave *"
                helperText={`URL: /admin/m/${mod.module_key || '…'}`}
                value={mod.module_key}
                onChange={(e) => {
                  setKeyTouched(true);
                  set({ module_key: e.target.value.toLowerCase() });
                }}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Descripción"
                  rows={2}
                  value={mod.description ?? ''}
                  onChange={(e) => set({ description: e.target.value })}
                />
              </div>
              <Select
                label="Grupo del menú"
                options={[{ value: '0', label: 'Sin grupo' }, ...groups.map((g) => ({ value: String(g.id), label: g.name }))]}
                value={String(mod.group_id ?? 0)}
                onValueChange={(v) => set({ group_id: Number(v) || null })}
              />
              <Input
                label="Posición en el menú"
                type="number"
                value={mod.sort_order}
                onChange={(e) => set({ sort_order: Number(e.target.value) || 0 })}
              />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Icono</p>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((name) => (
                  <button
                    key={name}
                    type="button"
                    aria-label={name}
                    aria-pressed={mod.icon === name}
                    onClick={() => set({ icon: name })}
                    className={cn(
                      'grid size-10 place-items-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      mod.icon === name
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                    )}
                  >
                    <Icon name={name} className="size-5" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Select
                label="Ordenar por defecto"
                options={fieldChoices}
                value={mod.default_sort}
                onValueChange={(default_sort) => set({ default_sort })}
              />
              <Select
                label="Dirección"
                options={[
                  { value: 'desc', label: 'Descendente (más nuevo primero)' },
                  { value: 'asc', label: 'Ascendente' },
                ]}
                value={mod.default_dir}
                onValueChange={(v) => set({ default_dir: v as 'asc' | 'desc' })}
              />
              <Input
                label="Registros por página"
                type="number"
                min={5}
                max={100}
                value={mod.page_size}
                onChange={(e) => set({ page_size: Number(e.target.value) || 20 })}
              />
            </div>

            <Switch
              label="Módulo activo"
              description="Si lo desactivas, desaparece del menú pero no se borra nada."
              checked={mod.is_active}
              onCheckedChange={(is_active) => set({ is_active })}
            />
          </Card>
        </TabsContent>

        {/* ── Campos ── */}
        <TabsContent value="campos" className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {mod.source_type === 'table'
              ? 'Los campos son las columnas de la tabla que se rellenan en el formulario. Las autonuméricas y las que tienen valor por defecto pueden quedarse fuera.'
              : 'Los campos forman el formulario de alta y edición. Cambiar o quitar un campo no borra los datos ya guardados.'}
          </p>
          {mod.fields.map((f, i) => (
            <FieldRow
              key={fieldIds[i]}
              field={f}
              index={i}
              autoKey={!fieldKeyTouched[i]}
              modules={otherModules}
              columnChoices={
                mod.source_type === 'table'
                  ? sourceColumns
                      .filter((c) => c.value !== mod.source_pk || f.key === c.value)
                      .map((c) => ({ value: c.value, label: c.label }))
                  : undefined
              }
              onChange={(nf, touched) => updateField(i, nf, touched)}
              tools={<RowTools onUp={() => moveField(i, -1)} onDown={() => moveField(i, 1)} onRemove={() => removeField(i)} />}
            />
          ))}
          <Button variant="outline" onClick={addField}>
            <Icon name="plus" /> Añadir campo
          </Button>
        </TabsContent>

        {/* ── Tabla ── */}
        <TabsContent value="tabla" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">Columnas de la tabla del módulo, en este orden.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                set({
                  column_configs: suggestColumns(
                    mod.fields,
                    mod.source_type,
                    new Map([
                      ...sourceColumns.map((c) => [c.value, c.type] as const),
                      ...(preview?.columns ?? []).map((c) => [c.name, c.type] as const),
                    ]),
                  ),
                })
              }
            >
              Generar desde los campos
            </Button>
          </div>
          {mod.column_configs.map((c, i) => {
            const update = (patch: Partial<ColumnConfig>) =>
              set({ column_configs: mod.column_configs.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            return (
              <Card key={i} className="p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <Select
                    className="min-w-40 flex-1"
                    label="Campo"
                    options={fieldChoices}
                    value={c.column}
                    onValueChange={(column) => {
                      const t = typeOf(column);
                      const f = mod.fields.find((x) => x.key === column);
                      update({
                        column,
                        headerText: f?.label ?? SYSTEM_FIELDS[column]?.label ?? column,
                        data_type: f ? columnTypeFor(f.type) : ((t as ColumnConfig['data_type']) ?? 'text'),
                      });
                    }}
                  />
                  <div className="min-w-40 flex-1">
                    <Input label="Encabezado" value={c.headerText} onChange={(e) => update({ headerText: e.target.value })} />
                  </div>
                  <Select
                    className="min-w-36 flex-1"
                    label="Formato"
                    options={entries(COLUMN_TYPES)}
                    value={c.data_type}
                    onValueChange={(v) => update({ data_type: v as ColumnConfig['data_type'] })}
                  />
                  <Select
                    className="w-32"
                    label="Alineación"
                    options={[
                      { value: 'left', label: 'Izquierda' },
                      { value: 'center', label: 'Centro' },
                      { value: 'right', label: 'Derecha' },
                    ]}
                    value={c.align ?? 'left'}
                    onValueChange={(v) => update({ align: v as ColumnConfig['align'] })}
                  />
                  <div className="w-24">
                    <Input
                      label="Si está vacío"
                      value={c.null_display ?? ''}
                      onChange={(e) => update({ null_display: e.target.value })}
                    />
                  </div>
                  <div className="pb-1.5">
                    <Switch label="Ordenable" checked={c.sortable === true} onCheckedChange={(sortable) => update({ sortable })} />
                  </div>
                  <RowTools
                    onUp={() => set({ column_configs: move(mod.column_configs, i, -1) })}
                    onDown={() => set({ column_configs: move(mod.column_configs, i, 1) })}
                    onRemove={() => set({ column_configs: mod.column_configs.filter((_, j) => j !== i) })}
                  />
                </div>
              </Card>
            );
          })}
          <Button
            variant="outline"
            onClick={() =>
              set({
                column_configs: [
                  ...mod.column_configs,
                  {
                    column: fieldChoices[0]?.value ?? 'id',
                    headerText: fieldChoices[0]?.label ?? 'ID',
                    data_type: 'text',
                    align: 'left',
                    sortable: false,
                    null_display: '—',
                  },
                ],
              })
            }
          >
            <Icon name="plus" /> Añadir columna
          </Button>
        </TabsContent>

        {/* ── Filtros ── */}
        <TabsContent value="filtros" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              Filtros que aparecen encima de la tabla. Se aplican en la base de datos, no solo a la página visible.
            </p>
            <Button variant="outline" size="sm" onClick={() => set({ filters: suggestFilters(mod.fields) })}>
              Generar sugeridos
            </Button>
          </div>
          {mod.filters.map((fl, i) => {
            const update = (patch: Partial<FilterConfig>) =>
              set({ filters: mod.filters.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            const controls = fl.field === '*' ? (['text'] as const) : filterControlsFor(typeOf(fl.field));
            return (
              <Card key={i} className="p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <Select
                    className="min-w-44 flex-1"
                    label="Filtra por"
                    options={[{ value: '*', label: 'Búsqueda general (todos los textos)' }, ...fieldChoices]}
                    value={fl.field}
                    onValueChange={(field) => {
                      const control = field === '*' ? 'text' : filterControlsFor(typeOf(field))[0];
                      const label =
                        field === '*' ? 'Buscar' : (mod.fields.find((f) => f.key === field)?.label ?? SYSTEM_FIELDS[field]?.label ?? field);
                      update({ field, control, label, name: field === '*' ? 'buscar' : field });
                    }}
                  />
                  <div className="min-w-40 flex-1">
                    <Input label="Etiqueta" value={fl.label} onChange={(e) => update({ label: e.target.value })} />
                  </div>
                  <Select
                    className="min-w-40 flex-1"
                    label="Control"
                    options={controls.map((c) => ({ value: c, label: FILTER_CONTROLS[c] }))}
                    value={fl.control}
                    onValueChange={(v) => update({ control: v as FilterConfig['control'] })}
                  />
                  {fl.control === 'number' && (
                    <Select
                      className="w-40"
                      label="Condición"
                      options={entries(NUMBER_OPERATORS)}
                      value={fl.operator ?? 'eq'}
                      onValueChange={(v) => update({ operator: v as FilterConfig['operator'] })}
                    />
                  )}
                  <div className="w-36">
                    <Input
                      label="Nombre (parámetro)"
                      value={fl.name}
                      onChange={(e) => update({ name: e.target.value.toLowerCase() })}
                    />
                  </div>
                  <RowTools
                    onUp={() => set({ filters: move(mod.filters, i, -1) })}
                    onDown={() => set({ filters: move(mod.filters, i, 1) })}
                    onRemove={() => set({ filters: mod.filters.filter((_, j) => j !== i) })}
                  />
                </div>
              </Card>
            );
          })}
          <Button
            variant="outline"
            onClick={() =>
              set({
                filters: [
                  ...mod.filters,
                  {
                    name: mod.filters.some((f) => f.name === 'buscar') ? `filtro_${mod.filters.length + 1}` : 'buscar',
                    label: 'Buscar',
                    field: '*',
                    control: 'text',
                  },
                ],
              })
            }
          >
            <Icon name="plus" /> Añadir filtro
          </Button>
        </TabsContent>
      </Tabs>

      {!isNew && (
        <Card className="mt-8 border-destructive/30 p-5">
          <h2 className="font-semibold">Borrar módulo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {mod.source_type === 'records'
              ? `Se borran el módulo y sus ${recordCount} registro(s). Si solo quieres ocultarlo, desactívalo en General.`
              : 'Se borra el módulo del panel. La tabla o los datos de la base no se tocan.'}
          </p>
          <Button variant="destructive" className="mt-4" onClick={() => setConfirmDelete(true)}>
            <Icon name="trash" /> Borrar módulo
          </Button>
        </Card>
      )}

      <Modal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`¿Borrar "${initial?.name}"?`}
        description={
          mod.source_type === 'records'
            ? `Se borrarán también sus ${recordCount} registro(s). No se puede deshacer.`
            : 'Solo se quita del panel; la base de datos no cambia.'
        }
        maxWidth="sm"
      >
        <Modal.Footer>
          <Button variant="outline" onClick={() => setConfirmDelete(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={remove}>
            Borrar todo
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
