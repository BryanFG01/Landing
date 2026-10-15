// Constructor de módulos: el borrador más todo lo que habla con la API (tablas, probar consulta, SQL de la tabla,
// guardar y borrar) y la llegada desde la consola SQL (?tabla=<nombre> o ?origen=consulta).
import * as React from 'react';
import { useToast } from '../../../components/ui/toast';
import type { SourceType } from '../../schema';
import { api, ApiError, errorMessage } from '../api';
import {
  alterTableSql,
  createTableSql,
  fieldChoices,
  querySetup,
  sourceColumnsOf,
  sourceReset,
  tableNameIn,
  tableSetup,
  type EditorModule,
  type QueryPreview,
} from '../lib/moduleEditor';
import { isDestructive, takeHandedOffQuery, type TableInfo } from '../lib/sql';
import { useNav } from '../nav';
import { useRouter } from '../router';
import { useModuleDraft } from './useModuleDraft';
import { useTables } from './useTables';

/** Probar la consulta de un módulo de consulta. */
function useQueryPreview() {
  const [preview, setPreview] = React.useState<QueryPreview | null>(null);
  const [error, setError] = React.useState('');
  const [running, setRunning] = React.useState(false);

  async function run(sql: string): Promise<QueryPreview | null> {
    setRunning(true);
    setError('');
    try {
      const r = await api<QueryPreview>('/sql/preview', { method: 'POST', body: { sql } });
      setPreview(r);
      return r;
    } catch (e) {
      setPreview(null);
      setError(errorMessage(e, 'No se pudo probar la consulta.'));
      return null;
    } finally {
      setRunning(false);
    }
  }

  const clear = () => {
    setPreview(null);
    setError('');
  };
  return { preview, error, running, run, clear };
}

/** SQL de la tabla escrito desde el constructor (CREATE TABLE / ALTER TABLE). */
function useTableSql() {
  const [sql, setSql] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [running, setRunning] = React.useState(false);

  const open = (text: string) => {
    setError('');
    setSql(text);
  };

  /** Ejecuta con la misma API y el mismo rol limitado que la consola. Devuelve true si salió bien. */
  async function execute() {
    if (!sql?.trim()) return false;
    setRunning(true);
    setError('');
    try {
      await api('/sql/run', { method: 'POST', body: { sql, allow_write: true } });
      return true;
    } catch (e) {
      setError(errorMessage(e, 'No se pudo ejecutar.'));
      return false;
    } finally {
      setRunning(false);
    }
  }

  return {
    sql,
    error,
    running,
    /** Borrar tablas o columnas solo desde la consola SQL. */
    blocked: !!sql && isDestructive(sql),
    open,
    edit: setSql,
    close: () => setSql(null),
    execute,
  };
}

interface EditorProps {
  initial: EditorModule | null;
  modules: EditorModule[];
}

export function useModuleEditor({ initial, modules }: EditorProps) {
  const { toast } = useToast();
  const { path, navigate } = useRouter();
  const { refreshNav } = useNav();
  const draft = useModuleDraft(initial);
  const { mod, set, replaceFields, keyTouched, isNew } = draft;
  const tables = useTables(mod.source_type === 'table');
  const query = useQueryPreview();
  const tableSql = useTableSql();
  const [errors, setErrors] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);
  // Clave guardada en la base (puede diferir de la que se está editando).
  const [savedKey, setSavedKey] = React.useState(initial?.module_key ?? '');

  const table = tables.tables?.find((t) => t.name === mod.source);
  const sourceColumns = sourceColumnsOf(mod, table);

  function applyTable(t: TableInfo) {
    const { fields, patch } = tableSetup(mod, t, keyTouched);
    replaceFields(fields, patch);
  }

  async function runPreview(sql = mod.source ?? '') {
    const preview = await query.run(sql);
    if (!preview) return;
    const { fields, patch } = querySetup(mod, preview);
    replaceFields(fields, patch);
  }

  /** Ejecuta el SQL de la tabla, recarga las tablas y trae las columnas de la tabla afectada al módulo. */
  async function runTableSql() {
    const text = tableSql.sql ?? '';
    if (!(await tableSql.execute())) return;
    const list = await tables.reload();
    const t = list.find((x) => x.name === (tableNameIn(text) ?? mod.source));
    if (t?.pk) applyTable(t);
    else if (t) set({ source: t.name });
    tableSql.close();
    toast({ variant: 'success', title: t ? `Tabla ${t.name} lista` : 'SQL ejecutado' });
  }

  function switchSource(source: SourceType) {
    if (source === mod.source_type) return;
    query.clear();
    const { fields, patch } = sourceReset(source);
    replaceFields(fields, patch);
  }

  // Llegada desde la consola SQL. Solo una vez, al abrir un módulo nuevo.
  const started = React.useRef(false);
  React.useEffect(() => {
    if (!isNew || started.current) return;
    started.current = true;
    const params = new URLSearchParams(path.split('?')[1] ?? '');
    const tabla = params.get('tabla');
    if (tabla) {
      set({ source_type: 'table', source: tabla, fields: [], column_configs: [], filters: [] });
      void tables.reload().then((list) => {
        const t = list.find((x) => x.name === tabla);
        if (t?.pk) applyTable(t);
      });
    } else if (params.get('origen') === 'consulta') {
      const sql = takeHandedOffQuery();
      set({ source_type: 'query', source: sql, fields: [], column_configs: [], filters: [], icon: 'chart' });
      if (sql) void runPreview(sql);
    }
    // Se ejecuta una sola vez al montar: las funciones usan el estado inicial a propósito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      else toast({ variant: 'error', title: errorMessage(err, 'No se pudo guardar.') });
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
      setConfirmingDelete(false);
      toast({ variant: 'error', title: errorMessage(err, 'No se pudo borrar.') });
    }
  }

  return {
    draft,
    mod,
    isNew,
    errors,
    saving,
    save,
    savedKey,
    viewModule: () => navigate(`/admin/m/${savedKey}`),
    confirmingDelete,
    askDelete: () => setConfirmingDelete(true),
    cancelDelete: () => setConfirmingDelete(false),
    remove,
    otherModules: modules.filter((m) => m.id !== mod.id),
    // Origen
    switchSource,
    tables: tables.tables,
    table,
    applyTable,
    sourceColumns,
    choices: fieldChoices(mod, sourceColumns),
    query,
    runPreview,
    tableSql,
    openCreateTableSql: () => tableSql.open(createTableSql(mod.name || mod.module_key, mod.fields)),
    openAlterTableSql: () => table && tableSql.open(alterTableSql(table.name)),
    runTableSql,
  };
}

export type ModuleEditorState = ReturnType<typeof useModuleEditor>;
