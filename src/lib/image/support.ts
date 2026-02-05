export function detectWebpSupport(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const canvas = document.createElement("canvas");
  if (!canvas.toDataURL) {
    return false;
  }

  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}
