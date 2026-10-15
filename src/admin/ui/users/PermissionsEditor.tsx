// Un módulo por fila con su nivel de acceso (sin acceso / ver / editar).
import * as React from 'react';
import { Button } from '../../../components/ui/button';
import { Select } from '../../../components/ui/select';
import { Icon } from '../icons';
import type { Mod } from '../lib/modules';
import { accessLevel, accessOptionsFor, viewAll, withAccess, type Permission } from '../lib/users';

interface PermissionsEditorProps {
  modules: Mod[];
  value: Permission[];
  onChange: (permissions: Permission[]) => void;
}

export function PermissionsEditor({ modules, value, onChange }: Readonly<PermissionsEditorProps>) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">Módulos que puede usar</p>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange(viewAll(modules))}>
            Todos: ver
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>
            Ninguno
          </Button>
        </div>
      </div>
      <div className="max-h-72 divide-y divide-border overflow-y-auto rounded-lg border border-border">
        {modules.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-3 py-2">
            <Icon name={m.icon} className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate text-sm">
              {m.name}
              {m.source_type === 'query' && <span className="ml-1 text-xs text-muted-foreground">(consulta)</span>}
            </span>
            <Select
              className="w-40"
              id={`acceso-${m.id}`}
              options={accessOptionsFor(m)}
              value={accessLevel(value, m.id)}
              onValueChange={(level) => onChange(withAccess(value, m.id, level))}
            />
          </div>
        ))}
        {!modules.length && <p className="p-3 text-sm text-muted-foreground">Aún no hay módulos.</p>}
      </div>
    </div>
  );
}
