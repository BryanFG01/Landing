// Borrador de la definición de un módulo en el constructor y sus campos. Mientras no se toque a mano, la clave del
// módulo sigue al nombre (módulo nuevo) y la de cada campo nuevo a su etiqueta.
import * as React from 'react';
import type { FieldConfig } from '../../schema';
import { removeAt, replaceAt, swap } from '../lib/lists';
import { NEW_MODULE, slugify, suggestColumns, type EditorModule } from '../lib/moduleEditor';

const firstDraft = (initial: EditorModule | null): EditorModule => {
  const base = initial ?? NEW_MODULE;
  return {
    ...base,
    column_configs: base.column_configs.length ? base.column_configs : suggestColumns(base.fields, base.source_type),
  };
};

export function useModuleDraft(initial: EditorModule | null) {
  const isNew = !initial?.id;
  const [mod, setMod] = React.useState<EditorModule>(() => firstDraft(initial));
  const [keyTouched, setKeyTouched] = React.useState(!isNew);
  // Por campo: si su clave ya se tocó a mano, y un id estable para React (los campos no tienen id propio).
  const [fieldKeyTouched, setFieldKeyTouched] = React.useState<boolean[]>(() => mod.fields.map(() => !isNew));
  const [fieldIds, setFieldIds] = React.useState<number[]>(() => mod.fields.map((_, i) => i));
  const nextId = React.useRef(mod.fields.length);

  const set = React.useCallback((patch: Partial<EditorModule>) => setMod((m) => ({ ...m, ...patch })), []);

  /** Sustituye todos los campos (al traer columnas de una tabla, probar una consulta o cambiar de origen). */
  const replaceFields = React.useCallback((fields: FieldConfig[], patch: Partial<EditorModule> = {}) => {
    setMod((m) => ({ ...m, fields, ...patch }));
    setFieldKeyTouched(fields.map(() => true));
    setFieldIds(fields.map(() => nextId.current++));
  }, []);

  function setName(name: string) {
    set({ name, ...(keyTouched ? {} : { module_key: slugify(name) }) });
  }

  function setKey(key: string) {
    setKeyTouched(true);
    set({ module_key: key.toLowerCase() });
  }

  /** `keyEdited`: se cambió la clave a mano (deja de seguir a la etiqueta). */
  function updateField(i: number, field: FieldConfig, keyEdited = false) {
    setMod((m) => ({ ...m, fields: replaceAt(m.fields, i, field) }));
    if (keyEdited) setFieldKeyTouched((t) => replaceAt(t, i, true));
  }

  function addField() {
    setMod((m) => ({ ...m, fields: [...m.fields, { key: '', label: '', type: 'text' }] }));
    setFieldKeyTouched((t) => [...t, false]);
    setFieldIds((ids) => [...ids, nextId.current++]);
  }

  function moveField(i: number, delta: number) {
    setMod((m) => ({ ...m, fields: swap(m.fields, i, delta) }));
    setFieldKeyTouched((t) => swap(t, i, delta));
    setFieldIds((ids) => swap(ids, i, delta));
  }

  function removeField(i: number) {
    setMod((m) => ({ ...m, fields: removeAt(m.fields, i) }));
    setFieldKeyTouched((t) => removeAt(t, i));
    setFieldIds((ids) => removeAt(ids, i));
  }

  return {
    mod,
    isNew,
    keyTouched,
    set,
    replaceFields,
    setName,
    setKey,
    fieldIds,
    /** La clave del campo i sigue a su etiqueta. */
    autoKey: (i: number) => !fieldKeyTouched[i],
    updateField,
    addField,
    moveField,
    removeField,
  };
}

export type ModuleDraft = ReturnType<typeof useModuleDraft>;
