// Grupos del menú: crear, renombrar/reordenar y borrar. Tras cada cambio se recargan los grupos y el menú lateral.
import * as React from 'react';
import { useToast } from '@/shared/ui/toast';
import type { ModuleGroup } from '@/features/admin/core/domain/schema';
import { api, errorMessage } from '@/features/admin/core/ui/api';
import { useNav } from '@/features/admin/core/ui/nav';

export function useGroups(initial: ModuleGroup[]) {
  const { toast } = useToast();
  const { refreshNav } = useNav();
  const [groups, setGroups] = React.useState(initial);

  const run = React.useCallback(
    async (fn: () => Promise<unknown>, ok: string) => {
      try {
        await fn();
        setGroups((await api<{ groups: ModuleGroup[] }>('/groups')).groups);
        await refreshNav();
        toast({ variant: 'success', title: ok });
        return true;
      } catch (err) {
        toast({ variant: 'error', title: errorMessage(err, 'No se pudo guardar.') });
        return false;
      }
    },
    [refreshNav, toast],
  );

  return {
    groups,
    create: (name: string) =>
      run(() => api('/groups', { method: 'POST', body: { name, sort_order: groups.length } }), 'Grupo creado'),
    update: (group: ModuleGroup, patch: Partial<ModuleGroup>) =>
      run(() => api(`/groups/${group.id}`, { method: 'PUT', body: { ...group, ...patch } }), 'Grupo guardado'),
    remove: (group: ModuleGroup) => run(() => api(`/groups/${group.id}`, { method: 'DELETE' }), 'Grupo borrado'),
  };
}
