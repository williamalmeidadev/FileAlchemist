import JSZip from "jszip";
import type { JobItem } from "../types/job";

interface ZipEntry {
  name: string;
  blob: Blob;
}

function splitFilename(name: string): { base: string; extension: string } {
  const trimmed = name.trim();
  if (!trimmed) return { base: "file", extension: "" };

  const dotIndex = trimmed.lastIndexOf(".");
  if (dotIndex <= 0 || dotIndex === trimmed.length - 1) {
    return { base: trimmed, extension: "" };
  }

  return {
    base: trimmed.slice(0, dotIndex),
    extension: trimmed.slice(dotIndex),
  };
}

export function ensureUniqueFilenames(names: string[]): string[] {
  const used = new Set<string>();

  return names.map((name) => {
    const normalized = name.trim() || "file";
    if (!used.has(normalized)) {
      used.add(normalized);
      return normalized;
    }

    const { base, extension } = splitFilename(normalized);
    let suffix = 2;
    let candidate = `${base} (${suffix})${extension}`;
    while (used.has(candidate)) {
      suffix += 1;
      candidate = `${base} (${suffix})${extension}`;
    }

    used.add(candidate);
    return candidate;
  });
}

export async function downloadZip(jobs: JobItem[], getOutputName: (job: JobItem) => string) {
  const zip = new JSZip();
  const entries: ZipEntry[] = [];

  jobs.forEach((job) => {
    if (!job.result) return;
    entries.push({ name: getOutputName(job), blob: job.result.blob });
  });

  const uniqueNames = ensureUniqueFilenames(entries.map((entry) => entry.name));
  entries.forEach((entry, index) => {
    zip.file(uniqueNames[index], entry.blob);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "filealchemist.zip";
  link.click();

  setTimeout(() => URL.revokeObjectURL(url), 0);
}
