// Apariencia del panel: nombre, logo, colores, redondeo y foto y textos del login. Los cambios se ven en vivo en todo el
// panel. La lógica está en hooks/useAppearanceEditor.ts.
import * as React from 'react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { RADIUS_OPTIONS, type Appearance } from '../schema';
import { ColorField } from './ColorField';
import { ErrorList } from './ErrorList';
import { FilePicker } from './FilePicker';
import { useAppearanceEditor } from './hooks/useAppearanceEditor';
import { PageHeader } from './PageHeader';

const COLOR_SOURCE_OPTIONS = [
  { value: 'web', label: 'Los de la plantilla de la web' },
  { value: 'propios', label: 'Propios del panel' },
];

const THEME_OPTIONS = [
  { value: 'auto', label: 'El del sistema de cada persona' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Oscuro' },
];

type Update = (patch: Partial<Appearance>) => void;

/** Muestra de componentes con el tema actual, en claro y en oscuro. */
function Preview({ dark }: Readonly<{ dark: boolean }>) {
  return (
    <div className={dark ? 'dark' : 'light'}>
      <div className="space-y-3 rounded-lg border border-border bg-background p-4 text-foreground">
        <p className="text-xs font-medium text-muted-foreground">{dark ? 'Modo oscuro' : 'Modo claro'}</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Guardar</Button>
          <Button size="sm" variant="outline">
            Cancelar
          </Button>
          <Badge>Activo</Badge>
        </div>
        <p className="text-sm">
          Texto con un <span className="text-primary underline underline-offset-4">enlace</span>.
        </p>
      </div>
    </div>
  );
}

function BrandCard({ draft, update, onLogo }: Readonly<{ draft: Appearance; update: Update; onLogo: (f: File) => void }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Marca</CardTitle>
        <CardDescription>Se muestra en el menú lateral, en la pestaña del navegador y en el login.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <img
            src={draft.logo || '/icon-192.png'}
            alt="Logo actual"
            className="size-16 shrink-0 rounded-full border border-border bg-white object-contain"
          />
          <div className="flex flex-wrap gap-2">
            <FilePicker accept="image/png,image/jpeg,image/webp" label="Logo" onPick={onLogo}>
              Cambiar logo
            </FilePicker>
            {draft.logo && (
              <Button variant="ghost" size="sm" onClick={() => update({ logo: '' })}>
                Usar el de la web
              </Button>
            )}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" value={draft.name} maxLength={40} onChange={(e) => update({ name: e.target.value })} />
          <Input label="Subtítulo" value={draft.subtitle} maxLength={40} onChange={(e) => update({ subtitle: e.target.value })} />
        </div>
      </CardContent>
    </Card>
  );
}

function OwnColors({ draft, update }: Readonly<{ draft: Appearance; update: Update }>) {
  return (
    <>
      <ColorField label="Color principal" value={draft.primary} onChange={(primary) => update({ primary })} />
      <div className="space-y-2">
        {draft.primary_dark ? (
          <ColorField label="Color en modo oscuro" value={draft.primary_dark} onChange={(primary_dark) => update({ primary_dark })} />
        ) : (
          <p className="pt-1 text-sm font-medium">Color en modo oscuro</p>
        )}
        <Switch
          label="Automático"
          description="Una versión más clara del color principal."
          checked={!draft.primary_dark}
          onCheckedChange={(auto) => update({ primary_dark: auto ? '' : draft.primary })}
        />
      </div>
      <Select label="Esquinas" options={RADIUS_OPTIONS} value={String(draft.radius)} onValueChange={(v) => update({ radius: Number(v) })} />
    </>
  );
}

function ColorsCard({ draft, update }: Readonly<{ draft: Appearance; update: Update }>) {
  const fromWeb = draft.colores === 'web';
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Colores y forma</CardTitle>
        <CardDescription>
          {fromWeb
            ? 'El panel usa los colores, esquinas y tipografías de la plantilla publicada en Sitio web. Al publicar otra plantilla, el panel cambia con ella.'
            : 'El color principal se usa en botones, enlaces y el elemento activo del menú. El color del texto encima se elige solo para que se lea bien.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Colores del panel"
            options={COLOR_SOURCE_OPTIONS}
            value={draft.colores}
            onValueChange={(v) => update({ colores: v as Appearance['colores'] })}
          />
          {!fromWeb && <OwnColors draft={draft} update={update} />}
          <Select
            label="Tema por defecto"
            options={THEME_OPTIONS}
            value={draft.theme}
            onValueChange={(v) => update({ theme: v as Appearance['theme'] })}
          />
        </div>
        <p className="text-xs text-muted-foreground">El tema por defecto se aplica a quien no haya elegido uno con el botón de sol/luna.</p>
      </CardContent>
    </Card>
  );
}

interface LoginCardProps {
  draft: Appearance;
  update: Update;
  onImage: (f: File) => void;
  uploadingImage: boolean;
}

function LoginCard({ draft, update, onImage, uploadingImage }: Readonly<LoginCardProps>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Login</CardTitle>
        <CardDescription>Foto y textos de la pantalla de entrada (los textos se ven en escritorio).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          {draft.login_image ? (
            <img
              src={draft.login_image}
              alt="Foto actual del login"
              className="h-16 w-24 shrink-0 rounded-md border border-border object-cover"
            />
          ) : (
            <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-dashed border-border px-2 text-center text-xs text-muted-foreground">
              Foto de siempre
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <FilePicker accept="image/png,image/jpeg,image/webp" label="Foto del login" onPick={onImage} disabled={uploadingImage}>
              {uploadingImage ? 'Subiendo…' : 'Cambiar foto'}
            </FilePicker>
            {draft.login_image && (
              <Button variant="ghost" size="sm" onClick={() => update({ login_image: '' })} disabled={uploadingImage}>
                Usar la de siempre
              </Button>
            )}
          </div>
        </div>
        <Input label="Título" value={draft.login_title} maxLength={60} onChange={(e) => update({ login_title: e.target.value })} />
        <Textarea
          label="Frase"
          rows={2}
          value={draft.login_text}
          maxLength={200}
          onChange={(e) => update({ login_text: e.target.value })}
        />
      </CardContent>
    </Card>
  );
}

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
          <Preview dark={false} />
          <Preview dark />
        </aside>
      </div>
    </>
  );
}
