// Formulario genérico del editor de Sitio web: pinta cualquier sección a partir de su lista de campos (FieldDef de
// src/data/sitio.ts). Añadir un campo a un bloque no exige tocar este archivo.
import * as React from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import { emptyItem, type FieldDef, type Img } from '../../../data/sitio';
import { ColorField } from '../ColorField';
import { FilePicker } from '../FilePicker';
import { useSiteImageUpload } from '../hooks/useSiteImageUpload';
import { Icon } from '../icons';
import {
  asImg,
  asItems,
  asLines,
  asText,
  DEFAULT_VIDEO,
  fontOptions,
  imageOrigin,
  itemTitle,
  previewSrc,
} from '../lib/siteEditor';
import { optionsOf, removeAt, replaceAt, swap } from '../lib/lists';

type Values = Record<string, unknown>;
type ListDef = Extract<FieldDef, { type: 'list' }>;
type GroupDef = Extract<FieldDef, { type: 'group' }>;

function ImageField({ label, value, onChange, help }: Readonly<{ label: string; value: Img; onChange: (v: Img) => void; help?: string }>) {
  const upload = useSiteImageUpload((src) => onChange({ ...value, src }));
  const preview = previewSrc(value);
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
        <div className="min-w-0 flex-1 text-xs text-muted-foreground">{imageOrigin(value)}</div>
        <FilePicker accept="image/png,image/jpeg,image/webp" label={label} disabled={upload.uploading} onPick={upload.upload}>
          {upload.uploading ? 'Subiendo…' : 'Cambiar'}
        </FilePicker>
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

function VideoField({ label, help, value, onChange }: Readonly<{ label: string; help?: string; value: string; onChange: (v: string) => void }>) {
  return (
    <div className="space-y-2">
      <Input label={label} helperText={help} value={value} onChange={(e) => onChange(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange(DEFAULT_VIDEO)}>
          Usar el video de los pollos
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange('')}>
          Sin video (solo imagen)
        </Button>
      </div>
    </div>
  );
}

function ListField({ def, value, onChange }: Readonly<{ def: ListDef; value: Values[]; onChange: (v: Values[]) => void }>) {
  // Elemento desplegado (solo visual).
  const [open, setOpen] = React.useState<number | null>(null);
  const canRemove = !def.min || value.length > def.min;
  const canAdd = !def.max || value.length < def.max;

  function move(i: number, delta: number) {
    onChange(swap(value, i, delta));
    if (open === i) setOpen(i + delta);
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {def.label} <span className="text-muted-foreground">({value.length})</span>
      </p>
      {def.help && <p className="text-xs text-muted-foreground">{def.help}</p>}
      <div className="divide-y divide-border rounded-lg border border-border">
        {value.map((item, i) => (
          // Los elementos no tienen id propio: se identifican por su posición.
          // eslint-disable-next-line react/no-array-index-key
          <div key={i}>
            <div className="flex items-center gap-1 px-3 py-2">
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="min-w-0 flex-1 truncate text-left text-sm hover:text-primary"
              >
                <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}.</span>
                {itemTitle(def.fields, item, def.itemLabel, i)}
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
                disabled={!canRemove}
                className="text-destructive hover:text-destructive"
                onClick={() => {
                  onChange(removeAt(value, i));
                  setOpen(null);
                }}
              >
                <Icon name="trash" />
              </Button>
            </div>
            {open === i && (
              <div className="space-y-4 border-t border-border bg-muted/30 p-3">
                <Fields fields={def.fields} value={item} onChange={(v) => onChange(replaceAt(value, i, v))} />
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
        disabled={!canAdd}
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

function FieldInput({ def, value, onChange }: Readonly<{ def: FieldDef; value: unknown; onChange: (v: unknown) => void }>) {
  switch (def.type) {
    case 'text':
      return <Input label={def.label} helperText={def.help} maxLength={def.max} value={asText(value)} onChange={(e) => onChange(e.target.value)} />;
    case 'textarea':
      return (
        <Textarea label={def.label} helperText={def.help} maxLength={def.max} rows={3} value={asText(value)} onChange={(e) => onChange(e.target.value)} />
      );
    case 'lines':
      return (
        <Textarea label={def.label} helperText={def.help} rows={5} value={asLines(value)} onChange={(e) => onChange(e.target.value.split('\n'))} />
      );
    case 'color':
      return <ColorField label={def.label} help={def.help} optional={def.optional} value={asText(value)} onChange={onChange} />;
    case 'group':
      // Los grupos se pintan en Fields: sus campos van en el mismo objeto.
      return null;
    case 'font':
      return <Select label={def.label} options={fontOptions(def.uso)} value={asText(value)} onValueChange={onChange} />;
    case 'select':
      return <Select label={def.label} options={optionsOf(def.options)} value={asText(value)} onValueChange={onChange} />;
    case 'video':
      return <VideoField label={def.label} help={def.help} value={asText(value)} onChange={onChange} />;
    case 'image':
      return <ImageField label={def.label} help={def.help} value={asImg(value)} onChange={onChange} />;
    case 'list':
      return <ListField def={def} value={asItems(value)} onChange={onChange} />;
  }
}

function FieldGroup({ def, value, onChange }: Readonly<{ def: GroupDef; value: Values; onChange: (v: Values) => void }>) {
  return (
    <fieldset className="space-y-4 border-t border-border pt-4">
      <legend className="pr-2 text-sm font-semibold">{def.label}</legend>
      {def.help && <p className="-mt-2 text-xs text-muted-foreground">{def.help}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Fields fields={def.fields} value={value} onChange={onChange} />
      </div>
    </fieldset>
  );
}

export function Fields({ fields, value, onChange }: Readonly<{ fields: FieldDef[]; value: Values; onChange: (v: Values) => void }>) {
  return (
    <>
      {fields.map((f) =>
        f.type === 'group' ? (
          <FieldGroup key={f.key} def={f} value={value} onChange={onChange} />
        ) : (
          <FieldInput key={f.key} def={f} value={value[f.key]} onChange={(v) => onChange({ ...value, [f.key]: v })} />
        ),
      )}
    </>
  );
}
