// Subida de una imagen de la landing: se reduce en el navegador y se guarda como pública (/media/<id>).
import * as React from 'react';
import { useToast } from '@/shared/ui/toast';
import { errorMessage, uploadFile } from '../api';
import { shrinkPhoto } from '../lib/images';

export function useSiteImageUpload(onUploaded: (src: string) => void) {
  const { toast } = useToast();
  const [uploading, setUploading] = React.useState(false);

  async function upload(file: File) {
    setUploading(true);
    try {
      const ref = await uploadFile(await shrinkPhoto(file), { publico: true });
      onUploaded(`/media/${ref.id}`);
    } catch (e) {
      toast({ variant: 'error', title: errorMessage(e, 'No se pudo subir la imagen.') });
    } finally {
      setUploading(false);
    }
  }

  return { uploading, upload };
}
