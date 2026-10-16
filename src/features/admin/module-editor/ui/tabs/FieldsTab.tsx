// Pestaña "Campos": el formulario de alta y edición del módulo.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/features/admin/core/ui/icons';
import { tableColumnChoices } from '../lib/moduleEditor';
import { FieldRow } from '../FieldRow';
import { RowTools } from '../RowTools';
import type { EditorProps } from '../types';

const FIELDS_HELP = {
  table: 'Los campos son las columnas de la tabla que se rellenan en el formulario. Las autonuméricas y las que tienen valor por defecto pueden quedarse fuera.',
  other: 'Los campos forman el formulario de alta y edición. Cambiar o quitar un campo no borra los datos ya guardados.',
};

export function FieldsTab({ editor }: Readonly<EditorProps>) {
  const { mod, draft, otherModules, sourceColumns, isTable } = editor;
  return (
    <>
      <p className="text-sm text-muted-foreground">{isTable ? FIELDS_HELP.table : FIELDS_HELP.other}</p>
      {mod.fields.map((f, i) => (
        <FieldRow
          key={draft.fieldIds[i]}
          field={f}
          index={i}
          autoKey={draft.autoKey(i)}
          modules={otherModules}
          columnChoices={isTable ? tableColumnChoices(sourceColumns, mod.source_pk, f.key) : undefined}
          onChange={(field, keyEdited) => draft.updateField(i, field, keyEdited)}
          tools={<RowTools onUp={() => draft.moveField(i, -1)} onDown={() => draft.moveField(i, 1)} onRemove={() => draft.removeField(i)} />}
        />
      ))}
      <Button variant="outline" onClick={draft.addField}>
        <Icon name="plus" /> Añadir campo
      </Button>
    </>
  );
}
