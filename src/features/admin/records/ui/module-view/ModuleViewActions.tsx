// Botones de la cabecera del módulo: configurar, exportar y, si se puede editar, importar y crear.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/features/admin/core/ui/icons';
import type { ModuleViewActionsProps } from './types';

export function ModuleViewActions({ page, canConfigure }: Readonly<ModuleViewActionsProps>) {
  const { rows, editor } = page;
  return (
    <>
      {canConfigure && (
        <Button variant="outline" onClick={page.configure}>
          <Icon name="wrench" /> Configurar
        </Button>
      )}
      <Button variant="outline" onClick={rows.exportExcel} disabled={rows.exporting}>
        <Icon name="download" /> {rows.exporting ? 'Exportando…' : 'Exportar a Excel'}
      </Button>
      {page.canEdit && (
        <>
          <Button variant="outline" onClick={page.openImport}>
            <Icon name="upload" /> Importar
          </Button>
          <Button onClick={() => editor.open('new')}>
            <Icon name="plus" /> Nuevo registro
          </Button>
        </>
      )}
    </>
  );
}
