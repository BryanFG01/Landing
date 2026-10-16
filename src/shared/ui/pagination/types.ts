import type * as React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  siblingCount?: number;
  className?: string;
}

/** Paso intermedio del cálculo: número de página o marcador de salto. */
export type RangeSlot = number | '...';

/** Hueco de la paginación: un número de página o unos puntos suspensivos. */
export interface PaginationItem {
  key: string | number;
  page: number;
  isEllipsis: boolean;
}

/** Botón interno de la paginación (anterior, siguiente y cada página). */
export interface PagBtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
}
