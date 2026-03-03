/**
 * Shared upload validation — consumed by web and mobile before sending to API.
 * The API also validates server-side (MIME whitelist + magic bytes via file-type).
 */

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

/** 10 MB in bytes */
export const MAX_UPLOAD_FILE_SIZE = 10 * 1024 * 1024;

export interface UploadValidationError {
  code: 'INVALID_MIME_TYPE' | 'FILE_TOO_LARGE';
  message: string;
}

/**
 * Validates a file before upload. Returns null if valid, or an error object.
 *
 * @param mimeType - The file's MIME type (e.g. 'image/jpeg')
 * @param sizeBytes - The file size in bytes
 */
export function validateUpload(mimeType: string, sizeBytes: number): UploadValidationError | null {
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(mimeType)) {
    return {
      code: 'INVALID_MIME_TYPE',
      message: `Tipo de archivo no permitido: ${mimeType}`,
    };
  }
  if (sizeBytes > MAX_UPLOAD_FILE_SIZE) {
    return {
      code: 'FILE_TOO_LARGE',
      message: 'El archivo excede el tamaño máximo de 10 MB',
    };
  }
  return null;
}
