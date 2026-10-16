// Datos generales del módulo: nombre, clave, descripción, menú, icono, orden por defecto y si está activo.
import * as React from 'react';
import { Card } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Select } from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';
import { DIR_OPTIONS, groupOptions } from './lib/moduleEditor';
import { IconPicker } from './IconPicker';
import type { GeneralCardProps } from './GeneralCard.types';

export function GeneralCard({ editor, groups }: Readonly<GeneralCardProps>) {
  const { mod, draft, choices } = editor;
  const { set } = draft;
  return (
    <Card className="space-y-5 p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre *" placeholder="Ej. Productos" value={mod.name} onChange={(e) => draft.setName(e.target.value)} />
        <Input
          label="Clave *"
          helperText={`URL: /admin/m/${mod.module_key || '…'}`}
          value={mod.module_key}
          onChange={(e) => draft.setKey(e.target.value)}
        />
        <div className="sm:col-span-2">
          <Textarea label="Descripción" rows={2} value={mod.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
        </div>
        <Select
          label="Grupo del menú"
          options={groupOptions(groups)}
          value={String(mod.group_id ?? 0)}
          onValueChange={(v) => set({ group_id: Number(v) || null })}
        />
        <Input
          label="Posición en el menú"
          type="number"
          value={mod.sort_order}
          onChange={(e) => set({ sort_order: Number(e.target.value) || 0 })}
        />
      </div>

      <IconPicker value={mod.icon} onChange={(icon) => set({ icon })} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Select label="Ordenar por defecto" options={choices} value={mod.default_sort} onValueChange={(default_sort) => set({ default_sort })} />
        <Select
          label="Dirección"
          options={DIR_OPTIONS}
          value={mod.default_dir}
          onValueChange={(v) => set({ default_dir: v as 'asc' | 'desc' })}
        />
        <Input
          label="Registros por página"
          type="number"
          min={5}
          max={100}
          value={mod.page_size}
          onChange={(e) => set({ page_size: Number(e.target.value) || 20 })}
        />
      </div>

      <Switch
        label="Módulo activo"
        description="Si lo desactivas, desaparece del menú pero no se borra nada."
        checked={mod.is_active}
        onCheckedChange={(is_active) => set({ is_active })}
      />
    </Card>
  );
}
