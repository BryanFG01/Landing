// Subida de un archivo para un campo de foto o archivo: valida el tamaño, sube y devuelve la referencia.
import * as React from 'react';
import type { FileRef } from '../../schema';
import { errorMessage, uploadFile } from '../api';
import { FILE_MAX } from '../lib/recordForm';

export function useFileUpload(onUploaded: (ref: FileRef) => void) {
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState('');

  async function upload(file: File) {
    setError('');
    if (file.size > FILE_MAX) {
      setError('El archivo pesa más de 4 MB.');
      return;
    }
    setUploading(true);
    try {
      onUploaded(await uploadFile(file));
    } catch (e) {
      setError(errorMessage(e, 'No se pudo subir el archivo.'));
    } finally {
      setUploading(false);
    }
  }

  return { uploading, error, upload };
}
