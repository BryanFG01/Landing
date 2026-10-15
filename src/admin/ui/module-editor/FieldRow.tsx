// Un campo del formulario del módulo: etiqueta, clave, tipo y opciones según el tipo.
import * as React from 'react';
import { Badge } from '../../../components/ui/badge';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import { FIELD_TYPES, type FieldConfig, type FieldType } from '../../schema';
import { optionsOf } from '../lib/lists';
import { optionsToText, relationTargets, slugify, textToOptions, type Choice, type EditorModule } from '../lib/moduleEditor';

const FIELD_TYPE_OPTIONS = optionsOf(FIELD_TYPES);

/** Número opcional de un input: vacío → sin límite. */
const optionalNumber = (v: string) => (v === '' ? undefined : Number(v));

interface FieldRowProps {
  field: FieldConfig;
  index: number;
  /** La clave sigue a la etiqueta mientras no se toque a mano. */
  autoKey: boolean;
  modules: EditorModule[];
  /** Módulos de tabla: la clave es una columna de la tabla. */
  columnChoices?: Choice[];
  onChange: (field: FieldConfig, keyEdited?: boolean) => void;
  tools: React.ReactNode;
}

function OptionsEditor({ field, onChange }: Readonly<{ field: FieldConfig; onChange: (f: FieldConfig) => void }>) {
  // Texto tal cual se escribe (las líneas a medias no se pierden al convertir a opciones).
  const [text, setText] = React.useState(() => optionsToText(field.options));
  return (
    <div className="sm:col-span-2 lg:col-span-4">
      <Textarea
        label="Opciones"
        helperText='Una por línea. Escribe "valor | Etiqueta" para fijar el valor guardado.'
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange({ ...field, options: textToOptions(e.target.value) });
        }}
      />
    </div>
  );
}

function RelationEditor({ field, modules, onChange }: Readonly<{ field: FieldConfig; modules: EditorModule[]; onChange: (f: FieldConfig) => void }>) {
  const target = modules.find((m) => m.module_key === field.relation_module);
  return (
    <>
      <Select
        label="Módulo relacionado"
        options={relationTargets(modules)}
        value={field.relation_module || undefined}
        onValueChange={(relation_module) => onChange({ ...field, relation_module, relation_label: '' })}
      />
      <Select
        label="Campo que se muestra"
        options={(target?.fields ?? []).map((f) => ({ value: f.key, label: f.label }))}
        value={field.relation_label || undefined}
        disabled={!target}
        onValueChange={(relation_label) => onChange({ ...field, relation_label })}
      />
    </>
  );
}

export function FieldRow({ field, index, autoKey, modules, columnChoices, onChange, tools }: Readonly<FieldRowProps>) {
  const isNumber = field.type === 'number' || field.type === 'currency';
  const isText = field.type === 'text' || field.type === 'textarea';
  const isList = field.type === 'select' || field.type === 'multiselect';

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
        {field.type === 'relation' && <RelationEditor field={field} modules={modules} onChange={onChange} />}
      </div>
    </Card>
  );
}
