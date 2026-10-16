// Confirmaciones del editor de Sitio web: aplicar una plantilla y publicar.
import * as React from 'react';
import { ConfirmDialog } from '@/features/admin/core/ui/ConfirmDialog';
import type { SiteEditorDialogsProps } from './SiteEditor.types';

const PUBLISH_WITH_HOOK =
  'La página se reconstruye con el contenido actual. Tarda 1 o 2 minutos. Podrás volver a una versión anterior desde Publicaciones.';
const PUBLISH_WITHOUT_HOOK = 'Se guarda como publicado, pero sin Deploy Hook la web no cambia hasta el próximo despliegue.';

export function SiteEditorDialogs({ site, state }: Readonly<SiteEditorDialogsProps>) {
  return (
    <>
      <ConfirmDialog
        open={!!site.confirmingTemplate}
        title={`¿Usar la plantilla "${site.confirmingTemplate?.nombre ?? ''}"?`}
        description="Cambia los colores, botones, menú, pie, esquinas, tipografías y la portada, también los colores propios de cada bloque. Tus textos, fotos y el orden no cambian. Se guarda en el borrador (con tus otros cambios): revísalo en Vista previa y publica cuando te guste."
        confirmLabel="Usar plantilla"
        busyLabel="Guardando…"
        busy={site.saving}
        onConfirm={site.applyTemplate}
        onCancel={site.cancelTemplate}
      />

      <ConfirmDialog
        open={site.confirmingPublish}
        title="¿Publicar los cambios en la web?"
        description={state.deploy_hook ? PUBLISH_WITH_HOOK : PUBLISH_WITHOUT_HOOK}
        confirmLabel="Publicar"
        busyLabel="Publicando…"
        busy={site.publishing}
        onConfirm={site.publish}
        onCancel={site.cancelPublish}
      />
    </>
  );
}
