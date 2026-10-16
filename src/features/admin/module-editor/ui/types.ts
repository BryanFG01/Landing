// Tipos compartidos por los componentes del constructor de módulos.
import type { ModuleEditorState } from './hooks/useModuleEditor';

/** Props de las piezas que solo reciben el estado del editor. */
export interface EditorProps {
  editor: ModuleEditorState;
}
