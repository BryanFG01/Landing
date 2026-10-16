// "Origen de los datos" del módulo: registros del panel, tabla de la base (con su SQL) o consulta SQL (con su prueba).
// Las piezas de cada origen están en source/.
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import { QuerySource } from './source/QuerySource';
import { SourcePicker } from './source/SourcePicker';
import { TableSource } from './source/TableSource';
import type { EditorProps } from './types';

export function SourceCard({ editor }: Readonly<EditorProps>) {
  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-sans text-base font-semibold">Origen de los datos</h2>
        <p className="text-sm text-muted-foreground">De dónde salen las filas que muestra el módulo.</p>
      </div>
      <SourcePicker editor={editor} />
      {editor.isTable && <TableSource editor={editor} />}
      {editor.isQuery && <QuerySource editor={editor} />}
    </Card>
  );
}
