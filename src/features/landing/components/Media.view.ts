import { assetFor } from '../domain/assets';
import type { Img } from '../domain/sitio';

/** La imagen del proyecto (si la hay) y el texto alternativo: el que pasa el componente o, si no, el del contenido. */
export function mediaView(img: Img, alt: string | undefined) {
  return { asset: assetFor(img.src), text: alt ?? img.alt };
}
