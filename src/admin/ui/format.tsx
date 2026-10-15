// Formato de las celdas según columnConfigs. El backend entrega los valores tal cual; presentarlos es cosa del frontend.
import * as React from 'react';
import { Badge } from '../../components/ui/badge';
import type { ColumnConfig, FieldConfig, Option } from '../schema';

const dateFmt = new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const numberFmt = new Intl.NumberFormat('es-CO');
const currencyFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

/** Una fecha sin hora (YYYY-MM-DD) se interpreta en local, no en UTC, para que no se corra un día. */
const parseDate = (v: string) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00`) : new Date(v));

/** Etiqueta de un valor de lista o relación. */
export function optionLabel(value: unknown, options: Option[] | undefined) {
  return options?.find((o) => o.value === String(value))?.label ?? String(value);
}

export function formatCell(
  value: unknown,
  column: ColumnConfig,
  field: FieldConfig | undefined,
  relationOptions: Option[] | undefined,
): React.ReactNode {
  const empty = column.null_display ?? '—';
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && !value.length)) {
    return <span className="text-muted-foreground">{empty}</span>;
  }
  const options = field?.type === 'relation' ? relationOptions : field?.options;

  switch (column.data_type) {
    case 'number':
      return typeof value === 'number' ? numberFmt.format(value) : String(value);
    case 'currency':
      return typeof value === 'number' ? currencyFmt.format(value) : String(value);
    case 'date':
      return Number.isNaN(parseDate(String(value)).getTime()) ? String(value) : dateFmt.format(parseDate(String(value)));
    case 'datetime':
      return Number.isNaN(Date.parse(String(value))) ? String(value) : dateTimeFmt.format(new Date(String(value)));
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
        <Badge variant="info" size="sm">
          {optionLabel(value, options)}
        </Badge>
      );
    case 'list':
      return (
        <span className="flex flex-wrap gap-1">
          {(Array.isArray(value) ? value : [value]).map((v) => (
            <Badge key={String(v)} variant="muted" size="sm">
              {optionLabel(v, options)}
            </Badge>
          ))}
        </span>
      );
    default: {
      const text = options ? optionLabel(value, options) : String(value);
      return text.length > 80 ? `${text.slice(0, 80)}…` : text;
    }
  }
}
