// Vista genérica de un módulo: filtros, tabla, orden, paginación y formulario de alta/edición.
// No sabe nada de ningún módulo en concreto: todo sale de su definición en admin_modules.
import * as React from 'react';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable, type ColumnDef } from '../../components/ui/data-table';
import { DynamicFilter, type FilterConfig as UiFilter, type FilterValues } from '../../components/ui/dynamic-filter';
import { Modal } from '../../components/ui/modal';
import { Pagination } from '../../components/ui/pagination';
import { Select } from '../../components/ui/select';
import { useToast } from '../../components/ui/toast';
import { SYSTEM_FIELDS, type ModuleAccess, type ModuleDefinition, type Option, type RecordRow, type RecordsPage } from '../schema';
import { PageHeader } from './AdminShell';
import { api, ApiError, download } from './api';
import { formatCell } from './format';
import { Icon } from './icons';
import { ImportDialog } from './ImportDialog';
import { initialValues, RecordForm, type FormValues } from './RecordForm';
import { useRouter } from './router';

type Mod = ModuleDefinition & { id: number };

const SOURCE_BADGE: Record<string, string> = { table: 'Tabla', query: 'Consulta · solo lectura' };

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export function ModuleView({
  module: mod,
  access,
  canConfigure,
}: {
  module: Mod;
  access: ModuleAccess;
  canConfigure: boolean;
}) {
  const { toast } = useToast();
  const { navigate } = useRouter();
  const canEdit = access === 'edit' && mod.source_type !== 'query';
  const [importing, setImporting] = React.useState(false);
  const [exporting, setExporting] = React.useState(false);
  const [filters, setFilters] = React.useState<FilterValues>({});
  const debouncedFilters = useDebounced(filters, 300);
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState({ field: mod.default_sort, dir: mod.default_dir });
  const [result, setResult] = React.useState<RecordsPage | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');
  const [relationOptions, setRelationOptions] = React.useState<Record<string, Option[]>>({});
  const [reload, setReload] = React.useState(0);

  // Formulario
  const [editing, setEditing] = React.useState<RecordRow | 'new' | null>(null);
  const [values, setValues] = React.useState<FormValues>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState<RecordRow | null>(null);

  const fieldByKey = React.useMemo(() => new Map(mod.fields.map((f) => [f.key, f])), [mod.fields]);
  const hasRelations = mod.fields.some((f) => f.type === 'relation');

  React.useEffect(() => {
    if (!hasRelations) return;
    api<{ options: Record<string, Option[]> }>(`/m/${mod.module_key}/options`)
      .then((r) => setRelationOptions(r.options))
      .catch(() => {});
  }, [mod.module_key, hasRelations]);

  // Al cambiar los filtros se vuelve a la primera página.
  React.useEffect(() => setPage(1), [debouncedFilters]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const qs = new URLSearchParams({
      page: String(page),
      page_size: String(mod.page_size),
      sort: sort.field,
      dir: sort.dir,
      filters: JSON.stringify(debouncedFilters),
    });
    fetch(`/api/admin/m/${mod.module_key}?${qs}`, { signal: ctrl.signal })
      .then(async (res) => {
        const body = await res.json();
        if (res.status === 401) location.href = `/admin/login?next=${encodeURIComponent(location.pathname)}`;
        if (!res.ok) throw new Error(body.error ?? 'No se pudieron cargar los registros.');
        setResult(body);
        setLoadError('');
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setLoadError(e.message);
      })
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [mod.module_key, mod.page_size, page, sort, debouncedFilters, reload]);

  // Filtros de la configuración → formato de DynamicFilter (nuvo-ui).
  const uiFilters = React.useMemo<UiFilter[]>(
    () =>
      mod.filters.map((f) => {
        const field = fieldByKey.get(f.field);
        const options = field?.type === 'relation' ? relationOptions[field.key] : field?.options;
        return {
          key: f.name,
          label: f.label,
          type: f.control,
          placeholder: f.placeholder ?? (f.control === 'boolean' ? f.label : undefined),
          options: options ?? [],
        };
      }),
    [mod.filters, fieldByKey, relationOptions],
  );

  const columns = React.useMemo<ColumnDef<RecordRow>[]>(
    () => [
      ...mod.column_configs.map((c) => ({
        key: c.column,
        label: c.headerText,
        render: (value: unknown) => (
          <div
            className={c.align === 'right' ? 'text-right tabular-nums' : c.align === 'center' ? 'text-center' : undefined}
          >
            {formatCell(value, c, fieldByKey.get(c.column), relationOptions[c.column])}
          </div>
        ),
      })),
      ...(canEdit
        ? [
            {
              key: '__actions',
              label: '',
              render: (_: unknown, row: RecordRow) => (
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openForm(row)}>
                    <Icon name="pencil" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Borrar"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleting(row)}
                  >
                    <Icon name="trash" />
                  </Button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [mod.column_configs, fieldByKey, relationOptions, canEdit],
  );

  async function exportCsv() {
    setExporting(true);
    try {
      const qs = new URLSearchParams({ sort: sort.field, dir: sort.dir, filters: JSON.stringify(debouncedFilters) });
      await download(`/m/${mod.module_key}/export?${qs}`);
    } catch (err) {
      toast({ variant: 'error', title: err instanceof Error ? err.message : 'No se pudo exportar.' });
    } finally {
      setExporting(false);
    }
  }

  // Ordenar: columnas marcadas como ordenables + el orden por defecto del módulo.
  const sortOptions = React.useMemo(() => {
    const keys = [...new Set([mod.default_sort, ...mod.column_configs.filter((c) => c.sortable).map((c) => c.column)])];
    return keys.map((k) => ({
      value: k,
      label:
        mod.column_configs.find((c) => c.column === k)?.headerText ??
        fieldByKey.get(k)?.label ??
        SYSTEM_FIELDS[k]?.label ??
        k,
    }));
  }, [mod, fieldByKey]);

  function openForm(row: RecordRow | 'new') {
    setEditing(row);
    setValues(initialValues(mod.fields, row === 'new' ? null : row));
    setErrors({});
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing === 'new') await api(`/m/${mod.module_key}`, { method: 'POST', body: values });
      else await api(`/m/${mod.module_key}/${encodeURIComponent(String(editing.__id))}`, { method: 'PUT', body: values });
      toast({ variant: 'success', title: editing === 'new' ? 'Registro creado' : 'Cambios guardados' });
      setEditing(null);
      setReload((n) => n + 1);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors);
        if (!Object.keys(err.fieldErrors).length) toast({ variant: 'error', title: err.message });
      } else toast({ variant: 'error', title: 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await api(`/m/${mod.module_key}/${encodeURIComponent(String(deleting.__id))}`, { method: 'DELETE' });
      toast({ variant: 'success', title: 'Registro borrado' });
      setDeleting(null);
      setReload((n) => n + 1);
    } catch (err) {
      toast({ variant: 'error', title: err instanceof Error ? err.message : 'No se pudo borrar.' });
      setDeleting(null);
    }
  }

  const total = result?.total_rows ?? 0;
  const pageSize = result?.page_size ?? mod.page_size;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);

  return (
    <>
      <PageHeader
        title={mod.name}
        description={mod.description}
        icon={mod.icon}
        badge={SOURCE_BADGE[mod.source_type] ?? (access === 'view' ? 'Solo lectura' : undefined)}
        actions={
          <>
            {canConfigure && (
              <Button variant="outline" onClick={() => navigate(`/admin/modulos/${mod.id}`)}>
                <Icon name="wrench" /> Configurar
              </Button>
            )}
            <Button variant="outline" onClick={exportCsv} disabled={exporting}>
              <Icon name="download" /> {exporting ? 'Exportando…' : 'Exportar a Excel'}
            </Button>
            {canEdit && (
              <Button variant="outline" onClick={() => setImporting(true)}>
                <Icon name="upload" /> Importar
              </Button>
            )}
            {canEdit && (
              <Button onClick={() => openForm('new')}>
                <Icon name="plus" /> Nuevo registro
              </Button>
            )}
          </>
        }
      />

      {uiFilters.length > 0 && (
        <DynamicFilter filters={uiFilters} value={filters} onChange={setFilters} className="mb-4" />
      )}

      {loadError && (
        <Alert variant="error" title="Error" className="mb-4">
          {loadError}
        </Alert>
      )}

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {loading && !result ? 'Cargando…' : total ? `Mostrando ${from}–${to} de ${total}` : 'Sin resultados'}
          </p>
          {sortOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ordenar por</span>
              <Select
                className="w-44"
                options={sortOptions}
                value={sort.field}
                onValueChange={(field) => setSort((s) => ({ ...s, field }))}
              />
              <Button
                variant="outline"
                size="icon"
                aria-label={sort.dir === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
                onClick={() => setSort((s) => ({ ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' }))}
              >
                <Icon name={sort.dir === 'asc' ? 'arrow-up' : 'arrow-down'} />
              </Button>
            </div>
          )}
        </div>

        <DataTable
          data={result?.data ?? []}
          columns={columns}
          loading={loading && !result}
          emptyText={Object.keys(debouncedFilters).length ? 'Ningún registro coincide con los filtros.' : 'Aún no hay registros.'}
          className={loading && result ? 'opacity-60 transition-opacity' : 'transition-opacity'}
        />

        <div className="mt-4 flex justify-end">
          <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
        </div>
      </Card>

      <Modal
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title={editing === 'new' ? `Nuevo registro · ${mod.name}` : `Editar registro #${editing ? String(editing.__id) : ''}`}
        maxWidth="lg"
        className="max-h-[85dvh] overflow-y-auto"
      >
        <form onSubmit={save} noValidate>
          <RecordForm
            fields={mod.fields}
            values={values}
            errors={errors}
            relationOptions={relationOptions}
            onChange={(key, v) => {
              setValues((prev) => ({ ...prev, [key]: v }));
              setErrors(({ [key]: _, ...rest }) => rest);
            }}
          />
          <Modal.Footer>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      {canEdit && (
        <ImportDialog
          open={importing}
          onOpenChange={setImporting}
          moduleKey={mod.module_key}
          moduleName={mod.name}
          fields={mod.fields}
          onImported={() => setReload((n) => n + 1)}
        />
      )}

      <Modal
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="¿Borrar este registro?"
        description="Esta acción no se puede deshacer."
        maxWidth="sm"
      >
        <Modal.Footer>
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Borrar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
