export type CanvasInstance = HTMLCanvasElement | OffscreenCanvas;

type Canvas2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export function createCanvas(width: number, height: number): CanvasInstance {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function getCanvasContext(canvas: CanvasInstance): Canvas2D {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("2D canvas context not available");
  }
  return context as Canvas2D;
}

export async function canvasToBlob(
  canvas: CanvasInstance,
  type: string,
  quality?: number
): Promise<Blob> {
  if ("convertToBlob" in canvas) {
    return canvas.convertToBlob({ type, quality });
  }

  return new Promise<Blob>((resolve, reject) => {
    const htmlCanvas = canvas as HTMLCanvasElement;
    htmlCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode image"));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}
