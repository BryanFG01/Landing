// Elige la pantalla del panel según la ruta actual.
import * as React from 'react';
import { AppearanceView } from '@/features/admin/appearance/ui/AppearanceView';
import { LoadError } from '@/features/admin/core/ui/PageStates';
import { SiteEditor } from '@/features/admin/site-editor/ui/SiteEditor';
import { SqlConsole } from '@/features/admin/sql/ui/SqlConsole';
import { UsersView } from '@/features/admin/users/ui/UsersView';
import type { ScreenProps } from './AdminApp.types';
import { DashboardRoute } from './DashboardRoute';
import { EditorRoute } from './EditorRoute';
import { ModuleRoute } from './ModuleRoute';
import { ModulesRoute } from './ModulesRoute';

export function Screen({ route, user }: Readonly<ScreenProps>) {
  switch (route.name) {
    case 'dashboard':
      return <DashboardRoute user={user} />;
    case 'module':
      return <ModuleRoute moduleKey={route.key} user={user} />;
    case 'modules':
      return <ModulesRoute />;
    case 'editor':
      return <EditorRoute key={route.id ?? 'nuevo'} id={route.id} />;
    case 'users':
      return <UsersView me={user} />;
    case 'sql':
      return <SqlConsole />;
    case 'appearance':
      return <AppearanceView />;
    case 'site':
      return <SiteEditor />;
    default:
      return <LoadError message="Esta página del panel no existe." />;
  }
}
