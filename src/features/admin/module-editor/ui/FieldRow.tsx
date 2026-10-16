// Un campo del formulario del módulo: etiqueta, clave, tipo y opciones según el tipo.
import * as React from 'react';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { FIELD_TYPES, type FieldType } from '@/features/admin/core/domain/schema';
import { optionsOf } from '@/features/admin/core/ui/lib/lists';
import { fieldKinds, optionalNumber } from './lib/editorView';
import { slugify } from './lib/moduleEditor';
import { OptionsEditor } from './field-row/OptionsEditor';
import { RelationEditor } from './field-row/RelationEditor';
import type { FieldRowProps } from './FieldRow.types';

const FIELD_TYPE_OPTIONS = optionsOf(FIELD_TYPES);

export function FieldRow({ field, index, autoKey, modules, columnChoices, onChange, tools }: Readonly<FieldRowProps>) {
  const { isNumber, isText, isList, isRelation } = fieldKinds(field);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <span className="text-muted-foreground tabular-nums">{index + 1}.</span>
          {field.label || 'Campo sin nombre'}
          <Badge variant="muted" size="sm">
            {FIELD_TYPES[field.type]}
          </Badge>
        </p>
        {tools}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          label="Etiqueta"
          value={field.label}
          onChange={(e) =>
            onChange({ ...field, label: e.target.value, key: autoKey && !columnChoices ? slugify(e.target.value) : field.key })
          }
        />
        {columnChoices ? (
          <Select
            label="Columna"
            options={columnChoices}
            value={field.key || undefined}
            placeholder="Elegir columna"
            onValueChange={(key) => onChange({ ...field, key }, true)}
          />
        ) : (
          <Input
            label="Clave"
            helperText="Nombre interno (slug)"
            value={field.key}
            onChange={(e) => onChange({ ...field, key: e.target.value.toLowerCase() }, true)}
          />
        )}
        <Select
          label="Tipo"
          options={FIELD_TYPE_OPTIONS}
          value={field.type}
          onValueChange={(type) => onChange({ ...field, type: type as FieldType })}
        />
        <div className="flex items-end pb-1.5">
          <Switch label="Obligatorio" checked={field.required === true} onCheckedChange={(required) => onChange({ ...field, required })} />
        </div>
        <Input label="Texto de ejemplo" value={field.placeholder ?? ''} onChange={(e) => onChange({ ...field, placeholder: e.target.value })} />
        <Input label="Ayuda" value={field.help ?? ''} onChange={(e) => onChange({ ...field, help: e.target.value })} />

        {isNumber && (
          <>
            <Input label="Mínimo" type="number" value={field.min ?? ''} onChange={(e) => onChange({ ...field, min: optionalNumber(e.target.value) })} />
            <Input label="Máximo" type="number" value={field.max ?? ''} onChange={(e) => onChange({ ...field, max: optionalNumber(e.target.value) })} />
          </>
        )}

        {isText && (
          <Input
            label="Máximo de caracteres"
            type="number"
            value={field.max_length ?? ''}
            onChange={(e) => onChange({ ...field, max_length: optionalNumber(e.target.value) })}
          />
        )}

        {isList && <OptionsEditor field={field} onChange={onChange} />}
        {isRelation && <RelationEditor field={field} modules={modules} onChange={onChange} />}
      </div>
    </Card>
  );
}
