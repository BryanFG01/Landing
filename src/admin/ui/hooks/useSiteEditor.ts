// Editor de Sitio web: carga el borrador, lo guarda, abre la vista previa, publica y recupera versiones.
import * as React from 'react';
import { useToast } from '../../../components/ui/toast';
import { aplicarPlantilla, PLANTILLAS, type Plantilla } from '../../../data/plantillas';
import type { Bloque, SiteContent } from '../../../data/sitio';
import { api, ApiError, errorMessage } from '../api';
import { useAppearance } from '../nav';
import {
  FIRST_SECTION,
  moveBlock,
  panelThemeOf,
  PUBLISH_TOAST,
  sectionView,
  sectionWarnings,
  statusBadge,
  templateCards,
  toggleBlock,
  type DeployResult,
  type Section,
  type SiteState,
} from '../lib/siteEditor';

type Busy = '' | 'save' | 'preview' | 'publish';
const PREVIEW_URL = '/admin/vista-previa';

/** Aviso del navegador al cerrar la pestaña con cambios sin guardar. */
function useUnsavedWarning(dirty: boolean) {
  React.useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [dirty]);
}

export function useSiteEditor() {
  const { toast } = useToast();
  const { setSiteTheme } = useAppearance();
  const [state, setState] = React.useState<SiteState | null>(null);
  const [content, setContent] = React.useState<SiteContent | null>(null);
  const [saved, setSaved] = React.useState('');
  const [section, setSection] = React.useState<Section>(FIRST_SECTION);
  const [busy, setBusy] = React.useState<Busy>('');
  const [errors, setErrors] = React.useState<string[]>([]);
  const [confirmingPublish, setConfirmingPublish] = React.useState(false);
  const [confirmingTemplate, setConfirmingTemplate] = React.useState<Plantilla | null>(null);
  const [loadError, setLoadError] = React.useState('');

  const load = React.useCallback(async () => {
    try {
      const s = await api<SiteState>('/site');
      setState(s);
      setContent(s.content);
      setSaved(JSON.stringify(s.content));
    } catch (e) {
      setLoadError(errorMessage(e, 'No se pudo cargar.'));
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const dirty = !!content && JSON.stringify(content) !== saved;
  useUnsavedWarning(dirty);

  async function saveDraft(next: SiteContent | null = content): Promise<boolean> {
    if (!next) return false;
    setErrors([]);
    try {
      const r = await api<{ content: SiteContent }>('/site', { method: 'PUT', body: next });
      setContent(r.content);
      setSaved(JSON.stringify(r.content));
      setState((s) => (s ? { ...s, unpublished: true } : s));
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.errors.length) setErrors(e.errors);
      else toast({ variant: 'error', title: errorMessage(e, 'No se pudo guardar.') });
      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
  }

  /** Guarda (si hay cambios o se pide) y luego hace la acción. */
  async function withSave(kind: Busy, action: () => Promise<void> | void, onFail?: () => void) {
    setBusy(kind);
    try {
      const ok = dirty || kind === 'save' ? await saveDraft() : true;
      if (ok) await action();
      else onFail?.();
    } finally {
      setBusy('');
    }
  }

  const save = () =>
    withSave('save', () => {
      toast({ variant: 'success', title: 'Borrador guardado' });
    });

  function preview() {
    // La ventana se abre ya (antes de esperar a la red) para que el navegador no la bloquee como emergente.
    const win = window.open('about:blank', '_blank');
    return withSave(
      'preview',
      () => {
        if (win) win.location.href = PREVIEW_URL;
        else window.open(PREVIEW_URL, '_blank');
      },
      () => win?.close(),
    );
  }

  const publish = () =>
    withSave('publish', async () => {
      const r = await api<{ deploy: DeployResult }>('/site/publish', { method: 'POST' });
      setConfirmingPublish(false);
      toast(PUBLISH_TOAST[r.deploy]);
      // El panel sigue a la plantilla publicada: cambia de colores ya, sin recargar.
      if (content) setSiteTheme(panelThemeOf(content.tema));
      await load();
    });

  async function restore(versionId: number) {
    try {
      await api('/site/restore', { method: 'POST', body: { version_id: versionId } });
      await load();
      toast({ variant: 'success', title: 'Versión cargada en el borrador. Revísala y publica.' });
    } catch (e) {
      toast({ variant: 'error', title: errorMessage(e, 'No se pudo recuperar.') });
    }
  }

  const edit = (fn: (c: SiteContent) => SiteContent) => setContent((c) => (c ? fn(c) : c));

  /**
   * Aplica la plantilla y la guarda en el borrador al momento: así cualquier vista previa (también una pestaña abierta
   * de antes, al recargarla) la muestra. Sigue sin publicarse hasta pulsar Publicar.
   */
  async function applyTemplate() {
    const p = confirmingTemplate;
    if (!p || !content) return;
    const next = aplicarPlantilla(content, p);
    setContent(next);
    setBusy('save');
    try {
      const ok = await saveDraft(next);
      if (ok) toast({ variant: 'success', title: `Plantilla "${p.nombre}" guardada en el borrador. Mírala en Vista previa y publica cuando te guste.` });
    } finally {
      setBusy('');
      setConfirmingTemplate(null);
    }
  }

  return {
    loadError,
    ready: !!content && !!state,
    content,
    state,
    dirty,
    busy,
    errors,
    status: statusBadge(dirty, !!state?.unpublished),
    canPublish: !busy && (dirty || !!state?.unpublished),
    section,
    setSection,
    view: content ? sectionView(content, section) : null,
    warnings: content ? sectionWarnings(content, section) : [],
    templates: content ? templateCards(content) : [],
    confirmingTemplate,
    askTemplate: (id: string) => setConfirmingTemplate(PLANTILLAS.find((p) => p.id === id) ?? null),
    cancelTemplate: () => setConfirmingTemplate(null),
    applyTemplate,
    updateSection: (value: Record<string, unknown>) => edit((c) => sectionView(c, section).apply(value)),
    moveBlock: (i: number, delta: number) => edit((c) => moveBlock(c, i, delta)),
    toggleBlock: (tipo: Bloque['tipo']) => edit((c) => toggleBlock(c, tipo)),
    save,
    preview,
    confirmingPublish,
    askPublish: () => setConfirmingPublish(true),
    cancelPublish: () => setConfirmingPublish(false),
    publish,
    restore,
  };
}
