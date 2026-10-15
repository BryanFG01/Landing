// Diálogo de confirmación (borrar, publicar…). Solo pinta: la acción la decide quien lo usa.
import * as React from 'react';
import { Button } from '../../components/ui/button';
import { Modal } from '../../components/ui/modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  /** Texto del botón mientras se ejecuta. */
  busyLabel?: string;
  busy?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busyLabel,
  busy = false,
  destructive = false,
  onConfirm,
  onCancel,
}: Readonly<ConfirmDialogProps>) {
  return (
    <Modal open={open} onOpenChange={(o) => !o && onCancel()} title={title} description={description} maxWidth="sm">
      <Modal.Footer>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant={destructive ? 'destructive' : 'default'} onClick={onConfirm} disabled={busy}>
          {busy && busyLabel ? busyLabel : confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
