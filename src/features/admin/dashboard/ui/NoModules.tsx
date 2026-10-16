// Inicio sin módulos: el administrador puede crear el primero; el resto, pedir acceso.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Icon } from '@/features/admin/core/ui/icons';
import { useRouter } from '@/features/admin/core/ui/router';
import type { NoModulesProps } from './DashboardView.types';

export function NoModules({ isAdmin }: Readonly<NoModulesProps>) {
  const { navigate } = useRouter();
  return (
    <Card className="p-6 text-center">
      {isAdmin ? (
        <>
          <p className="text-sm text-muted-foreground">Aún no hay módulos.</p>
          <Button className="mt-4" onClick={() => navigate('/admin/modulos/nuevo')}>
            <Icon name="plus" /> Crear el primero
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Aún no tienes módulos asignados. Pide a un administrador que te dé acceso.</p>
      )}
    </Card>
  );
}
