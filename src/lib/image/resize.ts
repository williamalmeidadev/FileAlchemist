import type { ResizeOptions } from "../../types/image";

export const MAX_DIMENSION = 8000;

function normalizeDimension(value: number | undefined): number | undefined {
  if (!Number.isFinite(value)) return undefined;
  if (!value || value <= 0) return undefined;
  return Math.min(MAX_DIMENSION, Math.round(value));
}

export function calculateTargetSize(
  width: number,
  height: number,
  resize?: ResizeOptions
): { width: number; height: number } {
  let targetWidth = width;
  let targetHeight = height;

  const resizeWidth = normalizeDimension(resize?.width);
  const resizeHeight = normalizeDimension(resize?.height);
  const maxDimension = normalizeDimension(resize?.maxDimension);

  if (resizeWidth || resizeHeight) {
    if (resizeWidth && resizeHeight) {
      targetWidth = resizeWidth;
      targetHeight = resizeHeight;
    } else if (resizeWidth) {
      const ratio = resizeWidth / width;
      targetWidth = resizeWidth;
      targetHeight = Math.round(height * ratio);
    } else if (resizeHeight) {
      const ratio = resizeHeight / height;
      targetHeight = resizeHeight;
      targetWidth = Math.round(width * ratio);
    }
  }

  if (maxDimension) {
    const max = Math.max(targetWidth, targetHeight);
    if (max > maxDimension) {
      const ratio = maxDimension / max;
      targetWidth = Math.round(targetWidth * ratio);
      targetHeight = Math.round(targetHeight * ratio);
    }
  }

  targetWidth = Math.max(1, Math.round(targetWidth));
  targetHeight = Math.max(1, Math.round(targetHeight));

  return { width: targetWidth, height: targetHeight };
}
