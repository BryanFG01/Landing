import { cn } from '@/shared/lib/utils';
import { NavGroup } from './NavGroup';
import type { NavItemProps } from './types';

/** Entrada del menú: enlace simple, o grupo desplegable si tiene hijos. */
export function NavItem(props: Readonly<NavItemProps>) {
  const { item, activeHref, onNavigate } = props;
  const isActive = activeHref === item.href;
  const hasChildren = !!item.children?.length;
  const Icon = item.icon;

  if (hasChildren) return <NavGroup {...props} />;

  return (
    <li>
      <a
        href={item.href}
        onClick={(e) => onNavigate?.(item.href, e)}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150',
          'hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isActive ? 'bg-primary/10 font-semibold text-primary' : 'text-muted-foreground',
        )}
      >
        {/* Barra de activo */}
        {isActive && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-primary" />}
        {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge !== undefined && (
          <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
            {item.badge}
          </span>
        )}
      </a>
    </li>
  );
}
