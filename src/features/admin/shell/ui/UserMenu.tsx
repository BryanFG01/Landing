// Menú de usuario de la cabecera: quién ha entrado, usuarios (solo administradores) y cerrar sesión.
import * as React from 'react';
import {
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownSeparator,
  DropdownTrigger,
} from '@/shared/ui/dropdown';
import { Icon } from '@/features/admin/core/ui/icons';
import type { UserMenuProps } from './AdminShell.types';
import { logout } from './hooks/useSidebar';

export function UserMenu({ user, isAdmin, onUsers }: Readonly<UserMenuProps>) {
  return (
    <DropdownMenu>
      <DropdownTrigger>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-full bg-primary/15 text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Menú de usuario"
        >
          {user.name.trim().charAt(0).toUpperCase()}
        </button>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-56">
        <DropdownLabel>
          <span className="block truncate text-foreground">{user.name}</span>
          <span className="block truncate font-normal">{user.email}</span>
        </DropdownLabel>
        <DropdownSeparator />
        {isAdmin && (
          <DropdownItem icon={<Icon name="user-gear" />} onClick={onUsers}>
            Usuarios y permisos
          </DropdownItem>
        )}
        <DropdownItem icon={<Icon name="sign-out" />} destructive onClick={logout}>
          Cerrar sesión
        </DropdownItem>
      </DropdownContent>
    </DropdownMenu>
  );
}
