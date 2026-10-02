/** Browser-only file helpers: saving downloads and reading the ID photo. */

export function download(filename: string, content: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** 3:4, the 30×40 mm of a 履歴書 photo at roughly 250 dpi. */
const PHOTO_WIDTH = 300;
const PHOTO_HEIGHT = 400;

/**
 * Crops the image to 3:4 around its centre and shrinks it to a small JPEG,
 * so it fits in localStorage and in the exported JSON.
 */
export async function readPhoto(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = PHOTO_WIDTH / PHOTO_HEIGHT;
    let sw = bitmap.width;
    let sh = bitmap.height;
    if (sw / sh > ratio) sw = sh * ratio;
    else sh = sw / ratio;
    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_WIDTH;
    canvas.height = PHOTO_HEIGHT;
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, (bitmap.width - sw) / 2, (bitmap.height - sh) / 2, sw, sh, 0, 0, PHOTO_WIDTH, PHOTO_HEIGHT);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    bitmap.close();
  }
}
