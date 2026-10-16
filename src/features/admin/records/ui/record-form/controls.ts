// Control del formulario para cada tipo de campo. Los tipos que no están aquí (texto, email, URL, teléfono) usan el
// campo de texto corto.
import type { ComponentType } from 'react';
import type { FieldType } from '@/features/admin/core/domain/schema';
import { FileControl } from '../FileControl';
import { BooleanControl } from './BooleanControl';
import { DateControl } from './DateControl';
import { MultiSelectControl } from './MultiSelectControl';
import { NumberControl } from './NumberControl';
import { SelectControl } from './SelectControl';
import { TextareaControl } from './TextareaControl';
import { TextControl } from './TextControl';
import type { FieldControlProps } from './types';

const FIELD_CONTROLS: Partial<Record<FieldType, ComponentType<FieldControlProps>>> = {
  textarea: TextareaControl,
  number: NumberControl,
  currency: NumberControl,
  date: DateControl,
  boolean: BooleanControl,
  select: SelectControl,
  relation: SelectControl,
  image: FileControl,
  file: FileControl,
  multiselect: MultiSelectControl,
};

export const controlFor = (type: FieldType): ComponentType<FieldControlProps> => FIELD_CONTROLS[type] ?? TextControl;
