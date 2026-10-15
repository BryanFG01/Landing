// Sitio web: editar la landing por bloques sin tocar código. Todo el formulario sale de BLOCK_DEFS y SETTINGS_DEFS
// (src/data/sitio.ts). Se guarda como borrador; "Vista previa" lo enseña y "Publicar" lo lleva a la web.
import * as React from 'react';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Modal } from '../../components/ui/modal';
import { Select } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { useToast } from '../../components/ui/toast';
import { cn } from '../../components/lib/utils';
import {
  BLOCK_DEFS,
  contrast,
  emptyItem,
  FONTS,
  SETTINGS_DEFS,
  type Bloque,
  type FieldDef,
  type Img,
  type SiteContent,
} from '../../data/sitio';
import { PageHeader } from './AdminShell';
import { api, ApiError } from './api';
import { Icon } from './icons';

type State = {
  content: SiteContent;
  unpublished: boolean;
  draft_updated_at: string | null;
  published_at: string | null;
  versions: { id: number; published_at: string; published_by: string | null }[];
  deploy_hook: boolean;
};

const fmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

// Miniaturas de las imágenes que vienen con el proyecto (en la web salen optimizadas por Astro).
const ASSET_PREVIEW: Record<string, string> = {
  'asset:logo': '/icon-192.png',
  'asset:amanecer': '/photos/0-amanecer.jpg',
  'asset:gallinas': '/photos/1-gallinas.jpg',
  'asset:nidos': '/photos/2-nidos.jpg',
  'asset:recogida': '/photos/3-recogida.jpg',
  'asset:seleccion': '/photos/5-seleccion.jpg',
  'asset:entrega': '/photos/6-entrega.jpg',
};

/** Reduce una foto a 1920 px como máximo y la pasa a WebP antes de subirla (las del celular pesan varios MB). */
async function shrink(file: File): Promise<File> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
  const canvas = Object.assign(document.createElement('canvas'), {
    width: Math.round(bitmap.width * scale),
    height: Math.round(bitmap.height * scale),
  });
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  // PNG con transparencia (logos) se queda en PNG; lo demás, WebP.
  const type = file.type === 'image/png' && scale === 1 ? 'image/png' : 'image/webp';
  const blob = await new Promise<Blob>((ok, ko) => canvas.toBlob((b) => (b ? ok(b) : ko(new Error())), type, 0.82));
  return new File([blob], file.name.replace(/\.\w+$/, type === 'image/png' ? '.png' : '.webp'), { type });
}

async function uploadPublic(file: File) {
  const form = new FormData();
  form.append('file', await shrink(file));
  const res = await fetch('/api/admin/files?publico=1', { method: 'POST', body: form, credentials: 'same-origin' });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new ApiError(res.status, body);
  return `/media/${(body.file as { id: string }).id}`;
}

// ─── Campos ──────────────────────────────────────────────────────────────────

function ImageField({ label, value, onChange, help }: { label: string; value: Img; onChange: (v: Img) => void; help?: string }) {
  const { toast } = useToast();
  const input = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const preview = value.src.startsWith('asset:') ? ASSET_PREVIEW[value.src] : value.src;

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      onChange({ ...value, src: await uploadPublic(file) });
    } catch (e) {
      toast({ variant: 'error', title: e instanceof Error ? e.message : 'No se pudo subir la imagen.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-border p-3">
        {preview ? (
          <img src={preview} alt="" className="size-16 shrink-0 rounded-md bg-muted object-cover" />
        ) : (
          <span className="grid size-16 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <Icon name="image" className="size-6" />
          </span>
        )}
        <div className="min-w-0 flex-1 text-xs text-muted-foreground">
          {value.src.startsWith('asset:') ? 'Imagen original de la web' : value.src ? 'Imagen subida desde el panel' : 'Sin imagen'}
        </div>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          aria-label={label}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => input.current?.click()}>
          <Icon name="upload" /> {busy ? 'Subiendo…' : 'Cambiar'}
        </Button>
        {value.src && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ ...value, src: '' })}>
            Quitar
          </Button>
        )}
      </div>
      <Input
        label="Texto alternativo"
        helperText="Describe la imagen (lo leen Google y los lectores de pantalla)."
        value={value.alt}
        onChange={(e) => onChange({ ...value, alt: e.target.value })}
      />
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

