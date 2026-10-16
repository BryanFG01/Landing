import type { SidebarItem, SidebarSection } from './types';

const COLLAPSED = 'collapsed';
const OPEN = 'open';

/** Lee si el menú estaba plegado. Sin navegador o con el almacenamiento bloqueado, usa el valor por defecto. */
export function readStorage(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? stored === COLLAPSED : fallback;
  } catch {
    return fallback;
  }
}

/** Recuerda si el menú quedó plegado; si el navegador no deja guardar, se ignora. */
export function writeStorage(key: string, collapsed: boolean): void {
  try {
    localStorage.setItem(key, collapsed ? COLLAPSED : OPEN);
  } catch {
    // Almacenamiento bloqueado (modo privado, cuota): el menú funciona igual, solo no se recuerda.
  }
}

/** Normaliza items planos o secciones en un formato unificado. */
export function normalizeSections(items?: SidebarItem[], sections?: SidebarSection[]): SidebarSection[] {
  if (sections) return sections;
  if (items) return [{ section: '', items }];
  return [];
}

/** Copia del conjunto con `href` añadido o quitado. */
export function toggleInSet(set: Set<string>, href: string): Set<string> {
  const next = new Set(set);
  if (next.has(href)) next.delete(href);
  else next.add(href);
  return next;
}
