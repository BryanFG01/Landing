// Tipos de UsersView.tsx y de las celdas de su tabla (UserNameCell, UserAccessCell, LastLoginCell, UserActionsCell).
import type { AdminUser } from '@/features/admin/core/domain/schema';
import type { UserRow } from './lib/users';

export interface ColumnActions {
  me: AdminUser;
  moduleNames: Map<number, string>;
  onEdit: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
}

export interface UsersViewProps {
  me: AdminUser;
}

export interface UserNameCellProps {
  name: string;
  isMe: boolean;
}

export interface UserAccessCellProps {
  user: UserRow;
  moduleNames: Map<number, string>;
}

export interface LastLoginCellProps {
  value: unknown;
}

export interface UserActionsCellProps {
  user: UserRow;
  isMe: boolean;
  onEdit: (u: UserRow) => void;
  onDelete: (u: UserRow) => void;
}
