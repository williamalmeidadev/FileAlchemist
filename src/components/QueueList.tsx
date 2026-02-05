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
    <section className="panel">
      <h2>{copy.queueTitle}</h2>
      <div className="queue">
        {jobs.map((job) => (
          <div key={job.id} className={`queue__item queue__item--${job.status}`}>
            <div className="queue__preview">
              {job.previewUrl ? (
                <img src={job.previewUrl} alt={job.file.name} loading="lazy" />
              ) : (
                <div className="queue__preview--empty" />
              )}
            </div>
            <div className="queue__meta">
              <div className="queue__name">{job.file.name}</div>
              <div className="queue__sizes">
                <span>{formatBytes(job.file.size)}</span>
                {job.result && (
                  <span>→ {formatBytes(job.result.size)}</span>
                )}
              </div>
              <div className="queue__format">
                <span className={`status-dot status-dot--${job.status}`} />
                <span>{formatOutputLabel(job)}</span>
              </div>
              {job.error && <div className="queue__error">{job.error}</div>}
            </div>
            <div className="queue__actions">
              <span className="queue__status">{statusLabel(job.status)}</span>
              {job.status === "done" && job.downloadUrl && (
                <a
                  className="btn btn--ghost"
                  href={job.downloadUrl}
                  download={getOutputName(job)}
                >
                  {copy.download}
                </a>
              )}
              <button
                type="button"
                className="btn btn--ghost"
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
