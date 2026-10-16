// Apariencia del panel: nombre, logo, colores, redondeo y foto y textos del login. Los cambios se ven en vivo en todo el
// panel. La lógica está en hooks/useAppearanceEditor.ts.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { ErrorList } from '@/features/admin/core/ui/ErrorList';
import { PageHeader } from '@/features/admin/core/ui/PageHeader';
import { AppearancePreview } from './AppearancePreview';
import { BrandCard } from './BrandCard';
import { ColorsCard } from './ColorsCard';
import { useAppearanceEditor } from './hooks/useAppearanceEditor';
import { LoginCard } from './LoginCard';

export function AppearanceView() {
  const editor = useAppearanceEditor();
  const { draft, update } = editor;

  return (
    <>
      <PageHeader
        title="Apariencia"
        icon="palette"
        description="Nombre, logo y colores del panel y del login. Los cambios se ven al momento; guarda para que los vea todo el equipo."
        actions={
          <>
            <Button variant="outline" onClick={editor.discard} disabled={!editor.dirty}>
              Descartar
            </Button>
            <Button onClick={editor.save} disabled={editor.saving || !editor.dirty}>
              {editor.saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      />

      <ErrorList title="Revisa la apariencia" errors={editor.errors} />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <BrandCard draft={draft} update={update} onLogo={editor.pickLogo} />
          <ColorsCard draft={draft} update={update} />
          <LoginCard
            draft={draft}
            update={update}
            onImage={editor.pickLoginImage}
            uploadingImage={editor.uploadingLoginImage}
          />
          <Button variant="ghost" onClick={editor.resetToDefaults}>
            Volver a los valores originales
          </Button>
        </div>

        <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
          <AppearancePreview dark={false} />
          <AppearancePreview dark />
        </aside>
      </div>
    </>
  );
}
