// Vista genérica de un módulo: filtros, tabla, orden, paginación y formulario de alta/edición. No sabe nada de ningún
// módulo en concreto: todo sale de su definición. La lógica está en hooks/useModuleRows.ts y hooks/useRecordEditor.ts.
import * as React from 'react';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable, type ColumnDef } from '../../components/ui/data-table';
import { DynamicFilter } from '../../components/ui/dynamic-filter';
import { Modal } from '../../components/ui/modal';
import { Pagination } from '../../components/ui/pagination';
import { Select } from '../../components/ui/select';
import { hasPendingState, type ColumnConfig, type FieldConfig, type ModuleAccess, type Option, type RecordRow } from '../schema';
import { ConfirmDialog } from './ConfirmDialog';
import { formatCell } from './format';
import { useModuleRows } from './hooks/useModuleRows';
import { useRecordEditor } from './hooks/useRecordEditor';
import { Icon } from './icons';
import { ImportDialog } from './ImportDialog';
import { ALIGN_CLASS, canEditModule, moduleBadge, type SortState, type ViewModule } from './lib/moduleView';
import { PageHeader } from './PageHeader';
import { RecordForm } from './RecordForm';
import { useRouter } from './router';

interface ColumnContext {
  configs: ColumnConfig[];
  fields: Map<string, FieldConfig>;
  relationOptions: Record<string, Option[]>;
  /** Sin acciones: módulo de solo lectura. */
  onEdit?: (row: RecordRow) => void;
  onDelete?: (row: RecordRow) => void;
  /** Cambio rápido de estado (módulos con "pendiente", como pedidos). */
  onStatus?: (row: RecordRow, estado: string) => void;
}

/** Selector compacto del estado en la fila (pedidos: pendiente, confirmado, entregado…). */
function StatusCell({ value, field, onChange }: Readonly<{ value: unknown; field: FieldConfig; onChange: (v: string) => void }>) {
  return (
    <select
      aria-label={field.label}
      value={String(value ?? '')}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {field.options?.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Columnas de la tabla según column_configs, más editar/borrar si se puede editar (presentación). */
function columnsFor({ configs, fields, relationOptions, onEdit, onDelete, onStatus }: ColumnContext): ColumnDef<RecordRow>[] {
  const data: ColumnDef<RecordRow>[] = configs.map((c) => {
    const field = fields.get(c.column);
    const quickStatus = onStatus && field && c.column === 'estado' && hasPendingState([field]);
    return {
      key: c.column,
      label: c.headerText,
      render: (value: unknown, row: RecordRow) =>
        quickStatus ? (
          <StatusCell value={value} field={field} onChange={(v) => onStatus(row, v)} />
        ) : (
          <div className={ALIGN_CLASS[c.align ?? 'left']}>{formatCell(value, c, field, relationOptions[c.column])}</div>
        ),
    };
  });
  if (!onEdit || !onDelete) return data;
  return [
    ...data,
    {
      key: '__actions',
      label: '',
      render: (_: unknown, row: RecordRow) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => onEdit(row)}>
            <Icon name="pencil" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Borrar"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(row)}
          >
            <Icon name="trash" />
          </Button>
        </div>
      ),
    },
  ];
}

interface SortControlProps {
  options: { value: string; label: string }[];
  sort: SortState;
  onField: (field: string) => void;
  onToggleDir: () => void;
}

function SortControl({ options, sort, onField, onToggleDir }: Readonly<SortControlProps>) {
  if (!options.length) return null;
  const asc = sort.dir === 'asc';
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Ordenar por</span>
      <Select className="w-44" options={options} value={sort.field} onValueChange={onField} />
      <Button variant="outline" size="icon" aria-label={asc ? 'Orden ascendente' : 'Orden descendente'} onClick={onToggleDir}>
        <Icon name={asc ? 'arrow-up' : 'arrow-down'} />
      </Button>
    </div>
  );
}

interface ModuleViewProps {
  module: ViewModule;
  access: ModuleAccess;
  canConfigure: boolean;
}

