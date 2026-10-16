import { cn } from '@/shared/lib/utils';

import { checkboxMarks } from './lib';
import type { MultiSelectCheckboxProps } from './types';

export function MultiSelectCheckbox({ state }: Readonly<MultiSelectCheckboxProps>) {
  const marks = checkboxMarks(state);
  return (
    <span
      className={cn(
        'flex h-4 w-4 shrink-0 items-center justify-center rounded border border-input bg-background transition-colors',
        marks.isActive && 'border-primary bg-primary text-primary-foreground'
      )}
      aria-hidden
    >
      {marks.isIndeterminate ? (
        <svg width="8" height="2" viewBox="0 0 8 2" fill="currentColor" aria-hidden><rect width="8" height="2" rx="1"/></svg>
      ) : marks.isChecked ? (
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><polyline points="1 4 3.5 6.5 9 1"/></svg>
      ) : null}
    </span>
  );
}
