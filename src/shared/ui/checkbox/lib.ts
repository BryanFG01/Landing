import type { CheckboxProps } from './types';

/** La casilla está a medias (p. ej. "seleccionar todo" con solo algunas filas marcadas). */
export const isIndeterminate = (checked: CheckboxProps['checked']): boolean => checked === 'indeterminate';
