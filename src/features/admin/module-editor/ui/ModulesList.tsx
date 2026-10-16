// Constructor: lista de módulos y grupos del menú.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Icon } from '@/features/admin/core/ui/icons';
import { PageHeader } from '@/features/admin/core/ui/PageHeader';
import { useModulesList } from './hooks/useModulesList';
import { GroupsCard } from './GroupsCard';
import { ModulesTable } from './ModulesTable';
import type { ModulesListProps } from './ModulesList.types';

export function ModulesList({ modules, groups }: Readonly<ModulesListProps>) {
  const list = useModulesList(modules, groups);

  return (
    <>
      <PageHeader
        title="Constructor de módulos"
        description="Cada módulo es una entrada del menú con su formulario, su tabla y sus filtros. Puede guardar sus propios registros, editar una tabla de la base o mostrar una consulta SQL."
        icon="wrench"
        actions={
          <Button onClick={list.create}>
            <Icon name="plus" /> Nuevo módulo
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-4">
          <ModulesTable rows={list.rows} onOpen={list.open} onConfigure={list.configure} />
        </Card>
        <GroupsCard initial={groups} />
      </div>
    </>
  );
}
