import type { ConvertResult, OutputFormat } from "./image";
import type { ConvertSettings } from "./image";

export type JobStatus = "pending" | "processing" | "done" | "error";

export interface JobItem {
  id: string;
  file: File;
  status: JobStatus;
  error?: string;
  result?: ConvertResult;
  downloadUrl?: string;
  outputFormat?: OutputFormat;
  previewUrl?: string;
  settings?: ConvertSettings;
}