export function ModuleView({ module: mod, access, canConfigure }: Readonly<ModuleViewProps>) {
  const { navigate } = useRouter();
  const rows = useModuleRows(mod);
  const editor = useRecordEditor(mod, rows.reload);
  const [importing, setImporting] = React.useState(false);
  const canEdit = canEditModule(mod, access);

  const { fields, relationOptions } = rows;
  const { open, askDelete, setStatus } = editor;
  const columns = React.useMemo(
    () =>
      columnsFor({
        configs: mod.column_configs,
        fields,
        relationOptions,
        onEdit: canEdit ? open : undefined,
        onDelete: canEdit ? askDelete : undefined,
        onStatus: canEdit ? setStatus : undefined,
      }),
    [mod.column_configs, fields, relationOptions, canEdit, open, askDelete, setStatus],
  );

  let summary = 'Sin resultados';
  if (rows.initialLoading) summary = 'Cargando…';
  else if (rows.total) summary = `Mostrando ${rows.from}–${rows.to} de ${rows.total}`;

  return (
    <>
      <PageHeader
        title={mod.name}
        description={mod.description}
        icon={mod.icon}
        badge={moduleBadge(mod, access)}
        actions={
          <>
            {canConfigure && (
              <Button variant="outline" onClick={() => navigate(`/admin/modulos/${mod.id}`)}>
                <Icon name="wrench" /> Configurar
              </Button>
            )}
            <Button variant="outline" onClick={rows.exportExcel} disabled={rows.exporting}>
              <Icon name="download" /> {rows.exporting ? 'Exportando…' : 'Exportar a Excel'}
            </Button>
            {canEdit && (
              <>
                <Button variant="outline" onClick={() => setImporting(true)}>
                  <Icon name="upload" /> Importar
                </Button>
                <Button onClick={() => editor.open('new')}>
                  <Icon name="plus" /> Nuevo registro
                </Button>
              </>
            )}
          </>
        }
      />

      {rows.uiFilters.length > 0 && (
        <DynamicFilter filters={rows.uiFilters} value={rows.filters} onChange={rows.setFilters} className="mb-4" />
      )}

      {rows.error && (
        <Alert variant="error" title="Error" className="mb-4">
          {rows.error}
        </Alert>
      )}

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {summary}
          </p>
          <SortControl options={rows.sortOptions} sort={rows.sort} onField={rows.setSortField} onToggleDir={rows.toggleSortDir} />
        </div>

        <DataTable
          data={rows.rows}
          columns={columns}
          loading={rows.initialLoading}
          emptyText={rows.hasFilters ? 'Ningún registro coincide con los filtros.' : 'Aún no hay registros.'}
          className={rows.refreshing ? 'opacity-60 transition-opacity' : 'transition-opacity'}
        />

        <div className="mt-4 flex justify-end">
          <Pagination currentPage={rows.page} totalPages={rows.totalPages} onChange={rows.setPage} />
        </div>
      </Card>

      <Modal
        open={editor.editing !== null}
        onOpenChange={(o) => !o && editor.close()}
        title={editor.title}
        maxWidth="lg"
        className="max-h-[85dvh] overflow-y-auto"
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void editor.save();
          }}
        >
          <RecordForm
            fields={mod.fields}
            values={editor.values}
            errors={editor.errors}
            relationOptions={relationOptions}
            onChange={editor.setValue}
          />
          <Modal.Footer>
            <Button type="button" variant="outline" onClick={editor.close}>
              Cancelar
            </Button>
            <Button type="submit" disabled={editor.saving}>
              {editor.saving ? 'Guardando…' : 'Guardar'}
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
          onImported={rows.reload}
        />
      )}

      <ConfirmDialog
        open={editor.deleting !== null}
        title="¿Borrar este registro?"
        description="Esta acción no se puede deshacer."
        confirmLabel="Borrar"
        destructive
        onConfirm={editor.remove}
        onCancel={editor.cancelDelete}
      />
    </>
  );
}