function ListField({
  def,
  value,
  onChange,
}: {
  def: Extract<FieldDef, { type: 'list' }>;
  value: Record<string, unknown>[];
  onChange: (v: Record<string, unknown>[]) => void;
}) {
  const [open, setOpen] = React.useState<number | null>(null);
  const titleOf = (item: Record<string, unknown>, i: number) => {
    const first = def.fields.find((f) => f.type === 'text' || f.type === 'textarea');
    const text = first ? String(item[first.key] ?? '') : '';
    return text ? text.slice(0, 70) : `${def.itemLabel} ${i + 1}`;
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(open === i ? j : open);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          {def.label} <span className="text-muted-foreground">({value.length})</span>
        </p>
      </div>
      {def.help && <p className="text-xs text-muted-foreground">{def.help}</p>}
      <div className="divide-y divide-border rounded-lg border border-border">
        {value.map((item, i) => (
          <div key={i}>
            <div className="flex items-center gap-1 px-3 py-2">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="min-w-0 flex-1 truncate text-left text-sm hover:text-primary"
              >
                <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}.</span>
                {titleOf(item, i)}
              </button>
              <Button type="button" variant="ghost" size="icon" aria-label="Subir" onClick={() => move(i, -1)}>
                <Icon name="arrow-up" />
              </Button>
              <Button type="button" variant="ghost" size="icon" aria-label="Bajar" onClick={() => move(i, 1)}>
                <Icon name="arrow-down" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Quitar"
                disabled={!!def.min && value.length <= def.min}
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onChange(value.filter((_, j) => j !== i));
                  setOpen(null);
                }}
              >
                <Icon name="trash" />
              </Button>
            </div>
            {open === i && (
              <div className="space-y-4 border-t border-border bg-muted/30 p-3">
                <Fields fields={def.fields} value={item} onChange={(v) => onChange(value.map((x, j) => (j === i ? v : x)))} />
              </div>
            )}
          </div>
        ))}
        {!value.length && <p className="p-3 text-sm text-muted-foreground">Vacío.</p>}
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={!!def.max && value.length >= def.max}
        onClick={() => {
          onChange([...value, emptyItem(def.fields)]);
          setOpen(value.length);
        }}
      >
        <Icon name="plus" /> Añadir {def.itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}

