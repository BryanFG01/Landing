// Columnas de la tabla de usuarios. Es un .ts (con createElement) porque la tabla pide funciones render, y así el
// componente solo pinta; cada celda es su propio componente.
import * as React from 'react';
import type { ColumnDef } from '@/shared/ui/data-table';
import { StatusBadge } from '@/features/admin/core/ui/StatusBadge';
import { LastLoginCell } from '../LastLoginCell';
import type { UserRow } from '../lib/users';
import { UserAccessCell } from '../UserAccessCell';
import { UserActionsCell } from '../UserActionsCell';
import { UserNameCell } from '../UserNameCell';
import type { ColumnActions } from '../UsersView.types';

function columnsFor({ me, moduleNames, onEdit, onDelete }: ColumnActions): ColumnDef<UserRow>[] {
  return [
    {
      key: 'name',
      label: 'Nombre',
      render: (v, r) => React.createElement(UserNameCell, { name: String(v), isMe: r.id === me.id }),
    },
    { key: 'email', label: 'Correo' },
    { key: 'role', label: 'Acceso', render: (_, r) => React.createElement(UserAccessCell, { user: r, moduleNames }) },
    {
      key: 'is_active',
      label: 'Estado',
      render: (v) => React.createElement(StatusBadge, { active: v === true, off: 'Desactivado' }),
    },
    { key: 'last_login_at', label: 'Último acceso', render: (v) => React.createElement(LastLoginCell, { value: v }) },
    {
      key: 'id',
      label: '',
      render: (_, r) => React.createElement(UserActionsCell, { user: r, isMe: r.id === me.id, onEdit, onDelete }),
    },
  ];
}

export function useUserColumns(actions: ColumnActions) {
  const { me, moduleNames, onEdit, onDelete } = actions;
  return React.useMemo(() => columnsFor({ me, moduleNames, onEdit, onDelete }), [me, moduleNames, onEdit, onDelete]);
}
