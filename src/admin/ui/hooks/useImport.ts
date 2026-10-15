// Importar a un módulo: archivo elegido, emparejado de columnas, envío y errores por fila.
import * as React from 'react';
import { useToast } from '../../../components/ui/toast';
import type { FieldConfig } from '../../schema';
import { api, ApiError, errorMessage, saveBlob } from '../api';
import {
  autoMapping,
  columnOptions,
  importableFields,
  missingRequired,
  readSpreadsheet,
  rowsToPayload,
  templateBlob,
} from '../lib/spreadsheet';

interface ImportTarget {
  moduleKey: string;
  moduleName: string;
  fields: FieldConfig[];
  onDone: () => void;
}

export function useImport({ moduleKey, moduleName, fields, onDone }: ImportTarget) {
  const { toast } = useToast();
  const importable = React.useMemo(() => importableFields(fields), [fields]);
  const [fileName, setFileName] = React.useState('');
  const [rows, setRows] = React.useState<string[][]>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [errors, setErrors] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);

  const headers = rows[0] ?? [];
  const data = rows.slice(1);

  const reset = React.useCallback(() => {
    setFileName('');
    setRows([]);
    setMapping({});
    setErrors([]);
  }, []);

  async function pick(file: File) {
    reset();
    let parsed: string[][];
    try {
      parsed = await readSpreadsheet(file);
    } catch {
      setErrors(['No se pudo leer el archivo. Usa un Excel (.xlsx) o un CSV.']);
      return;
    }
    if (parsed.length < 2) {
      setErrors(['El archivo no tiene filas debajo de los encabezados.']);
      return;
    }
    setFileName(file.name);
    setRows(parsed);
    setMapping(autoMapping(parsed[0], importable));
  }

  /** Devuelve true si se importó (para cerrar el diálogo). */
  async function submit() {
    setBusy(true);
    setErrors([]);
    try {
      const body = { rows: rowsToPayload(data, importable, mapping) };
      const res = await api<{ inserted: number }>(`/m/${moduleKey}/import`, { method: 'POST', body });
      toast({ variant: 'success', title: `${res.inserted} fila(s) importada(s)` });
      reset();
      onDone();
      return true;
    } catch (e) {
      setErrors(e instanceof ApiError && e.errors.length ? e.errors : [errorMessage(e, 'No se pudo importar.')]);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    importable,
    fileName,
    headers,
    rowCount: data.length,
    mapping,
    setColumn: (fieldKey: string, column: string) => setMapping((m) => ({ ...m, [fieldKey]: column })),
    columnOptions: React.useMemo(() => columnOptions(headers), [headers]),
    missing: missingRequired(importable, mapping),
    errors,
    busy,
    pick,
    submit,
    reset,
    downloadTemplate: () => saveBlob(templateBlob(moduleName, importable), `plantilla-${moduleKey}.xlsx`),
  };
}
