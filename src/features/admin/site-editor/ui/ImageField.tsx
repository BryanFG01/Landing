// Campo de imagen del editor de Sitio web: miniatura, origen, subir/quitar y texto alternativo.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { FilePicker } from '@/features/admin/core/ui/FilePicker';
import { useSiteImageUpload } from '@/features/admin/core/ui/hooks/useSiteImageUpload';
import { Icon } from '@/features/admin/core/ui/icons';
import type { ImageFieldProps } from './Fields.types';
import { imageOrigin, previewSrc } from './lib/siteEditor';

export function ImageField({ label, value, onChange, help }: Readonly<ImageFieldProps>) {
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
