// Datos generales del módulo: nombre, clave, descripción, menú, icono, orden por defecto y si está activo.
import * as React from 'react';
import { Card } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import { cn } from '../../../components/lib/utils';
import { ICONS, type ModuleGroup } from '../../schema';
import type { ModuleEditorState } from '../hooks/useModuleEditor';
import { Icon } from '../icons';
import { DIR_OPTIONS, groupOptions } from '../lib/moduleEditor';

function IconPicker({ value, onChange }: Readonly<{ value: string | null | undefined; onChange: (icon: string) => void }>) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">Icono</p>
      <div className="flex flex-wrap gap-2">
        {ICONS.map((name) => (
          <button
            key={name}
            type="button"
            aria-label={name}
            aria-pressed={value === name}
            onClick={() => onChange(name)}
            className={cn(
              'grid size-10 place-items-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              value === name ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon name={name} className="size-5" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function GeneralCard({ editor, groups }: Readonly<{ editor: ModuleEditorState; groups: ModuleGroup[] }>) {
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
