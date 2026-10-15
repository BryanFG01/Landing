// Campo de foto o archivo de un registro: se sube al elegirlo y el campo guarda su referencia.
import * as React from 'react';
import { Button } from '../../../components/ui/button';
import { fileUrl, parseFileRef, type FieldConfig } from '../../schema';
import { FilePicker } from '../FilePicker';
import { useFileUpload } from '../hooks/useFileUpload';
import { Icon } from '../icons';
import { formatSize } from '../lib/format';
import { IMAGE_ACCEPT, requiredLabel } from '../lib/recordForm';

interface FileControlProps {
  field: FieldConfig;
  value: unknown;
  error?: string;
  onChange: (value: unknown) => void;
}

export function FileControl({ field, value, error, onChange }: Readonly<FileControlProps>) {
  const ref = parseFileRef(value);
  const upload = useFileUpload(onChange);
  const isImage = field.type === 'image';
  const message = upload.error || error;
  const emptyText = isImage ? 'Sin foto' : 'Sin archivo';

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{requiredLabel(field)}</p>
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border p-3">
        {ref && isImage ? (
          <img src={fileUrl(ref)} alt="" className="size-14 shrink-0 rounded-md object-cover" />
        ) : (
          <span className="grid size-14 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
            <Icon name={isImage ? 'image' : 'paperclip'} className="size-6" />
          </span>
        )}
        <div className="min-w-0 flex-1 text-sm">
          {ref ? (
            <>
              <a href={fileUrl(ref)} target="_blank" rel="noopener" className="block truncate font-medium hover:text-primary">
                {ref.name}
              </a>
              <span className="text-xs text-muted-foreground">{formatSize(ref.size)}</span>
            </>
          ) : (
            <span className="text-muted-foreground">{upload.uploading ? 'Subiendo…' : emptyText}</span>
          )}
        </div>
        <FilePicker accept={isImage ? IMAGE_ACCEPT : undefined} label={field.label} disabled={upload.uploading} onPick={upload.upload}>
          {ref ? 'Cambiar' : 'Subir'}
        </FilePicker>
        {ref && (
          <Button type="button" variant="ghost" size="icon" aria-label="Quitar" onClick={() => onChange('')}>
            <Icon name="x" />
          </Button>
        )}
      </div>
      {message ? (
        <p className="mt-1 text-xs text-destructive">{message}</p>
      ) : (
        field.help && <p className="mt-1 text-xs text-muted-foreground">{field.help}</p>
      )}
    </div>
  );
}