function Fields({
  fields,
  value,
  onChange,
}: {
  fields: FieldDef[];
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  const set = (key: string, v: unknown) => onChange({ ...value, [key]: v });
  return (
    <>
      {fields.map((f) => {
        const v = value[f.key];
        switch (f.type) {
          case 'text':
            return (
              <Input key={f.key} label={f.label} helperText={f.help} maxLength={f.max} value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} />
            );
          case 'textarea':
            return (
              <Textarea
                key={f.key}
                label={f.label}
                helperText={f.help}
                maxLength={f.max}
                rows={3}
                value={String(v ?? '')}
                onChange={(e) => set(f.key, e.target.value)}
              />
            );
          case 'lines':
            return (
              <Textarea
                key={f.key}
                label={f.label}
                helperText={f.help}
                rows={5}
                value={(Array.isArray(v) ? v : []).join('\n')}
                onChange={(e) => set(f.key, e.target.value.split('\n'))}
              />
            );
          case 'color':
            return (
              <div key={f.key}>
                <p className="mb-1.5 text-sm font-medium">{f.label}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={String(v)}
                    onChange={(e) => set(f.key, e.target.value)}
                    aria-label={f.label}
                    className="h-9 w-12 cursor-pointer rounded-md border border-border bg-background p-1"
                  />
                  <div className="flex-1">
                    <Input value={String(v ?? '')} aria-label={`${f.label} (hex)`} onChange={(e) => set(f.key, e.target.value)} />
                  </div>
                </div>
              </div>
            );
          case 'font':
            return (
              <Select
                key={f.key}
                label={f.label}
                options={Object.entries(FONTS)
                  .filter(([, font]) => font.uso === 'ambos' || font.uso === f.uso)
                  .map(([k, font]) => ({ value: k, label: font.label }))}
                value={String(v)}
                onValueChange={(nv) => set(f.key, nv)}
              />
            );
          case 'select':
            return (
              <Select
                key={f.key}
                label={f.label}
                options={Object.entries(f.options).map(([value, label]) => ({ value, label }))}
                value={String(v)}
                onValueChange={(nv) => set(f.key, nv)}
              />
            );
          case 'video':
            return (
              <div key={f.key} className="space-y-2">
                <Input label={f.label} helperText={f.help} value={String(v ?? '')} onChange={(e) => set(f.key, e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="ghost" onClick={() => set(f.key, '/video/pollos.mp4')}>
                    Usar el video de los pollos
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => set(f.key, '')}>
                    Sin video (solo imagen)
                  </Button>
                </div>
              </div>
            );
          case 'image':
            return (
              <ImageField
                key={f.key}
                label={f.label}
                help={f.help}
                value={(v as Img) ?? { src: '', alt: '' }}
                onChange={(nv) => set(f.key, nv)}
              />
            );
          case 'list':
            return (
              <ListField
                key={f.key}
                def={f}
                value={Array.isArray(v) ? (v as Record<string, unknown>[]) : []}
                onChange={(nv) => set(f.key, nv)}
              />
            );
        }
      })}
    </>
  );
}

// ─── Editor ──────────────────────────────────────────────────────────────────

type Section = { kind: 'setting'; key: (typeof SETTINGS_DEFS)[number]['key'] } | { kind: 'block'; tipo: Bloque['tipo'] };

export function SiteEditor() {
  const { toast } = useToast();
  const [state, setState] = React.useState<State | null>(null);
  const [content, setContent] = React.useState<SiteContent | null>(null);
  const [saved, setSaved] = React.useState('');
  const [section, setSection] = React.useState<Section>({ kind: 'block', tipo: 'paseo' });
  const [busy, setBusy] = React.useState<'' | 'save' | 'preview' | 'publish'>('');
  const [errors, setErrors] = React.useState<string[]>([]);
  const [confirmPublish, setConfirmPublish] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const s = await api<State>('/site');
      setState(s);
      setContent(s.content);
      setSaved(JSON.stringify(s.content));
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'No se pudo cargar.');
    }
  }, []);
  React.useEffect(() => {
    load();
  }, [load]);

  const dirty = !!content && JSON.stringify(content) !== saved;

  // Aviso al cerrar la pestaña con cambios sin guardar.
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (loadError) return <Alert variant="error" title="No se pudo cargar">{loadError}</Alert>;
  if (!content || !state) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  async function save(): Promise<boolean> {
    if (!content) return false;
    setErrors([]);
    try {
      const r = await api<{ content: SiteContent }>('/site', { method: 'PUT', body: content });
      setContent(r.content);
      setSaved(JSON.stringify(r.content));
      setState((s) => (s ? { ...s, unpublished: true } : s));
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.errors.length) setErrors(e.errors);
      else toast({ variant: 'error', title: e instanceof Error ? e.message : 'No se pudo guardar.' });
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
  }

  async function run(kind: 'save' | 'preview' | 'publish') {
    setBusy(kind);
    // La vista previa se abre ya (antes de esperar a la red) para que el navegador no la bloquee como ventana emergente.
    const win = kind === 'preview' ? window.open('about:blank', '_blank') : null;
    try {
      const ok = dirty || kind === 'save' ? await save() : true;
      if (!ok) {
        win?.close();
        return;
      }
      if (kind === 'save') toast({ variant: 'success', title: 'Borrador guardado' });
      if (kind === 'preview') {
        if (win) win.location.href = '/admin/vista-previa';
        else window.open('/admin/vista-previa', '_blank');
      }
      if (kind === 'publish') {
        const r = await api<{ deploy: 'ok' | 'sin_hook' | 'error' }>('/site/publish', { method: 'POST' });
        setConfirmPublish(false);
        toast(
          r.deploy === 'ok'
            ? { variant: 'success', title: 'Publicado. La web se actualiza en 1 o 2 minutos.' }
            : r.deploy === 'sin_hook'
              ? { variant: 'warning', title: 'Publicado. Se verá en el próximo despliegue (falta el Deploy Hook de Vercel).' }
              : { variant: 'error', title: 'Publicado, pero Vercel no respondió. Vuelve a publicar en un momento.' },
        );
        await load();
      }
    } finally {
      setBusy('');
    }
  }

  async function restore(id: number) {
    try {
      await api('/site/restore', { method: 'POST', body: { version_id: id } });
      await load();
      toast({ variant: 'success', title: 'Versión cargada en el borrador. Revísala y publica.' });
    } catch (e) {
      toast({ variant: 'error', title: e instanceof Error ? e.message : 'No se pudo recuperar.' });
    }
  }

  const blocks = content.bloques;
  const moveBlock = (i: number, d: number) => {
    const j = i + d;
    // La portada no se mueve: es el titular de la página.
    if (j < 1 || j >= blocks.length || i === 0) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setContent({ ...content, bloques: next });
  };
  const toggleBlock = (i: number) =>
    setContent({ ...content, bloques: blocks.map((b, j) => (j === i ? { ...b, visible: !b.visible } : b)) as Bloque[] });

  // Sección seleccionada.
  let title = '';
  let description = '';
  let fields: FieldDef[] = [];
  let value: Record<string, unknown> = {};
  let onChange: (v: Record<string, unknown>) => void = () => {};
  if (section.kind === 'setting') {
    const def = SETTINGS_DEFS.find((s) => s.key === section.key)!;
    title = def.nombre;
    description = def.descripcion;
    fields = def.fields;
    value = content[section.key] as unknown as Record<string, unknown>;
    onChange = (v) => setContent({ ...content, [section.key]: v });
  } else {
    const def = BLOCK_DEFS[section.tipo];
    const i = blocks.findIndex((b) => b.tipo === section.tipo);
    title = def.nombre;
    description = def.descripcion;
    fields = def.fields;
    value = blocks[i] as unknown as Record<string, unknown>;
    onChange = (v) => setContent({ ...content, bloques: blocks.map((b, j) => (j === i ? { ...b, ...v } : b)) as Bloque[] });
  }

  const t = content.tema;
  const warnings = [
    contrast(t.texto, t.fondo) < 4.5 && 'El texto y el fondo tienen poco contraste: costará leer.',
    contrast(t.acento, t.fondo) < 3 && 'El acento casi no se distingue del fondo.',
    contrast(t.fondo, t.acento) < 4.5 && 'El texto de los botones (color de fondo sobre acento) tiene poco contraste.',
  ].filter(Boolean) as string[];

  const navItem = (active: boolean) =>
    cn(
      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
      active ? 'bg-primary/10 font-medium text-primary' : 'hover:bg-muted',
    );

  return (
    <>
      <PageHeader
        title="Sitio web"
        icon="storefront"
        description="Textos, imágenes, colores, tipografía y orden de los bloques de la página. Los cambios se guardan como borrador hasta que publiques."
        badge={dirty ? 'Cambios sin guardar' : state.unpublished ? 'Borrador sin publicar' : 'Publicado'}
        actions={
          <>
            <Button variant="outline" onClick={() => run('save')} disabled={!!busy || !dirty}>
              {busy === 'save' ? 'Guardando…' : 'Guardar borrador'}
            </Button>
            <Button variant="outline" onClick={() => run('preview')} disabled={!!busy}>
              <Icon name="eye" /> Vista previa
            </Button>
            <Button onClick={() => setConfirmPublish(true)} disabled={!!busy || (!dirty && !state.unpublished)}>
              Publicar
            </Button>
          </>
        }
      />

      {!state.deploy_hook && (
        <Alert variant="warning" title="Falta conectar la publicación con Vercel" className="mb-4">
          Publicar guarda los cambios, pero la web no se reconstruye sola. En Vercel: Settings → Git → Deploy Hooks, crea
          uno para la rama de producción y guarda su URL como variable <code className="font-mono">VERCEL_DEPLOY_HOOK</code>.
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert variant="error" title="Revisa el contenido" className="mb-4">
          <ul className="list-disc space-y-0.5 pl-4">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <Card className="p-3">
            <p className="px-2 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">General</p>
            {SETTINGS_DEFS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSection({ kind: 'setting', key: s.key })}
                className={navItem(section.kind === 'setting' && section.key === s.key)}
              >
                <Icon name={s.key === 'tema' ? 'palette' : s.key === 'marca' ? 'star' : s.key === 'contacto' ? 'chat' : 'file'} />
                {s.nombre}
              </button>
            ))}
          </Card>

          <Card className="p-3">
            <p className="px-2 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Bloques, en orden</p>
            {blocks.map((b, i) => (
              <div key={b.tipo} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setSection({ kind: 'block', tipo: b.tipo })}
                  className={cn(navItem(section.kind === 'block' && section.tipo === b.tipo), 'min-w-0 flex-1', !b.visible && 'opacity-50')}
                >
                  <span className="text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                  <span className="truncate">{BLOCK_DEFS[b.tipo].nombre}</span>
                </button>
                {i > 0 && (
                  <>
                    <Button variant="ghost" size="icon" className="size-7" aria-label="Subir bloque" disabled={i <= 1} onClick={() => moveBlock(i, -1)}>
                      <Icon name="arrow-up" className="size-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-7" aria-label="Bajar bloque" disabled={i >= blocks.length - 1} onClick={() => moveBlock(i, 1)}>
                      <Icon name="arrow-down" className="size-3.5" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7"
                  aria-label={b.visible ? 'Ocultar bloque' : 'Mostrar bloque'}
                  title={b.visible ? 'Visible: clic para ocultar' : 'Oculto: clic para mostrar'}
                  disabled={i === 0}
                  onClick={() => toggleBlock(i)}
                >
                  <Icon name={b.visible ? 'eye' : 'eye-slash'} className="size-3.5" />
                </Button>
              </div>
            ))}
            <p className="px-2 pt-2 text-xs text-muted-foreground">La portada va siempre primero.</p>
          </Card>

          <Card className="p-3">
            <p className="px-2 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Publicaciones</p>
            {state.versions.length ? (
              <ul className="space-y-1">
                {state.versions.map((v) => (
                  <li key={v.id} className="flex items-center justify-between gap-2 px-2 py-1 text-xs">
                    <span className="min-w-0">
                      <span className="block">{fmt.format(new Date(v.published_at))}</span>
                      <span className="block truncate text-muted-foreground">{v.published_by ?? '—'}</span>
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => restore(v.id)}>
                      Recuperar
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-2 text-xs text-muted-foreground">Aún no se ha publicado desde el panel.</p>
            )}
          </Card>
        </aside>

        <Card className="min-w-0 space-y-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-xl">{title}</h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {section.kind === 'block' && (
              <Switch
                label="Visible"
                checked={blocks.find((b) => b.tipo === section.tipo)!.visible}
                disabled={section.tipo === 'paseo'}
                onCheckedChange={() => toggleBlock(blocks.findIndex((b) => b.tipo === section.tipo))}
              />
            )}
          </div>

          {section.kind === 'setting' && section.key === 'tema' && (
            <>
              <div
                className="flex flex-wrap items-center gap-4 rounded-lg p-5"
                style={{ background: t.fondo, color: t.texto }}
                aria-label="Muestra de colores"
              >
                <span style={{ fontFamily: `var(${FONTS[t.titulos].css}), ${FONTS[t.titulos].fallback}` }} className="text-2xl">
                  {content.marca.nombre}
                </span>
                <span style={{ fontFamily: `var(${FONTS[t.cuerpo].css}), ${FONTS[t.cuerpo].fallback}` }} className="text-sm opacity-80">
                  Texto de ejemplo para leer
                </span>
                <span className="rounded-full px-4 py-2 text-sm font-medium" style={{ background: t.acento, color: t.fondo }}>
                  Pedir por WhatsApp
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                La muestra usa las tipografías si tu navegador ya las tiene; la vista previa las muestra siempre.
              </p>
              {warnings.map((w) => (
                <Alert key={w} variant="warning">
                  {w}
                </Alert>
              ))}
            </>
          )}

          <Fields key={section.kind === 'block' ? section.tipo : section.key} fields={fields} value={value} onChange={onChange} />
        </Card>
      </div>

      <Modal
        open={confirmPublish}
        onOpenChange={setConfirmPublish}
        title="¿Publicar los cambios en la web?"
        description={
          state.deploy_hook
            ? 'La página se reconstruye con el contenido actual. Tarda 1 o 2 minutos. Podrás volver a una versión anterior desde Publicaciones.'
            : 'Se guarda como publicado, pero sin Deploy Hook la web no cambia hasta el próximo despliegue.'
        }
        maxWidth="sm"
      >
        <Modal.Footer>
          <Button variant="outline" onClick={() => setConfirmPublish(false)}>
            Cancelar
          </Button>
          <Button onClick={() => run('publish')} disabled={busy === 'publish'}>
            {busy === 'publish' ? 'Publicando…' : 'Publicar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
