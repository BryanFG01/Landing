// Título de cada grupo de la columna izquierda de Sitio web.
import * as React from 'react';
import type { HeadingProps } from './SiteSidebar.types';

export function SidebarHeading({ children }: Readonly<HeadingProps>) {
  return <p className="px-2 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{children}</p>;
}
