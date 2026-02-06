export type InputMime = "image/png" | "image/jpeg" | "image/webp";
export type OutputFormat = "png" | "jpeg" | "webp";

export interface ResizeOptions {
  width?: number;
  height?: number;
  maxDimension?: number;
}

export interface ConvertSettings {
  outputFormat: OutputFormat;
  quality?: number; // 0-1 for jpeg/webp
  background?: string; // used for jpeg
  resize?: ResizeOptions;
}

export interface ConvertJob {
  id: string;
  file: File;
  settings: ConvertSettings;
}

export interface ConvertResult {
  blob: Blob;
  width: number;
  height: number;
  outputType: InputMime;
  size: number;
}

export interface WorkerSuccessMessage {
  id: string;
  ok: true;
  result: ConvertResult;
}

export interface WorkerErrorMessage {
  id: string;
  ok: false;
  error: string;
}

export type WorkerMessage = WorkerSuccessMessage | WorkerErrorMessage;
