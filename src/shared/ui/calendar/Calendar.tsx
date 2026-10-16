'use client';

import { cn } from '@/shared/lib/utils';

import { ChevronL } from './ChevronL';
import { ChevronR } from './ChevronR';
import { DAYS } from './lib';
import type { CalendarProps } from './types';
import { useCalendar } from './useCalendar';

export function Calendar(props: Readonly<CalendarProps>) {
  const cal = useCalendar(props);

  return (
    <div className="w-[288px] select-none rounded-xl border border-border bg-background p-4 shadow-2xl">

      {/* ── Header ── */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={cal.prev}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronL />
        </button>

        <button
          type="button"
          onClick={cal.toggleYearMode}
          className="rounded-md px-2 py-1 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
        >
          {cal.monthLabel} {cal.year}
        </button>

        <button
          type="button"
          onClick={cal.next}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ChevronR />
        </button>
      </div>

      {cal.yearMode ? (
        /* ── Year grid ── */
        <div className="grid grid-cols-4 gap-1">
          {cal.yearRange.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => cal.pickYear(y)}
              className={cn(
                'rounded-lg py-1.5 text-xs font-medium transition-colors hover:bg-muted',
                y === cal.year
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'text-foreground'
              )}
            >
              {y}
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* ── Day headers ── */}
          <div className="mb-1 grid grid-cols-7">
            {DAYS.map((d) => (
              <div key={d} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {d}
              </div>
            ))}
          </div>

          {/* ── Day grid ── */}
          <div className="grid grid-cols-7 gap-0.5">
            {cal.cells.map(({ iso, current, day, selected, isToday, off }) => (
              <button
                key={iso}
                type="button"
                disabled={off}
                onClick={() => cal.select(iso)}
                className={cn(
                  'flex h-8 w-full items-center justify-center rounded-lg text-sm transition-colors',
                  // días fuera del mes
                  !current && 'text-muted-foreground/30',
                  // día normal del mes
                  current && !selected && !off && 'hover:bg-muted text-foreground',
                  // seleccionado
                  selected && 'bg-primary text-primary-foreground font-semibold shadow-md',
                  // hoy (sin seleccionar)
                  isToday && !selected && 'ring-1 ring-primary text-primary font-semibold',
                  // deshabilitado
                  off && 'cursor-not-allowed opacity-25',
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Footer ── */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <button
          type="button"
          onClick={cal.clear}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          Borrar
        </button>
        <button
          type="button"
          onClick={() => cal.select(cal.today)}
          className="text-xs font-semibold text-primary transition-colors hover:text-primary/80"
        >
          Hoy
        </button>
      </div>
    </div>
  );
}
