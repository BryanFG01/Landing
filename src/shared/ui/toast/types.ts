import type * as React from 'react';

export type ToastVariant = 'default' | 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

export interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
}

export type ToastCardProps = ToastItem & { onDismiss: () => void };

export interface ToastProviderProps {
  children: React.ReactNode;
}
