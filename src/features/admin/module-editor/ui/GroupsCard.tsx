// Grupos del menú: los apartados del sidebar en los que se ordenan los módulos.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Icon } from '@/features/admin/core/ui/icons';
import { useGroupsCard } from './hooks/useGroupsCard';
import { GroupRow } from './GroupRow';
import type { GroupsCardProps } from './GroupsCard.types';

export function GroupsCard({ initial }: Readonly<GroupsCardProps>) {
  const groups = useGroupsCard(initial);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Grupos del menú</CardTitle>
        <CardDescription>Los apartados en los que se ordenan los módulos del sidebar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {groups.groups.map((g) => (
          <GroupRow key={g.id} group={g} onSave={(patch) => groups.update(g, patch)} onDelete={() => groups.remove(g)} />
        ))}
        <form className="flex gap-2 pt-2" onSubmit={groups.submit}>
          <div className="flex-1">
            <Input placeholder="Nuevo grupo, p. ej. Ventas" value={groups.name} onChange={(e) => groups.setName(e.target.value)} />
          </div>
          <Button type="submit" variant="outline">
            <Icon name="plus" /> Añadir
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
