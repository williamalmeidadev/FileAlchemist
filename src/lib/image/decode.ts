export interface DecodedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
}

function decodeWithImageElement(blob: Blob): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ source: image, width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image"));
    };
    image.src = url;
  });
}

export async function decodeImage(blob: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    return { source: bitmap, width: bitmap.width, height: bitmap.height };
  }

  if (typeof Image !== "undefined") {
    return decodeWithImageElement(blob);
  }

  throw new Error("Image decoding is not supported in this environment");
}
