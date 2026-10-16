// Tipos de Fields.tsx y de sus campos (FieldInput, FieldGroup, ListField, ImageField, VideoField).
import type { FieldDef, Img } from '@/features/landing/domain/sitio';

export type Values = Record<string, unknown>;
export type ListDef = Extract<FieldDef, { type: 'list' }>;
export type GroupDef = Extract<FieldDef, { type: 'group' }>;

export interface ImageFieldProps {
  label: string;
  value: Img;
  onChange: (v: Img) => void;
  help?: string;
}

export interface VideoFieldProps {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
}

export interface ListFieldProps {
  def: ListDef;
  value: Values[];
  onChange: (v: Values[]) => void;
}

export interface FieldInputProps {
  def: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
}

export interface FieldGroupProps {
  def: GroupDef;
  value: Values;
  onChange: (v: Values) => void;
}

export interface FieldsProps {
  fields: FieldDef[];
  value: Values;
  onChange: (v: Values) => void;
}
