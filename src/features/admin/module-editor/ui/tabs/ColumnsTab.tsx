// Pestaña "Tabla": las columnas que muestra la tabla del módulo, en orden.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/features/admin/core/ui/icons';
import { ColumnRow } from './ColumnRow';
import type { EditorProps } from '../types';

export function ColumnsTab({ editor }: Readonly<EditorProps>) {
  const { mod, columnActions } = editor;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Columnas de la tabla del módulo, en este orden.</p>
        <Button variant="outline" size="sm" onClick={columnActions.regenerate}>
          Generar desde los campos
        </Button>
      </div>
      {mod.column_configs.map((c, i) => (
        // Las columnas no tienen id propio (la misma columna puede repetirse): se identifican por su posición.
        // eslint-disable-next-line react/no-array-index-key
        <ColumnRow key={i} editor={editor} column={c} index={i} />
      ))}
      <Button variant="outline" onClick={columnActions.add}>
        <Icon name="plus" /> Añadir columna
      </Button>
    </>
  );
}
