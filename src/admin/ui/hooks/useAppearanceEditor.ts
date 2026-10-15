// Editor de apariencia: borrador con vista previa en vivo en todo el panel. Si se sale sin guardar, se vuelve a lo
// guardado.
import * as React from 'react';
import { useToast } from '../../../components/ui/toast';
import { DEFAULT_APPEARANCE, LOGO_MAX, type Appearance } from '../../schema';
import { api, ApiError, errorMessage } from '../api';
import { isHexColor, logoDataUrl } from '../lib/images';
import { useAppearance } from '../nav';

/** Solo se aplica en vivo un borrador con colores válidos (mientras se escribe un hex queda a medias). */
const previewable = (a: Appearance) => isHexColor(a.primary) && (!a.primary_dark || isHexColor(a.primary_dark));

export function useAppearanceEditor() {
  const { toast } = useToast();
  const { appearance: saved, setAppearance } = useAppearance();
  const [draft, setDraftState] = React.useState<Appearance>(saved);
  const [errors, setErrors] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);
  const savedRef = React.useRef(saved);
  const draftRef = React.useRef(saved);

  React.useEffect(() => {
    savedRef.current = saved;
  }, [saved]);
  // Al salir de la pantalla sin guardar, el panel vuelve a la apariencia guardada.
  React.useEffect(() => () => setAppearance(savedRef.current), [setAppearance]);

  const setDraft = React.useCallback((next: Appearance) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);

  const update = React.useCallback(
    (patch: Partial<Appearance>) => {
      const next = { ...draftRef.current, ...patch };
      setDraft(next);
      if (previewable(next)) setAppearance(next);
    },
    [setAppearance, setDraft],
  );

  async function pickLogo(file: File | undefined) {
    if (!file) return;
    try {
      const logo = await logoDataUrl(file, LOGO_MAX);
      if (logo.length > LOGO_MAX) {
        toast({ variant: 'error', title: 'El logo es demasiado grande incluso reducido.' });
        return;
      }
      update({ logo });
    } catch {
      toast({ variant: 'error', title: 'No se pudo leer la imagen.' });
    }
  }

  async function save() {
    setSaving(true);
    setErrors([]);
    try {
      const r = await api<{ appearance: Appearance }>('/settings/appearance', { method: 'PUT', body: draft });
      savedRef.current = r.appearance;
      setAppearance(r.appearance);
      setDraft(r.appearance);
      toast({ variant: 'success', title: 'Apariencia guardada' });
    } catch (e) {
      if (e instanceof ApiError && e.errors.length) setErrors(e.errors);
      else toast({ variant: 'error', title: errorMessage(e, 'No se pudo guardar.') });
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setDraft(saved);
    setAppearance(saved);
  }

  return {
    draft,
    errors,
    saving,
    dirty: JSON.stringify(draft) !== JSON.stringify(saved),
    update,
    pickLogo,
    save,
    discard,
    resetToDefaults: () => update({ ...DEFAULT_APPEARANCE }),
  };
}
