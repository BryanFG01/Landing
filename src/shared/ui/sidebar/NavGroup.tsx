import * as Collapsible from '@radix-ui/react-collapsible';
import { cn } from '@/shared/lib/utils';
import { ChevronDownIcon } from './ChevronDownIcon';
import type { NavItemProps } from './types';

/** Entrada del menú con hijos: se despliega y muestra sus enlaces sangrados. */
export function NavGroup({ item, activeHref, onNavigate, openGroups, onToggleGroup }: Readonly<NavItemProps>) {
  const isActive = activeHref === item.href;
  const isOpen = openGroups.has(item.href);
  const Icon = item.icon;

  return (
    <li>
      <Collapsible.Root open={isOpen} onOpenChange={() => onToggleGroup(item.href)}>
        <Collapsible.Trigger
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm',
            'hover:bg-muted/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isActive ? 'bg-primary/10 font-semibold text-primary' : 'font-medium text-muted-foreground',
          )}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
          <span className="flex-1 truncate text-left">{item.label}</span>
          {item.badge !== undefined && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
              {item.badge}
            </span>
          )}
          <ChevronDownIcon open={isOpen} />
        </Collapsible.Trigger>

        <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          <ul className="mt-0.5 ml-6 border-l border-border pl-3 py-1 space-y-0.5">
            {item.children!.map((child) => {
              const ChildIcon = child.icon;
              const childActive = activeHref === child.href;
              return (
                <li key={child.href}>
                  <a
                    href={child.href}
                    onClick={(e) => onNavigate?.(child.href, e)}
                    aria-current={childActive ? 'page' : undefined}
                    className={cn(
                      'relative flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                      'hover:bg-muted/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      childActive ? 'font-medium text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {ChildIcon && <ChildIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />}
                    <span className="truncate">{child.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </Collapsible.Content>
      </Collapsible.Root>
    </li>
  );
}
