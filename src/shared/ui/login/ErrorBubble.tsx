import { ALERT_ICON } from './icons';
import type { ErrorBubbleProps } from './types';

/** Burbuja con el error de validación, colgando debajo del campo. */
export function ErrorBubble({ message }: Readonly<ErrorBubbleProps>) {
  return (
    <div className="absolute left-0 top-full z-30 mt-1.5 w-max max-w-[260px]">
      {/* Flecha apuntando al campo */}
      <div
        className="ml-3 h-0 w-0"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '6px solid hsl(var(--destructive) / 0.5)',
        }}
      />
      {/* Burbuja */}
      <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-background/95 px-3 py-2 text-xs text-destructive shadow-xl backdrop-blur-sm">
        <span className="shrink-0">{ALERT_ICON}</span>
        {message}
      </div>
    </div>
  );
}
