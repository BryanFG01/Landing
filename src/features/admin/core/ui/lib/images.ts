// Reducción de imágenes en el navegador antes de subirlas (las fotos del celular pesan varios MB).

async function drawScaled(file: File, maxSide: number) {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = Object.assign(document.createElement('canvas'), {
    width: Math.round(bitmap.width * scale),
    height: Math.round(bitmap.height * scale),
  });
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return { canvas, scale };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo procesar la imagen.'))), type, quality),
  );
}

/**
 * Foto para la web: 1920 px como máximo en WebP. Un PNG que no hace falta reducir se queda en PNG (logos con
 * transparencia). Otros formatos (GIF, AVIF) se suben tal cual.
 */
export async function shrinkPhoto(file: File): Promise<File> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) return file;
  const { canvas, scale } = await drawScaled(file, 1920);
  const type = file.type === 'image/png' && scale === 1 ? 'image/png' : 'image/webp';
  const blob = await toBlob(canvas, type, 0.82);
  return new File([blob], file.name.replace(/\.\w+$/, type === 'image/png' ? '.png' : '.webp'), { type });
}

/** Logo del panel como data URL: 256 px como máximo, PNG (transparencia) o WebP si el PNG pesa más de `max`. */
export async function logoDataUrl(file: File, max: number): Promise<string> {
  const { canvas } = await drawScaled(file, 256);
  const png = canvas.toDataURL('image/png');
  return png.length <= max ? png : canvas.toDataURL('image/webp', 0.85);
}

export const isHexColor = (s: string) => /^#[0-9a-f]{6}$/i.test(s);
