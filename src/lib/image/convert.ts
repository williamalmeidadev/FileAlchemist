import type { ConvertResult, ConvertSettings } from "../../types/image";
import { canvasToBlob, createCanvas, getCanvasContext } from "./canvas";
import { decodeImage } from "./decode";
import { toOutputMime } from "./formats";
import { calculateTargetSize, MAX_DIMENSION } from "./resize";

const DEFAULT_QUALITY = 0.92;

function clampQuality(value: number | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  return Math.min(1, Math.max(0, value));
}

export async function convertImage(
  file: File,
  settings: ConvertSettings
): Promise<ConvertResult> {
  const decoded = await decodeImage(file);

  if (decoded.width > MAX_DIMENSION || decoded.height > MAX_DIMENSION) {
    throw new Error(`Image exceeds max dimension of ${MAX_DIMENSION}px`);
  }

  const target = calculateTargetSize(decoded.width, decoded.height, settings.resize);
  if (target.width > MAX_DIMENSION || target.height > MAX_DIMENSION) {
    throw new Error(`Target size exceeds max dimension of ${MAX_DIMENSION}px`);
  }

  const canvas = createCanvas(target.width, target.height);
  const context = getCanvasContext(canvas);

  const outputMime = toOutputMime(settings.outputFormat);
  if (outputMime === "image/jpeg") {
    context.fillStyle = settings.background ?? "#ffffff";
    context.fillRect(0, 0, target.width, target.height);
  }

  context.drawImage(decoded.source, 0, 0, target.width, target.height);

  const quality = outputMime === "image/png" ? undefined : clampQuality(settings.quality ?? DEFAULT_QUALITY);
  const blob = await canvasToBlob(canvas, outputMime, quality);

  return {
    blob,
    width: target.width,
    height: target.height,
    outputType: outputMime,
    size: blob.size,
  };
}
