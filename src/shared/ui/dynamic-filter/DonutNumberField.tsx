import { cn } from '@/shared/lib/utils';

import { DONUT_CIRCUMFERENCE, DONUT_RADIUS, DONUT_SIZE, DONUT_STROKE } from './lib';
import type { FieldProps } from './types';
import { useDonutNumberField } from './useDonutNumberField';

export function DonutNumberField(props: Readonly<FieldProps<string>>) {
  const donut = useDonutNumberField(props);

  return (
    <div className="flex items-center gap-3">
      <div
        ref={donut.dialRef}
        role="slider"
        tabIndex={0}
        aria-label={props.filter.label}
        aria-valuemin={donut.min}
        aria-valuemax={donut.max}
        aria-valuenow={donut.displayValue}
        onPointerDown={donut.handlePointerDown}
        onPointerMove={donut.handlePointerMove}
        onKeyDown={donut.handleKeyDown}
        className={cn(
          'relative h-9 w-9 shrink-0 touch-none select-none rounded-full',
          'cursor-grab active:cursor-grabbing',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1'
        )}
      >
        <svg viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`} className="h-full w-full -rotate-90">
          <circle
            cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
            fill="none" stroke="currentColor" strokeWidth={DONUT_STROKE}
            className="text-muted"
          />
          <circle
            cx={DONUT_SIZE / 2} cy={DONUT_SIZE / 2} r={DONUT_RADIUS}
            fill="none" stroke="currentColor" strokeWidth={DONUT_STROKE}
            strokeLinecap="round"
            strokeDasharray={DONUT_CIRCUMFERENCE}
            strokeDashoffset={donut.dashOffset}
            className="text-primary transition-[stroke-dashoffset] duration-150 ease-out"
          />
        </svg>
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
          {donut.displayValue}
        </span>
      </div>

      <span className="text-xs text-muted-foreground">
        {donut.caption}
      </span>
    </div>
  );
}
