// Tarjeta de grupos del menú: los grupos (con sus acciones) y el formulario de alta de uno nuevo.
import * as React from 'react';
import type { ModuleGroup } from '@/features/admin/core/domain/schema';
import { useGroups } from './useGroups';

export function useGroupsCard(initial: ModuleGroup[]) {
  const groups = useGroups(initial);
  const [name, setName] = React.useState('');

  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (name.trim() && (await groups.create(name))) setName('');
  }

  return { ...groups, name, setName, submit };
}
