// Importar filas desde un Excel (.xlsx) o un CSV: se lee en el navegador, se empareja cada campo del módulo con una
// columna del archivo y el servidor valida todas las filas antes de guardar ninguna. La lógica está en
// hooks/useImport.ts y lib/spreadsheet.ts.
import * as React from 'react';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';
import { Select } from '../../components/ui/select';
import type { FieldConfig } from '../schema';
import { FilePicker } from './FilePicker';
import { useImport } from './hooks/useImport';
import { Icon } from './icons';
import { SKIP } from './lib/spreadsheet';

const ACCEPT = '.xlsx,.csv,text/csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleKey: string;
  moduleName: string;
  fields: FieldConfig[];
  onImported: () => void;
}

export function ImportDialog({ open, onOpenChange, moduleKey, moduleName, fields, onImported }: Readonly<ImportDialogProps>) {
  const imp = useImport({ moduleKey, moduleName, fields, onDone: onImported });
  const hasFile = imp.headers.length > 0;

  function close(isOpen: boolean) {
    if (!isOpen) imp.reset();
    onOpenChange(isOpen);
  }

  return (
    <Modal
      open={open}
      onOpenChange={close}
      title={`Importar a ${moduleName}`}
      description="Sube un Excel (.xlsx) o un CSV. Lo más fácil: exporta o descarga la plantilla, rellénala en Excel y súbela. Se valida todo antes de guardar: si una fila tiene errores, no se importa nada."
      maxWidth="lg"
      className="max-h-[85dvh] overflow-y-auto"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <FilePicker accept={ACCEPT} label="Archivo Excel o CSV" size="md" onPick={imp.pick}>
            {imp.fileName ? 'Elegir otro archivo' : 'Elegir archivo (Excel o CSV)'}
          </FilePicker>
          <Button variant="ghost" onClick={imp.downloadTemplate}>
            <Icon name="download" /> Descargar plantilla
          </Button>
          {imp.fileName && (
            <span className="text-sm text-muted-foreground">
              {imp.fileName} · {imp.rowCount} fila(s)
            </span>
          )}
        </div>

        {hasFile && (
          <div>
            <p className="mb-2 text-sm font-medium">¿Qué columna del archivo va en cada campo?</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {imp.importable.map((f) => (
                <Select
                  key={f.key}
                  label={f.required ? `${f.label} *` : f.label}
                  options={imp.columnOptions}
                  value={imp.mapping[f.key] ?? SKIP}
                  onValueChange={(column) => imp.setColumn(f.key, column)}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Las listas aceptan el valor o la etiqueta; Sí/No acepta "Sí", "No", "1", "0"; las fechas, AAAA-MM-DD o
              DD/MM/AAAA; varias opciones, separadas por "|".
            </p>
          </div>
        )}

        {hasFile && imp.missing.length > 0 && (
          <Alert variant="warning">Faltan campos obligatorios: {imp.missing.map((f) => f.label).join(', ')}.</Alert>
        )}

        {imp.errors.length > 0 && (
          <Alert variant="error" title="No se importó nada">
            <ul className="max-h-48 list-disc space-y-0.5 overflow-y-auto pl-4">
              {imp.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </Alert>
        )}
      </div>

      <Modal.Footer>
        <Button variant="outline" onClick={() => close(false)}>
          Cancelar
        </Button>
        <Button
          onClick={async () => (await imp.submit()) && onOpenChange(false)}
          disabled={imp.busy || !imp.rowCount || imp.missing.length > 0}
        >
          {imp.busy ? 'Importando…' : `Importar ${imp.rowCount || ''} fila(s)`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
