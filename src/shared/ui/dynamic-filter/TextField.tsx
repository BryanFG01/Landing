import { cn } from '@/shared/lib/utils';

import { inputCls } from './lib';
import { SearchIcon } from './SearchIcon';
import type { FieldProps } from './types';

export function TextField({ filter, value, onChange }: Readonly<FieldProps<string>>) {
  return (
    <div className="relative">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <SearchIcon />
      </span>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={filter.placeholder ?? `Buscar...`}
        className={cn(inputCls, 'pl-8')}
      />
    </div>
  );
}
