import type { ResizeOptions } from "../../types/image";

export const MAX_DIMENSION = 8000;

export function calculateTargetSize(
  width: number,
  height: number,
  resize?: ResizeOptions
): { width: number; height: number } {
  let targetWidth = width;
  let targetHeight = height;

  if (resize?.width || resize?.height) {
    if (resize.width && resize.height) {
      targetWidth = resize.width;
      targetHeight = resize.height;
    } else if (resize.width) {
      const ratio = resize.width / width;
      targetWidth = resize.width;
      targetHeight = Math.round(height * ratio);
    } else if (resize.height) {
      const ratio = resize.height / height;
      targetHeight = resize.height;
      targetWidth = Math.round(width * ratio);
    }
  }

  if (resize?.maxDimension) {
    const max = Math.max(targetWidth, targetHeight);
    if (max > resize.maxDimension) {
      const ratio = resize.maxDimension / max;
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }
  }

  targetWidth = Math.max(1, Math.round(targetWidth));
  targetHeight = Math.max(1, Math.round(targetHeight));

  return { width: targetWidth, height: targetHeight };
}
