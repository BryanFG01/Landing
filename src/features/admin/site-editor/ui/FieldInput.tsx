// Un campo del formulario genérico de Sitio web: elige el control según el tipo de su FieldDef.
import * as React from 'react';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { ColorField } from '@/features/admin/core/ui/ColorField';
import { optionsOf } from '@/features/admin/core/ui/lib/lists';
import type { FieldInputProps } from './Fields.types';
import { ImageField } from './ImageField';
import { asImg, asItems, asLines, asText, fontOptions } from './lib/siteEditor';
import { ListField } from './ListField';
import { VideoField } from './VideoField';

export function FieldInput({ def, value, onChange }: Readonly<FieldInputProps>) {
  switch (def.type) {
    case 'text':
      return <Input label={def.label} helperText={def.help} maxLength={def.max} value={asText(value)} onChange={(e) => onChange(e.target.value)} />;
    case 'textarea':
      return (
        <Textarea label={def.label} helperText={def.help} maxLength={def.max} rows={3} value={asText(value)} onChange={(e) => onChange(e.target.value)} />
      );
    case 'lines':
      return (
        <Textarea label={def.label} helperText={def.help} rows={5} value={asLines(value)} onChange={(e) => onChange(e.target.value.split('\n'))} />
      );
    case 'color':
      return <ColorField label={def.label} help={def.help} optional={def.optional} value={asText(value)} onChange={onChange} />;
    case 'group':
      // Los grupos se pintan en Fields: sus campos van en el mismo objeto.
      return null;
    case 'font':
      return <Select label={def.label} options={fontOptions(def.uso)} value={asText(value)} onValueChange={onChange} />;
    case 'select':
      return <Select label={def.label} options={optionsOf(def.options)} value={asText(value)} onValueChange={onChange} />;
    case 'video':
      return <VideoField label={def.label} help={def.help} value={asText(value)} onChange={onChange} />;
    case 'image':
      return <ImageField label={def.label} help={def.help} value={asImg(value)} onChange={onChange} />;
    case 'list':
      return <ListField def={def} value={asItems(value)} onChange={onChange} />;
  }
}
