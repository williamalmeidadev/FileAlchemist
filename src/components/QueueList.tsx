import type { JobItem } from "../types/job";
import { formatBytes } from "../lib/format";

interface QueueListProps {
  jobs: JobItem[];
  getOutputName: (job: JobItem) => string;
  onRemove: (id: string) => void;
  copy: {
    queueTitle: string;
    download: string;
    remove: string;
    statusPending: string;
    statusProcessing: string;
    statusDone: string;
    statusError: string;
  };
}

function formatOutputLabel(job: JobItem): string {
  const input = job.file.type.includes("png")
    ? "PNG"
    : job.file.type.includes("webp")
    ? "WEBP"
    : "JPG";
  const outputFormat = job.settings?.outputFormat ?? job.outputFormat ?? "png";
  const output = outputFormat === "jpeg" ? "JPG" : outputFormat.toUpperCase();
  return `${input} → ${output}`;
}

export default function QueueList({ jobs, getOutputName, onRemove, copy }: QueueListProps) {
  const statusLabel = (status: JobItem["status"]) => {
    switch (status) {
      case "pending":
        return copy.statusPending;
      case "processing":
        return copy.statusProcessing;
      case "done":
        return copy.statusDone;
      case "error":
        return copy.statusError;
      default:
        return status;
    }
  };

  return (
    <section className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
      <h2 className="text-lg font-semibold">{copy.queueTitle}</h2>
      <div className="grid gap-3">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--drop-bg)] p-4 sm:flex-row sm:items-start"
          >
            <div className="h-24 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] sm:h-16 sm:w-16">
              {job.previewUrl ? (
                <img src={job.previewUrl} alt={job.file.name} loading="lazy" />
              ) : (
                <div className="h-full w-full bg-[var(--surface-2)]" />
              )}
            </div>
            <div className="grid flex-1 gap-2">
              <div className="font-semibold">{job.file.name}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                <span>{formatBytes(job.file.size)}</span>
                {job.result && (
                  <span>→ {formatBytes(job.result.size)}</span>
                )}
              </div>
              <div className="inline-flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className={`h-2 w-2 rounded-full ${job.status === "pending" ? "bg-[#f59e0b]" : job.status === "processing" ? "bg-[#3b82f6]" : job.status === "done" ? "bg-[#22c55e]" : "bg-[#ef4444]"}`} />
                <span>{formatOutputLabel(job)}</span>
              </div>
              {job.error && <div className="text-xs text-[#ef4444]">{job.error}</div>}
            </div>
            <div className="grid gap-2 text-sm text-[var(--muted)] sm:justify-items-end">
              <span className="text-xs">{statusLabel(job.status)}</span>
              {job.status === "done" && job.downloadUrl && (
                <a
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:-translate-y-0.5"
                  href={job.downloadUrl}
                  download={getOutputName(job)}
                >
                  {copy.download}
                </a>
              )}
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text)] transition hover:-translate-y-0.5"
                onClick={() => onRemove(job.id)}
              >
                {copy.remove}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
