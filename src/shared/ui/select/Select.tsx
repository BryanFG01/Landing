'use client';

import * as RadixSelect from '@radix-ui/react-select';
import * as React from 'react';

import { cn } from '@/shared/lib/utils';

import { CheckIcon } from './CheckIcon';
import { ChevronDown } from './ChevronDown';
import { toGroups } from './lib';
import type { SelectProps } from './types';

export function Select({
  options = [],
  groups = [],
  value,
  defaultValue,
  onValueChange,
  placeholder = 'Seleccionar...',
  disabled,
  label,
  helperText,
  errorMessage,
  id,
  className,
}: Readonly<SelectProps>) {
  const generatedId = React.useId();
  const fieldId = id ?? generatedId;
  const allGroups = toGroups(groups, options);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <RadixSelect.Root
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <RadixSelect.Trigger
          id={fieldId}
          className={cn(
            'flex h-9 w-full items-center justify-between rounded-lg border px-3 text-sm',
            'bg-background text-foreground transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[placeholder]:text-muted-foreground',
            errorMessage ? 'border-destructive focus:ring-destructive/40' : 'border-input'
          )}
          aria-invalid={!!errorMessage}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon className="text-muted-foreground">
            <ChevronDown />
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={4}
            className={cn(
              'z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-background shadow-xl',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2'
            )}
          >
            <RadixSelect.Viewport className="p-1">
              {allGroups.map((group, gi) => (
                <RadixSelect.Group key={gi}>
                  {group.label && (
                    <RadixSelect.Label className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {group.label}
                    </RadixSelect.Label>
                  )}
                  {group.options.map((opt) => (
                    <RadixSelect.Item
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                      className={cn(
                        'relative flex cursor-pointer select-none items-center justify-between rounded-md px-3 py-2 text-sm outline-none',
                        'text-foreground transition-colors',
                        'focus:bg-primary/10 focus:text-primary',
                        'data-[disabled]:pointer-events-none data-[disabled]:opacity-40'
                      )}
                    >
                      <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                      <RadixSelect.ItemIndicator>
                        <CheckIcon />
                      </RadixSelect.ItemIndicator>
                    </RadixSelect.Item>
                  ))}
                  {gi < allGroups.length - 1 && (
                    <RadixSelect.Separator className="my-1 h-px bg-border" />
                  )}
                </RadixSelect.Group>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>

      {(errorMessage || helperText) && (
        <p className={cn('text-xs', errorMessage ? 'text-destructive' : 'text-muted-foreground')}>
          {errorMessage ?? helperText}
        </p>
      )}
    </div>
  );
}
