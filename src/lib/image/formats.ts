import type { InputMime, OutputFormat } from "../../types/image";

export const INPUT_MIME_TYPES: InputMime[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
];

export const OUTPUT_FORMATS: Record<OutputFormat, InputMime> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export function isSupportedInput(file: File): file is File & { type: InputMime } {
  return INPUT_MIME_TYPES.includes(file.type as InputMime);
}

export function toOutputMime(format: OutputFormat): InputMime {
  return OUTPUT_FORMATS[format];
}
