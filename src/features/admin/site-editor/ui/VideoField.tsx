// Campo de video del editor de Sitio web: ruta del video, con atajos al de serie o a ninguno.
import * as React from 'react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import type { VideoFieldProps } from './Fields.types';
import { DEFAULT_VIDEO } from './lib/siteEditor';

export function VideoField({ label, help, value, onChange }: Readonly<VideoFieldProps>) {
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
