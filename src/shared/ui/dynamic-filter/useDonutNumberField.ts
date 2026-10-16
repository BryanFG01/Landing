import { useRef } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';

import { angleToFraction, clampFraction, donutCaption, DONUT_CIRCUMFERENCE, stepFromKey } from './lib';
import type { FieldProps, UseDonutNumberFieldResult } from './types';

// Botón principal del puntero: solo se arrastra la rueda con él pulsado
const PRIMARY_BUTTON = 1;

/** Rueda numérica entre `min` y `max`: se mueve arrastrando el puntero o con flechas, Inicio y Fin. */
export function useDonutNumberField({ filter, value, onChange }: FieldProps<string>): UseDonutNumberFieldResult {
  const min = Number(filter.min);
  const max = Number(filter.max);
  const hasValue = value !== undefined && value !== '';
  const displayValue = hasValue ? Number(value) : min;
  const fraction = clampFraction(displayValue, min, max);

  const dialRef = useRef<HTMLDivElement>(null);

  function commitFromPointer(clientX: number, clientY: number) {
    const el = dialRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const frac = angleToFraction(rect.left + rect.width / 2, rect.top + rect.height / 2, clientX, clientY);
    const raw = Math.round(min + frac * (max - min));
    onChange(String(Math.min(max, Math.max(min, raw))));
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    commitFromPointer(e.clientX, e.clientY);
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (e.buttons !== PRIMARY_BUTTON) return;
    commitFromPointer(e.clientX, e.clientY);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const next = stepFromKey(e.key, displayValue, min, max);
    if (next === undefined) return;
    e.preventDefault();
    onChange(String(next));
  }

  return {
    dialRef,
    min,
    max,
    displayValue,
    dashOffset: DONUT_CIRCUMFERENCE * (1 - fraction),
    caption: donutCaption(hasValue, displayValue, min, max),
    handlePointerDown,
    handlePointerMove,
    handleKeyDown,
  };
}
