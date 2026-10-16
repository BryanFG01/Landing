// Tipos de UserFormModal.tsx.
import type { Mod } from '@/features/admin/core/ui/lib/modules';
import type { UserForm } from './lib/users';

export interface UserFormModalProps {
  open: boolean;
  isNew: boolean;
  isSelf: boolean;
  form: UserForm;
  errors: Record<string, string>;
  modules: Mod[];
  saving: boolean;
  onChange: (patch: Partial<UserForm>) => void;
  onSubmit: () => void;
  onClose: () => void;
}
