// Apariencia del panel: nombre, logo, colores, redondeo y textos del login. Los cambios se ven en vivo en todo el
// panel; si se sale sin guardar, se vuelve a lo guardado.
import * as React from 'react';
import { Alert } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../components/ui/toast';
import { DEFAULT_APPEARANCE, LOGO_MAX, RADIUS_OPTIONS, type Appearance } from '../schema';
import { PageHeader } from './AdminShell';
import { api, ApiError } from './api';
import { Icon } from './icons';
import { useAppearance } from './nav';

/** Reduce la imagen a 256 px como máximo y la convierte en data URL (PNG para conservar transparencia). */
async function logoDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 256 / Math.max(bitmap.width, bitmap.height));
  const canvas = Object.assign(document.createElement('canvas'), {
    width: Math.round(bitmap.width * scale),
    height: Math.round(bitmap.height * scale),
  });
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const png = canvas.toDataURL('image/png');
  return png.length <= LOGO_MAX ? png : canvas.toDataURL('image/webp', 0.85);
}

function ColorField({
  label,
  value,
  onChange,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  help?: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
          className="h-9 w-12 cursor-pointer rounded-md border border-border bg-background p-1"
        />
        <div className="flex-1">
          <Input value={value} onChange={(e) => onChange(e.target.value)} aria-label={`${label} (hex)`} />
        </div>
      </div>
      {help && <p className="mt-1 text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

/** Muestra de componentes con el tema actual, en claro y en oscuro. */
function Preview({ dark }: { dark: boolean }) {
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

export function AppearanceView() {
  const { toast } = useToast();
  const { appearance: saved, setAppearance } = useAppearance();
  const [draft, setDraft] = React.useState<Appearance>(saved);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const savedRef = React.useRef(saved);
  const fileInput = React.useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);

  // Vista previa en vivo, y al salir sin guardar se vuelve a lo guardado.
  React.useEffect(() => {
    savedRef.current = saved;
  }, [saved]);
  React.useEffect(() => () => setAppearance(savedRef.current), [setAppearance]);

  function update(patch: Partial<Appearance>) {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (/^#[0-9a-f]{6}$/i.test(next.primary) && (!next.primary_dark || /^#[0-9a-f]{6}$/i.test(next.primary_dark))) {
      setAppearance(next);
    }
  }

  async function pickLogo(file: File | undefined) {
    if (!file) return;
    try {
      const logo = await logoDataUrl(file);
      if (logo.length > LOGO_MAX) return toast({ variant: 'error', title: 'El logo es demasiado grande incluso reducido.' });
      update({ logo });
    } catch {
      toast({ variant: 'error', title: 'No se pudo leer la imagen.' });
    }
  }

  async function save() {
    setSaving(true);
    setErrors([]);
    try {
      const r = await api<{ appearance: Appearance }>('/settings/appearance', { method: 'PUT', body: draft });
      savedRef.current = r.appearance;
      setAppearance(r.appearance);
      setDraft(r.appearance);
      toast({ variant: 'success', title: 'Apariencia guardada' });
    } catch (e) {
      if (e instanceof ApiError && e.errors.length) setErrors(e.errors);
      else toast({ variant: 'error', title: e instanceof Error ? e.message : 'No se pudo guardar.' });
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setDraft(saved);
    setAppearance(saved);
  }

  return (
    <>
      <PageHeader
        title="Apariencia"
        icon="palette"
        description="Nombre, logo y colores del panel y del login. Los cambios se ven al momento; guarda para que los vea todo el equipo."
        actions={
          <>
            <Button variant="outline" onClick={discard} disabled={!dirty}>
              Descartar
            </Button>
            <Button onClick={save} disabled={saving || !dirty}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      />

      {errors.length > 0 && (
        <Alert variant="error" title="Revisa la apariencia" className="mb-4">
          <ul className="list-disc space-y-0.5 pl-4">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
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
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      pickLogo(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                    aria-label="Logo"
                  />
                  <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                    <Icon name="upload" /> Cambiar logo
                  </Button>
                  {draft.logo && (
                    <Button variant="ghost" size="sm" onClick={() => update({ logo: '' })}>
                      Usar el de la web
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Nombre" value={draft.name} maxLength={40} onChange={(e) => update({ name: e.target.value })} />
                <Input
                  label="Subtítulo"
                  value={draft.subtitle}
                  maxLength={40}
                  onChange={(e) => update({ subtitle: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Colores y forma</CardTitle>
              <CardDescription>
                El color principal se usa en botones, enlaces y el elemento activo del menú. El color del texto encima se
                elige solo para que se lea bien.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <ColorField label="Color principal" value={draft.primary} onChange={(primary) => update({ primary })} />
                <div className="space-y-2">
                  {draft.primary_dark ? (
                    <ColorField
                      label="Color en modo oscuro"
                      value={draft.primary_dark}
                      onChange={(primary_dark) => update({ primary_dark })}
                    />
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
                <Select
                  label="Esquinas"
                  options={RADIUS_OPTIONS}
                  value={String(draft.radius)}
                  onValueChange={(v) => update({ radius: Number(v) })}
                />
                <Select
                  label="Tema por defecto"
                  options={[
                    { value: 'auto', label: 'El del sistema de cada persona' },
                    { value: 'light', label: 'Claro' },
                    { value: 'dark', label: 'Oscuro' },
                  ]}
                  value={draft.theme}
                  onValueChange={(v) => update({ theme: v as Appearance['theme'] })}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                El tema por defecto se aplica a quien no haya elegido uno con el botón de sol/luna.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Login</CardTitle>
              <CardDescription>Textos sobre la foto de la pantalla de entrada (en escritorio).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Título"
                value={draft.login_title}
                maxLength={60}
                onChange={(e) => update({ login_title: e.target.value })}
              />
              <Textarea
                label="Frase"
                rows={2}
                value={draft.login_text}
                maxLength={200}
                onChange={(e) => update({ login_text: e.target.value })}
              />
            </CardContent>
          </Card>

          <Button variant="ghost" onClick={() => update({ ...DEFAULT_APPEARANCE })}>
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
