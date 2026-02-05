import JSZip from "jszip";
import type { JobItem } from "../types/job";

export async function downloadZip(jobs: JobItem[], getOutputName: (job: JobItem) => string) {
  const zip = new JSZip();

  jobs.forEach((job) => {
    if (!job.result) return;
    zip.file(getOutputName(job), job.result.blob);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "filealchemist.zip";
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
