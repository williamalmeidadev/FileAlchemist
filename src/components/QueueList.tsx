import type { JobItem } from "../types/job";
import { formatBytes } from "../lib/format";

interface QueueListProps {
  jobs: JobItem[];
  getOutputName: (job: JobItem) => string;
}

export default function QueueList({ jobs, getOutputName }: QueueListProps) {
  if (!jobs.length) {
    return (
      <section className="panel">
        <h2>Queue</h2>
        <p>No files yet.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Queue</h2>
      <div className="queue">
        {jobs.map((job) => (
          <div key={job.id} className={`queue__item queue__item--${job.status}`}>
            <div className="queue__meta">
              <div className="queue__name">{job.file.name}</div>
              <div className="queue__sizes">
                <span>{formatBytes(job.file.size)}</span>
                {job.result && (
                  <span>→ {formatBytes(job.result.size)}</span>
                )}
              </div>
              {job.error && <div className="queue__error">{job.error}</div>}
            </div>
            <div className="queue__actions">
              <span className="queue__status">{job.status}</span>
              {job.status === "done" && job.downloadUrl && (
                <a
                  className="btn btn--ghost"
                  href={job.downloadUrl}
                  download={getOutputName(job)}
                >
                  Download
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
