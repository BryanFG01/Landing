import type { SkeletonRowProps } from './types';

/** Fila de carga con un bloque pulsante por columna. */
export function SkeletonRow({ colCount }: Readonly<SkeletonRowProps>) {
  return (
    <tr>
      {Array.from({ length: colCount }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
        </td>
      ))}
    </tr>
  );
}
