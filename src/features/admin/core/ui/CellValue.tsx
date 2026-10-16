// Celda de la tabla según columnConfigs. El backend entrega los valores tal cual; presentarlos es cosa del frontend.
// Los formateos están en lib/cells.ts; aquí solo se elige qué pintar para cada tipo de dato.
import * as React from 'react';
import { Badge } from '@/shared/ui/badge';
import { fileUrl, parseFileRef } from '../domain/schema';
import type { CellValueProps } from './CellValue.types';
import {
  asList,
  cellOptions,
  formatCurrencyCell,
  formatDateCell,
  formatDateTimeCell,
  formatNumberCell,
  isEmptyCell,
  optionLabel,
  phoneCellHref,
  plainCellText,
} from './lib/cells';

export function CellValue({ value, column, field, relationOptions }: Readonly<CellValueProps>): React.ReactNode {
  const empty = column.null_display ?? '—';
  if (isEmptyCell(value)) {
    return <span className="text-muted-foreground">{empty}</span>;
  }
  const options = cellOptions(field, relationOptions);

  switch (column.data_type) {
    case 'image': {
      const ref = parseFileRef(value);
      if (!ref) return <span className="text-muted-foreground">{empty}</span>;
      return (
        <a href={fileUrl(ref)} target="_blank" rel="noopener" className="inline-block">
          <img
            src={fileUrl(ref)}
            alt={ref.name}
            loading="lazy"
            className="size-10 rounded-md border border-border object-cover"
          />
        </a>
      );
    }
    case 'file': {
      const ref = parseFileRef(value);
      if (!ref) return <span className="text-muted-foreground">{empty}</span>;
      return (
        <a href={fileUrl(ref)} target="_blank" rel="noopener" className="text-primary underline-offset-4 hover:underline">
          {ref.name}
        </a>
      );
    }
    case 'number':
      return formatNumberCell(value);
    case 'currency':
      return formatCurrencyCell(value);
    case 'date':
      return formatDateCell(value);
    case 'datetime':
      return formatDateTimeCell(value);
    case 'boolean':
      return value ? (
        <Badge variant="success" size="sm" dot>
          Sí
        </Badge>
      ) : (
        <Badge variant="muted" size="sm">
          No
        </Badge>
      );
    case 'badge':
      return (
        <Badge variant="default" size="sm">
          {optionLabel(value, options)}
        </Badge>
      );
    case 'list':
      return (
        <span className="flex flex-wrap gap-1">
          {asList(value).map((v) => (
            <Badge key={String(v)} variant="muted" size="sm">
              {optionLabel(v, options)}
            </Badge>
          ))}
        </span>
      );
    default: {
      const ref = parseFileRef(value);
      if (ref) return ref.name;
      const wa = phoneCellHref(value, field);
      if (wa) {
        return (
          <a
            href={wa}
            target="_blank"
            rel="noopener"
            title="Escribirle por WhatsApp"
            onClick={(e) => e.stopPropagation()}
            className="text-primary underline-offset-4 hover:underline"
          >
            {String(value)}
          </a>
        );
      }
      return plainCellText(value, options);
    }
  }
}
