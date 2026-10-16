// Adaptador de iconos para el Sidebar de nuvo-ui, que recibe el icono como componente y no como elemento.
// Es un .ts (con createElement) porque es una fábrica de componentes, no un componente que pinte por sí mismo.
import * as React from 'react';
import { Icon } from './icons';
import type { SidebarIconProps } from './icons.types';

export const iconComponent = (name: string | null | undefined) =>
  function SidebarIcon({ className }: Readonly<SidebarIconProps>) {
    return React.createElement(Icon, { name, className });
  };
