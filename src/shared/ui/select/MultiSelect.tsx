'use client';

import * as RadixDropdown from '@radix-ui/react-dropdown-menu';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';

import { ChevronDown } from './ChevronDown';
import { NO_SELECTION } from './lib';
import { MultiSelectCheckbox } from './MultiSelectCheckbox';
import type { MultiSelectProps } from './types';
import { useMultiSelect } from './useMultiSelect';

export function MultiSelect({
  options = [],
  value,
  defaultValue = NO_SELECTION,
  onValueChange,
  placeholder = 'Seleccionar...',
  disabled,
  label,
  helperText,
  errorMessage,
  id,
  className,
  selectAllLabel = 'Seleccionar todo',
}: Readonly<MultiSelectProps>) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const multi = useMultiSelect({ options, value, defaultValue, onValueChange, placeholder });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <RadixDropdown.Root>
        <RadixDropdown.Trigger asChild>
          <button
            type="button"
            id={fieldId}
            disabled={disabled}
            className={cn(
              'flex h-9 w-full items-center justify-between rounded-lg border px-3 text-sm',
              'bg-background text-foreground transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              multi.isPlaceholder ? 'text-muted-foreground' : '',
              errorMessage ? 'border-destructive focus:ring-destructive/40' : 'border-input'
            )}
          >
            <span className="truncate">{multi.displayLabel}</span>
            <span className="text-muted-foreground"><ChevronDown /></span>
          </button>
        </RadixDropdown.Trigger>

        <RadixDropdown.Portal>
          <RadixDropdown.Content
            sideOffset={8}
            align="start"
            className="z-50 min-w-[var(--radix-popper-anchor-width)] overflow-hidden rounded-lg border border-border bg-background shadow-xl"
          >
            <div className="p-3 space-y-3">
              <RadixDropdown.CheckboxItem
                checked={multi.selectAllState}
                onCheckedChange={multi.toggleSelectAll}
                onSelect={(event) => event.preventDefault()}
                className={cn(
                  'flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors',
                  'hover:bg-muted focus:bg-muted'
                )}
              >
                <MultiSelectCheckbox state={multi.selectAllState} />
                <span>{selectAllLabel}</span>
              </RadixDropdown.CheckboxItem>

              <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                {multi.items.map((opt) => (
                  <RadixDropdown.CheckboxItem
                    key={opt.value}
                    checked={opt.checked}
                    disabled={opt.disabled}
                    onCheckedChange={() => multi.toggleOption(opt.value)}
                    onSelect={(event) => event.preventDefault()}
                    className={cn(
                      'flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground outline-none transition-colors',
                      'focus:bg-muted',
                      opt.disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted',
                      opt.checked && !opt.disabled ? 'bg-primary/5' : ''
                    )}
                  >
                    <MultiSelectCheckbox state={opt.checked} />
                    <span className="truncate">{opt.label}</span>
                  </RadixDropdown.CheckboxItem>
                ))}
              </div>
            </div>
          </RadixDropdown.Content>
        </RadixDropdown.Portal>
      </RadixDropdown.Root>

      {(errorMessage || helperText) && (
        <p className={cn('text-xs', errorMessage ? 'text-destructive' : 'text-muted-foreground')}>
          {errorMessage ?? helperText}
        </p>
      )}
    </div>
  );
}
