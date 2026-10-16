// Botón que abre el selector de archivos del sistema (el <input type="file"> va oculto).
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import type { FilePickerProps } from './FilePicker.types';
import { Icon } from './icons';

export function FilePicker({
  accept,
  label,
  children,
  onPick,
  disabled,
  size = 'sm',
  variant = 'outline',
}: Readonly<FilePickerProps>) {
  const input = React.useRef<HTMLInputElement>(null);
  return (
    // relative: el input oculto (sr-only es absoluto) se queda junto al botón. Sin esto se ubica respecto a la página
    // y la alarga: el panel entero, con su menú lateral, se desplazaba.
    <span className="relative inline-flex">
      <input
        ref={input}
        type="file"
        accept={accept}
        className="sr-only"
        aria-label={label}
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Se vacía para poder elegir otra vez el mismo archivo.
          e.target.value = '';
          if (file) onPick(file);
        }}
      />
      <Button type="button" size={size} variant={variant} disabled={disabled} onClick={() => input.current?.click()}>
        <Icon name="upload" /> {children}
      </Button>
    </span>
  );
}
