// Formulario de alta y edición de un usuario: datos, rol y permisos por módulo.
import * as React from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Modal } from '../../../components/ui/modal';
import { Select } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { ROLES, type Role } from '../../schema';
import type { Mod } from '../lib/modules';
import type { UserForm } from '../lib/users';
import { PermissionsEditor } from './PermissionsEditor';

const ROLE_OPTIONS = Object.entries(ROLES).map(([value, label]) => ({ value, label }));

interface UserFormModalProps {
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

export function UserFormModal({
  open,
  isNew,
  isSelf,
  form,
  errors,
  modules,
  saving,
  onChange,
  onSubmit,
  onClose,
}: Readonly<UserFormModalProps>) {
  return (
    <Modal
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={isNew ? 'Nuevo usuario' : 'Editar usuario'}
      maxWidth="lg"
      className="max-h-[90dvh] overflow-y-auto"
    >
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre *" value={form.name} errorMessage={errors.name} onChange={(e) => onChange({ name: e.target.value })} />
          <Input
            label="Correo *"
            type="email"
            value={form.email}
            disabled={!isNew}
            errorMessage={errors.email}
            onChange={(e) => onChange({ email: e.target.value })}
          />
          <Input
            label={isNew ? 'Contraseña *' : 'Nueva contraseña'}
            type="password"
            autoComplete="new-password"
            value={form.password}
            errorMessage={errors.password}
            helperText={isNew ? 'Mínimo 10 caracteres.' : 'Déjala vacía para no cambiarla.'}
            onChange={(e) => onChange({ password: e.target.value })}
          />
          <Select
            label="Rol"
            options={ROLE_OPTIONS}
            value={form.role}
            disabled={isSelf}
            helperText={isSelf ? 'No puedes cambiar tu propio rol.' : undefined}
            onValueChange={(role) => onChange({ role: role as Role })}
          />
        </div>

        {form.role === 'usuario' ? (
          <PermissionsEditor modules={modules} value={form.permissions} onChange={(permissions) => onChange({ permissions })} />
        ) : (
          <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
            Un administrador ve y edita todos los módulos, y además usa el constructor, la consola SQL, la apariencia y esta
            pantalla.
          </p>
        )}

        {!isSelf && !isNew && (
          <Switch
            label="Activo"
            description="Si lo desactivas, se cierra su sesión y no puede entrar."
            checked={form.is_active}
            onCheckedChange={(is_active) => onChange({ is_active })}
          />
        )}
        <Modal.Footer>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
