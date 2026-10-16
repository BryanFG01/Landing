// Control de un campo del formulario: elige el componente según el tipo del campo (mapa en controls.ts).
import * as React from 'react';
import { controlFor } from './controls';
import type { FieldControlProps } from './types';

export function FieldControl(props: Readonly<FieldControlProps>) {
  const Control = controlFor(props.field.type);
  return <Control {...props} />;
}
