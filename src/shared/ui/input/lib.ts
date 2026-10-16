import type { InputVariant } from './types';

/** Un mensaje de error manda sobre la variante pedida. */
export function resolveInputVariant(variant: InputVariant, errorMessage?: string) {
  const resolved: InputVariant = errorMessage ? 'error' : variant;
  return { variant: resolved, isInvalid: resolved === 'error' };
}
