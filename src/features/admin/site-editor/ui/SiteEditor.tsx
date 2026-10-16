// Sitio web: editar la landing por bloques sin tocar código. El formulario sale de BLOCK_DEFS y SETTINGS_DEFS
// (src/data/sitio.ts). Se guarda como borrador; "Vista previa" lo enseña y "Publicar" lo lleva a la web.
// La lógica está en hooks/useSiteEditor.ts y lib/siteEditor.ts.
import * as React from 'react';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { ErrorList } from '@/features/admin/core/ui/ErrorList';
import { Icon } from '@/features/admin/core/ui/icons';
import { PageHeader } from '@/features/admin/core/ui/PageHeader';
import { LoadError } from '@/features/admin/core/ui/PageStates';
import { useSiteEditor } from './hooks/useSiteEditor';
import { SectionCard } from './SectionCard';
import { SiteEditorDialogs } from './SiteEditorDialogs';
import { SiteSidebar } from './SiteSidebar';

export function SiteEditor() {
  const site = useSiteEditor();

  if (site.loadError) return <LoadError message={site.loadError} />;
  if (!site.content || !site.state || !site.view) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const { content, state, view, section } = site;

  return (
    <>
      <PageHeader
        title="Sitio web"
        icon="storefront"
        description="Textos, imágenes, colores, tipografía y orden de los bloques de la página. Los cambios se guardan como borrador hasta que publiques."
        badge={site.status}
        actions={
          <>
            <Button variant="outline" onClick={site.save} disabled={!!site.busy || !site.dirty}>
              {site.saving ? 'Guardando…' : 'Guardar borrador'}
            </Button>
            <Button variant="outline" onClick={site.preview} disabled={!!site.busy}>
              <Icon name="eye" /> Vista previa
            </Button>
            <Button onClick={site.askPublish} disabled={!site.canPublish}>
              Publicar
            </Button>
          </>
        }
      />

      {!state.deploy_hook && (
        <Alert variant="warning" title="Falta conectar la publicación con Vercel" className="mb-4">
          Publicar guarda los cambios, pero la web no se reconstruye sola. En Vercel: Settings → Git → Deploy Hooks, crea uno
          para la rama de producción y guarda su URL como variable <code className="font-mono">VERCEL_DEPLOY_HOOK</code>.
        </Alert>
      )}

      <ErrorList title="Revisa el contenido" errors={site.errors} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <SiteSidebar
          blocks={content.bloques}
          versions={state.versions}
          section={section}
          onSection={site.setSection}
          onMove={site.moveBlock}
          onToggle={site.toggleBlock}
          onRestore={site.restore}
        />

        <SectionCard site={site} content={content} view={view} section={section} />
      </div>

      <SiteEditorDialogs site={site} state={state} />
    </>
  );
}
