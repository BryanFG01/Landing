import type { ChevronDownIconProps } from './types';

/** Flecha de los grupos desplegables; gira al abrirse. */
export function ChevronDownIcon({ open }: Readonly<ChevronDownIconProps>) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
