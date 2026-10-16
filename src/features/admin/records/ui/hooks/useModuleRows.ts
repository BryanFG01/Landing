// Filas de un módulo: filtros (con espera mientras se escribe), orden, paginación, opciones de relaciones y exportar.
import * as React from 'react';
import type { FilterValues } from '@/shared/ui/dynamic-filter';
import { useToast } from '@/shared/ui/toast';
import type { Option, RecordsPage } from '@/features/admin/core/domain/schema';
import { api, download, errorMessage, isAbort } from '@/features/admin/core/ui/api';
import { fieldMap, listParams, pageInfo, sortOptions, uiFilters, type SortState, type ViewModule } from '../lib/moduleView';
import { useDebounced } from '@/features/admin/core/ui/hooks/useDebounced';

const FILTER_DELAY_MS = 300;

/** Opciones de los campos de relación del módulo (para filtros, formulario y celdas). */
function useRelationOptions(mod: ViewModule) {
  const [options, setOptions] = React.useState<Record<string, Option[]>>({});
  const hasRelations = mod.fields.some((f) => f.type === 'relation');
  React.useEffect(() => {
    if (!hasRelations) return;
    api<{ options: Record<string, Option[]> }>(`/m/${mod.module_key}/options`)
      .then((r) => setOptions(r.options))
      .catch(() => setOptions({}));
  }, [mod.module_key, hasRelations]);
  return options;
}

export function useModuleRows(mod: ViewModule) {
  const { toast } = useToast();
  const [filters, setFilters] = React.useState<FilterValues>({});
  const debouncedFilters = useDebounced(filters, FILTER_DELAY_MS);
  const [page, setPage] = React.useState(1);
  const [sort, setSort] = React.useState<SortState>({ field: mod.default_sort, dir: mod.default_dir });
  const [result, setResult] = React.useState<RecordsPage | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [reloadTick, setReloadTick] = React.useState(0);
  const [exporting, setExporting] = React.useState(false);
  const relationOptions = useRelationOptions(mod);
  const fields = React.useMemo(() => fieldMap(mod.fields), [mod.fields]);

  // Al cambiar los filtros se vuelve a la primera página.
  React.useEffect(() => setPage(1), [debouncedFilters]);

  React.useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const qs = listParams(sort, debouncedFilters, { page, size: mod.page_size });
    api<RecordsPage>(`/m/${mod.module_key}?${qs}`, { signal: ctrl.signal })
      .then((r) => {
        setResult(r);
        setError('');
      })
      .catch((e) => {
        if (!isAbort(e)) setError(errorMessage(e, 'No se pudieron cargar los registros.'));
      })
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [mod.module_key, mod.page_size, page, sort, debouncedFilters, reloadTick]);

  async function exportExcel() {
    setExporting(true);
    try {
      await download(`/m/${mod.module_key}/export?${listParams(sort, debouncedFilters)}`);
    } catch (e) {
      toast({ variant: 'error', title: errorMessage(e, 'No se pudo exportar.') });
    } finally {
      setExporting(false);
    }
  }

  const total = result?.total_rows ?? 0;
  return {
    filters,
    setFilters,
    hasFilters: Object.keys(debouncedFilters).length > 0,
    uiFilters: React.useMemo(() => uiFilters(mod, fields, relationOptions), [mod, fields, relationOptions]),
    sort,
    sortOptions: React.useMemo(() => sortOptions(mod, fields), [mod, fields]),
    setSortField: (field: string) => setSort((s) => ({ ...s, field })),
    toggleSortDir: () => setSort((s) => ({ ...s, dir: s.dir === 'asc' ? 'desc' : 'asc' })),
    page,
    setPage,
    rows: result?.data ?? [],
    total,
    ...pageInfo(total, page, result?.page_size ?? mod.page_size),
    /** Primera carga (sin datos todavía). */
    initialLoading: loading && !result,
    /** Recargando con datos ya en pantalla. */
    refreshing: loading && !!result,
    error,
    fields,
    relationOptions,
    reload: React.useCallback(() => setReloadTick((n) => n + 1), []),
    exporting,
    exportExcel,
  };
}
