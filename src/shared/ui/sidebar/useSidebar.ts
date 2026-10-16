import type * as React from 'react';
import { useState } from 'react';
import { normalizeSections, readStorage, toggleInSet, writeStorage } from './lib';
import type { UseSidebarOptions } from './types';

/** Estado del menú lateral: plegado (recordado en localStorage), grupos abiertos y navegación. */
export function useSidebar({ items, sections, onNavigate, storageKey, defaultCollapsed }: UseSidebarOptions) {
  const [collapsed, setCollapsed] = useState(() => readStorage(storageKey, defaultCollapsed));
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    writeStorage(storageKey, next);
  }

  function toggleGroup(href: string) {
    setOpenGroups((prev) => toggleInSet(prev, href));
  }

  // Con `onNavigate` la navegación la hace quien usa el menú (SPA); sin él, el enlace funciona normal.
  function handleNavigate(href: string, e: React.MouseEvent<HTMLAnchorElement>) {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
  }

  return {
    collapsed,
    openGroups,
    navSections: normalizeSections(items, sections),
    toggleCollapsed,
    toggleGroup,
    handleNavigate,
  };
}
