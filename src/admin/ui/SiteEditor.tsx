// Sitio web: editar la landing por bloques sin tocar código. El formulario sale de BLOCK_DEFS y SETTINGS_DEFS
// (src/data/sitio.ts). Se guarda como borrador; "Vista previa" lo enseña y "Publicar" lo lleva a la web.
// La lógica está en hooks/useSiteEditor.ts y lib/siteEditor.ts.
import * as React from 'react';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { ConfirmDialog } from './ConfirmDialog';
import { ErrorList } from './ErrorList';
import { useSiteEditor } from './hooks/useSiteEditor';
import { Icon } from './icons';
import { sectionKey } from './lib/siteEditor';
import { LoadError } from './PageStates';
import { PageHeader } from './PageHeader';
import { Fields } from './site/Fields';
import { SiteSidebar } from './site/SiteSidebar';
import { TemplateGallery } from './site/TemplateGallery';
import { ThemeSample } from './site/ThemeSample';

const PUBLISH_WITH_HOOK =
  'La página se reconstruye con el contenido actual. Tarda 1 o 2 minutos. Podrás volver a una versión anterior desde Publicaciones.';
const PUBLISH_WITHOUT_HOOK = 'Se guarda como publicado, pero sin Deploy Hook la web no cambia hasta el próximo despliegue.';

export function SiteEditor() {
  const site = useSiteEditor();

  if (site.loadError) return <LoadError message={site.loadError} />;
  if (!site.content || !site.state || !site.view) return <p className="text-sm text-muted-foreground">Cargando…</p>;

  const { content, state, view, section } = site;
  const block = section.kind === 'block' ? content.bloques.find((b) => b.tipo === section.tipo) : undefined;

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
              {site.busy === 'save' ? 'Guardando…' : 'Guardar borrador'}
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

        <Card className="min-w-0 space-y-5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-xl">{view.title}</h2>
              <p className="text-sm text-muted-foreground">{view.description}</p>
            </div>
            {block && (
              <Switch
                label="Visible"
                checked={block.visible}
                disabled={block.tipo === 'paseo'}
                onCheckedChange={() => site.toggleBlock(block.tipo)}
              />
            )}
          </div>

          {section.kind === 'setting' && section.key === 'tema' ? (
            <ThemeSample tema={content.tema} brand={content.marca.nombre} warnings={site.warnings} />
          ) : (
            site.warnings.map((w) => (
              <Alert key={w} variant="warning">
                {w}
              </Alert>
            ))
          )}

          {section.kind === 'templates' ? (
            <TemplateGallery cards={site.templates} brand={content.marca.nombre} onApply={site.askTemplate} />
          ) : (
            <Fields key={sectionKey(section)} fields={view.fields} value={view.value} onChange={site.updateSection} />
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={!!site.confirmingTemplate}
        title={`¿Usar la plantilla "${site.confirmingTemplate?.nombre ?? ''}"?`}
        description="Cambia los colores, botones, menú, pie, esquinas y tipografías, también los colores propios de cada bloque. Tus textos, fotos y el orden no cambian. Queda como cambio sin guardar: revísalo en Vista previa antes de publicar."
        confirmLabel="Usar plantilla"
        busyLabel="Aplicando…"
        busy={false}
        onConfirm={site.applyTemplate}
        onCancel={site.cancelTemplate}
      />

      <ConfirmDialog
        open={site.confirmingPublish}
        title="¿Publicar los cambios en la web?"
        description={state.deploy_hook ? PUBLISH_WITH_HOOK : PUBLISH_WITHOUT_HOOK}
        confirmLabel="Publicar"
        busyLabel="Publicando…"
        busy={site.busy === 'publish'}
        onConfirm={site.publish}
        onCancel={site.cancelPublish}
      />
    </>
  );
}
