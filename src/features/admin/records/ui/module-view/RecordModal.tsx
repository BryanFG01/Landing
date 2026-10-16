// Modal de alta y edición de un registro.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Modal } from '@/shared/ui/modal';
import { RecordForm } from '../RecordForm';
import type { RecordModalProps } from './types';

export function RecordModal({ page, fields }: Readonly<RecordModalProps>) {
  const { editor, rows } = page;
  return (
    <Modal
      open={page.isEditing}
      onOpenChange={page.onModalOpenChange}
      title={editor.title}
      maxWidth="lg"
      className="max-h-[85dvh] overflow-y-auto"
    >
      <form noValidate onSubmit={page.submit}>
        <RecordForm
          fields={fields}
          values={editor.values}
          errors={editor.errors}
          relationOptions={rows.relationOptions}
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
  );
}
