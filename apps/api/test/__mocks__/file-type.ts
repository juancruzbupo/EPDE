/**
 * Manual mock for file-type (ESM-only package that can't be imported in Jest/CJS).
 * Detects JPEG and PNG via magic bytes; returns undefined for anything else.
 */
export async function fileTypeFromBuffer(
  buffer: Buffer,
): Promise<{ ext: string; mime: string } | undefined> {
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { ext: 'jpg', mime: 'image/jpeg' };
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { ext: 'png', mime: 'image/png' };
  }
  return undefined;
}
