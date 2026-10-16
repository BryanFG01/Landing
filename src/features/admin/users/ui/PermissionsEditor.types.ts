// Tipos de PermissionsEditor.tsx.
import type { Mod } from '@/features/admin/core/ui/lib/modules';
import type { Permission } from './lib/users';

export interface PermissionsEditorProps {
  modules: Mod[];
  value: Permission[];
  onChange: (permissions: Permission[]) => void;
}
