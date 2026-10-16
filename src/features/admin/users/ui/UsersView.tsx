// Usuarios del panel y sus permisos. Administrador: todo el panel. Usuario: solo los módulos asignados, para ver o
// para editar. La lógica está en hooks/useUsers.ts y lib/users.ts; las columnas, en hooks/useUserColumns.ts.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { DataTable } from '@/shared/ui/data-table';
import { ConfirmDialog } from '@/features/admin/core/ui/ConfirmDialog';
import { Icon } from '@/features/admin/core/ui/icons';
import { PageHeader } from '@/features/admin/core/ui/PageHeader';
import { useUserColumns } from './hooks/useUserColumns';
import { useUsers } from './hooks/useUsers';
import { UserFormModal } from './UserFormModal';
import type { UsersViewProps } from './UsersView.types';

export function UsersView({ me }: Readonly<UsersViewProps>) {
  const users = useUsers(me);
  const columns = useUserColumns({ me, moduleNames: users.moduleNames, onEdit: users.open, onDelete: users.askDelete });

  return (
    <>
      <PageHeader
        title="Usuarios y permisos"
        description="Los administradores configuran todo el panel. Los usuarios solo ven los módulos que les asignes, para consultar o para editar."
        icon="user-gear"
        actions={
          <Button onClick={() => users.open('new')}>
            <Icon name="plus" /> Nuevo usuario
          </Button>
        }
      />
      <Card className="p-4">
        <DataTable data={users.users ?? []} loading={!users.users} columns={columns} />
      </Card>

      <UserFormModal
        open={users.isEditing}
        isNew={users.isNew}
        isSelf={users.isSelf}
        form={users.form}
        errors={users.errors}
        modules={users.modules}
        saving={users.saving}
        onChange={users.setForm}
        onSubmit={users.save}
        onClose={users.close}
      />

      <ConfirmDialog
        open={users.isDeleting}
        title={`¿Borrar a ${users.deleting?.name}?`}
        description="Perderá el acceso al panel. Sus cambios anteriores siguen en el historial."
        confirmLabel="Borrar"
        destructive
        onConfirm={users.remove}
        onCancel={users.cancelDelete}
      />
    </>
  );
}
