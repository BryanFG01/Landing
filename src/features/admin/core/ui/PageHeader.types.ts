// Tipos de PageHeader.tsx.
import type * as React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string | null;
  icon?: string | null;
  badge?: string;
  actions?: React.ReactNode;
}
