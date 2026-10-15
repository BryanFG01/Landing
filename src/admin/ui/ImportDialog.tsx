// Importar filas desde un CSV (o un Excel guardado como CSV): se lee en el navegador, se empareja cada campo del
// módulo con una columna del archivo y el servidor valida todas las filas antes de guardar ninguna.
import * as React from 'react';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';
import { Select } from '../../components/ui/select';
import { useToast } from '../../components/ui/toast';
import type { FieldConfig } from '../schema';
import { api, ApiError } from './api';
import { normalize, parseCsv, templateCsv } from './csv';
import { Icon } from './icons';

const SKIP = '__skip__';

export function ImportDialog({
  open,
  onOpenChange,
  moduleKey,
  moduleName,
  fields,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleKey: string;
  moduleName: string;
  fields: FieldConfig[];
  onImported: () => void;
}) {
  const { toast } = useToast();
  // Las fotos y archivos no se importan desde un CSV.
  const importable = fields.filter((f) => f.type !== 'image' && f.type !== 'file');
  const [fileName, setFileName] = React.useState('');
  const [rows, setRows] = React.useState<string[][]>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [errors, setErrors] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const input = React.useRef<HTMLInputElement>(null);

  const headers = rows[0] ?? [];
  const data = rows.slice(1);

  function reset() {
    setFileName('');
    setRows([]);
    setMapping({});
    setErrors([]);
  }

  async function pick(file: File | undefined) {
    if (!file) return;
    reset();
    const parsed = parseCsv(await file.text());
    if (parsed.length < 2) {
      setErrors(['El archivo no tiene filas debajo de los encabezados.']);
      return;
    }
    setFileName(file.name);
    setRows(parsed);
    // Emparejado automático por clave o por etiqueta del campo.
    const byName = new Map(parsed[0].map((h, i) => [normalize(h), String(i)]));
    setMapping(
      Object.fromEntries(
        importable.map((f) => [f.key, byName.get(normalize(f.key)) ?? byName.get(normalize(f.label)) ?? SKIP]),
      ),
    );
  }

  async function submit() {
    setBusy(true);
    setErrors([]);
    try {
      const payload = data.map((r) =>
        Object.fromEntries(
          importable.filter((f) => mapping[f.key] !== SKIP).map((f) => [f.key, r[Number(mapping[f.key])] ?? '']),
        ),
      );
      const res = await api<{ inserted: number }>(`/m/${moduleKey}/import`, { method: 'POST', body: { rows: payload } });
      toast({ variant: 'success', title: `${res.inserted} fila(s) importada(s)` });
      reset();
      onOpenChange(false);
      onImported();
    } catch (e) {
      setErrors(e instanceof ApiError && e.errors.length ? e.errors : [e instanceof Error ? e.message : 'No se pudo importar.']);
    } finally {
      setBusy(false);
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([templateCsv(importable.map((f) => f.label))], { type: 'text/csv' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `plantilla-${moduleKey}.csv` });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const missingRequired = importable.filter((f) => f.required && mapping[f.key] === SKIP);
  const columnOptions = [{ value: SKIP, label: '— No importar —' }, ...headers.map((h, i) => ({ value: String(i), label: h || `Columna ${i + 1}` }))];

  return (
    <Modal
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
      title={`Importar a ${moduleName}`}
      description="Sube un CSV (en Excel: Archivo → Guardar como → CSV). Se valida todo antes de guardar: si una fila tiene errores, no se importa nada."
      maxWidth="lg"
      className="max-h-[85dvh] overflow-y-auto"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv,.txt"
            className="sr-only"
            onChange={(e) => {
              pick(e.target.files?.[0]);
              e.target.value = '';
            }}
            aria-label="Archivo CSV"
          />
          <Button variant="outline" onClick={() => input.current?.click()}>
            <Icon name="upload" /> {fileName ? 'Elegir otro archivo' : 'Elegir archivo CSV'}
          </Button>
          <Button variant="ghost" onClick={downloadTemplate}>
            <Icon name="download" /> Descargar plantilla
          </Button>
          {fileName && (
            <span className="text-sm text-muted-foreground">
              {fileName} · {data.length} fila(s)
            </span>
          )}
        </div>

        {headers.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">¿Qué columna del archivo va en cada campo?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {importable.map((f) => (
                <Select
                  key={f.key}
                  label={f.required ? `${f.label} *` : f.label}
                  options={columnOptions}
                  value={mapping[f.key] ?? SKIP}
                  onValueChange={(v) => setMapping((m) => ({ ...m, [f.key]: v }))}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Las listas aceptan el valor o la etiqueta; Sí/No acepta "Sí", "No", "1", "0"; las fechas, AAAA-MM-DD o
              DD/MM/AAAA; varias opciones, separadas por "|".
            </p>
          </div>
        )}

        {missingRequired.length > 0 && headers.length > 0 && (
          <Alert variant="warning">Faltan campos obligatorios: {missingRequired.map((f) => f.label).join(', ')}.</Alert>
        )}

        {errors.length > 0 && (
          <Alert variant="error" title="No se importó nada">
            <ul className="max-h-48 list-disc space-y-0.5 overflow-y-auto pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Alert>
        )}
      </div>

      <Modal.Footer>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={submit} disabled={busy || !data.length || missingRequired.length > 0}>
          {busy ? 'Importando…' : `Importar ${data.length || ''} fila(s)`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
