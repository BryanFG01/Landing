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
  SYSTEM_FIELDS,
  type ColumnConfig,
  type FieldConfig,
  type FieldType,
  type FilterConfig,
  type ModuleDefinition,
  type ModuleGroup,
} from '../schema';
import { PageHeader } from './AdminShell';
import { api, ApiError } from './api';
import { Icon } from './icons';
import { useNav } from './nav';
import { useRouter } from './router';

type Mod = ModuleDefinition & { id?: number };

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

/** Columnas sugeridas: los primeros campos + fecha de creación. */
function suggestColumns(fields: FieldConfig[]): ColumnConfig[] {
  return [
    ...fields
      .filter((f) => f.type !== 'textarea')
      .slice(0, 6)
      .map((f) => ({
        column: f.key,
        headerText: f.label,
        data_type: columnTypeFor(f.type),
        align: (f.type === 'number' || f.type === 'currency' ? 'right' : 'left') as ColumnConfig['align'],
        sortable: f.type !== 'multiselect',
        null_display: '—',
      })),
    { column: 'created_at', headerText: 'Creado', data_type: 'datetime', align: 'left', sortable: true, null_display: '—' },
  ];
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
  onChange,
  tools,
}: {
  field: FieldConfig;
  index: number;
  autoKey: boolean;
  modules: Mod[];
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
            onChange({ ...field, label: e.target.value, key: autoKey ? slugify(e.target.value) : field.key })
          }
        />
        <Input
          label="Clave"
          helperText="Nombre interno (slug)"
          value={field.key}
          onChange={(e) => onChange({ ...field, key: e.target.value.toLowerCase() }, true)}
        />
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
              options={modules.filter((m) => m.module_key).map((m) => ({ value: m.module_key, label: m.name }))}
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
    return { ...base, column_configs: base.column_configs.length ? base.column_configs : suggestColumns(base.fields) };
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
  const { navigate } = useRouter();
  const { refreshNav } = useNav();

  const set =(patch: Partial<Mod>) => setMod((m) => ({ ...m, ...patch }));
  const otherModules = modules.filter((m) => m.id !== mod.id);

  // Campos disponibles para columnas, orden y filtros.
  const fieldChoices = [
    ...mod.fields.filter((f) => f.key).map((f) => ({ value: f.key, label: f.label || f.key })),
    ...Object.entries(SYSTEM_FIELDS).map(([value, s]) => ({ value, label: `${s.label} (sistema)` })),
  ];
  const typeOf = (key: string) => mod.fields.find((f) => f.key === key)?.type ?? SYSTEM_FIELDS[key]?.type;

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
          <TabsTrigger value="campos">Campos ({mod.fields.length})</TabsTrigger>
          <TabsTrigger value="tabla">Tabla ({mod.column_configs.length})</TabsTrigger>
          <TabsTrigger value="filtros">Filtros ({mod.filters.length})</TabsTrigger>
        </TabsList>

        {/* ── General ── */}
        <TabsContent value="general">
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
            Los campos forman el formulario de alta y edición. Cambiar o quitar un campo no borra los datos ya guardados.
          </p>
          {mod.fields.map((f, i) => (
            <FieldRow
              key={fieldIds[i]}
              field={f}
              index={i}
              autoKey={!fieldKeyTouched[i]}
              modules={otherModules}
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
            <Button variant="outline" size="sm" onClick={() => set({ column_configs: suggestColumns(mod.fields) })}>
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
                  { column: 'id', headerText: 'ID', data_type: 'number', align: 'left', sortable: false, null_display: '—' },
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
            Se borran el módulo y sus {recordCount} registro(s). Si solo quieres ocultarlo, desactívalo en General.
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
        description={`Se borrarán también sus ${recordCount} registro(s). No se puede deshacer.`}
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
