// Ajustes de un campo de relación: a qué módulo apunta y qué campo suyo se muestra.
import * as React from 'react';
import { Select } from '@/shared/ui/select';
import { relationLabelChoices } from '../lib/editorView';
import { relationTargets } from '../lib/moduleEditor';
import type { RelationEditorProps } from './RelationEditor.types';

export function RelationEditor({ field, modules, onChange }: Readonly<RelationEditorProps>) {
  const labels = relationLabelChoices(modules, field.relation_module);
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
        options={labels.options}
        value={field.relation_label || undefined}
        disabled={!labels.hasTarget}
        onValueChange={(relation_label) => onChange({ ...field, relation_label })}
      />
    </>
  );
}
