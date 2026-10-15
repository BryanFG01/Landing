// Usuarios del panel y sus permisos. Administrador: todo el panel. Usuario: solo los módulos asignados, para ver o
// para editar. La lógica está en hooks/useUsers.ts y lib/users.ts.
import * as React from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { DataTable, type ColumnDef } from '../../components/ui/data-table';
import type { AdminUser } from '../schema';
import { ConfirmDialog } from './ConfirmDialog';
import { useUsers } from './hooks/useUsers';
import { Icon } from './icons';
import { formatDateTime } from './lib/format';
import { accessSummary, type UserRow } from './lib/users';
import { PageHeader } from './PageHeader';
import { StatusBadge } from './StatusBadge';
import { UserFormModal } from './users/UserFormModal';

interface ColumnActions {
  me: AdminUser;
  moduleNames: Map<number, string>;
  onEdit: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
}

/** Columnas de la tabla de usuarios (presentación). */
function columnsFor({ me, moduleNames, onEdit, onDelete }: ColumnActions): ColumnDef<UserRow>[] {
  return [
    {
      key: 'name',
      label: 'Nombre',
      render: (v, r) => (
        <span className="font-medium">
          {String(v)} {r.id === me.id && <span className="text-xs text-muted-foreground">(tú)</span>}
        </span>
      ),
    },
    { key: 'email', label: 'Correo' },
    {
      key: 'role',
      label: 'Acceso',
      render: (v, r) =>
        v === 'admin' ? (
          <Badge size="sm">Administrador</Badge>
        ) : (
          <span className="text-sm text-muted-foreground" title={r.permissions.map((p) => moduleNames.get(p.module_id)).join(', ')}>
            {accessSummary(r.permissions)}
          </span>
        ),
    },
    { key: 'is_active', label: 'Estado', render: (v) => <StatusBadge active={v === true} off="Desactivado" /> },
    {
      key: 'last_login_at',
      label: 'Último acceso',
      render: (v) => (v ? formatDateTime(String(v)) : <span className="text-muted-foreground">Nunca</span>),
    },
    {
      key: 'id',
      label: '',
      render: (_, r) => (
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => onEdit(r)}>
            <Icon name="pencil" />
          </Button>
          {r.id !== me.id && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Borrar"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(r)}
            >
              <Icon name="trash" />
            </Button>
          )}
        </div>
      ),
    },
  ];
}

export function UsersView({ me }: Readonly<{ me: AdminUser }>) {
  const users = useUsers(me);
  const { moduleNames, open, askDelete } = users;
  const columns = React.useMemo(
    () => columnsFor({ me, moduleNames, onEdit: open, onDelete: askDelete }),
    [me, moduleNames, open, askDelete],
  );

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
        open={users.editing !== null}
        isNew={users.editing === 'new'}
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
        open={users.deleting !== null}
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
