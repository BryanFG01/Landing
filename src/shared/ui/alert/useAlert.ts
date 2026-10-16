import { useState } from 'react';

/** Visibilidad de la alerta: al cerrarla se oculta y se avisa a quien la usa. */
export function useAlert(onDismiss?: () => void) {
  const [visible, setVisible] = useState(true);

  function dismiss() {
    setVisible(false);
    onDismiss?.();
  }

  return { visible, dismiss };
}
