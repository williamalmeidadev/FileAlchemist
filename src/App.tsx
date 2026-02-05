import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dropzone from "./components/Dropzone";
import QueueList from "./components/QueueList";
import SettingsPanel from "./components/SettingsPanel";
import { createId } from "./lib/id";
import { isSupportedInput } from "./lib/image/formats";
import { detectWebpSupport } from "./lib/image/support";
import { applyTheme, getInitialTheme, persistTheme, type ThemeMode } from "./lib/theme";
import {
  COPY,
  getInitialLanguage,
  persistLanguage,
  type Language,
} from "./lib/i18n";
import logoDark from "./assets/FileAlchemist.png";
import logoLight from "./assets/FileAlchemistWhite.png";
import { downloadZip } from "./lib/zip";
import type { ConvertSettings, WorkerMessage } from "./types/image";
import type { JobItem } from "./types/job";

const ACCEPT = "image/png,image/jpeg,image/webp";

const DEFAULT_SETTINGS: ConvertSettings = {
  outputFormat: "png",
  quality: 0.92,
  background: "#ffffff",
  resize: { maxDimension: 8000 },
};

export default function App() {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [settings, setSettings] = useState<ConvertSettings>(DEFAULT_SETTINGS);
  const [isConverting, setIsConverting] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [webpSupported, setWebpSupported] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme());
  const [language, setLanguage] = useState<Language>(() => getInitialLanguage());

  const workerRef = useRef<Worker | null>(null);
  const jobsRef = useRef<JobItem[]>([]);
  const settingsRef = useRef(settings);

  const updateJobs = useCallback((updater: (current: JobItem[]) => JobItem[]) => {
    setJobs((current) => {
      const next = updater(current);
      jobsRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    setWebpSupported(detectWebpSupport());
  }, []);

  useEffect(() => {
    applyTheme(theme);
    persistTheme(theme);
  }, [theme]);

  useEffect(() => {
    persistLanguage(language);
  }, [language]);

  useEffect(() => {
    if (!webpSupported && settings.outputFormat === "webp") {
      setSettings((current) => ({ ...current, outputFormat: "png" }));
    }
  }, [settings.outputFormat, webpSupported]);

  const processNext = useCallback(() => {
    const worker = workerRef.current;
    if (!worker) return;

    const nextJob = jobsRef.current.find((job) => job.status === "pending");
    if (!nextJob) {
      setIsConverting(false);
      return;
    }

    updateJobs((current) =>
      current.map((job) =>
        job.id === nextJob.id
          ? {
              ...job,
              status: "processing",
              outputFormat: nextJob.settings?.outputFormat ?? settingsRef.current.outputFormat,
              error: undefined,
            }
          : job
      )
    );

    worker.postMessage({
      id: nextJob.id,
      file: nextJob.file,
      settings: nextJob.settings ?? settingsRef.current,
    });
  }, [updateJobs]);

  useEffect(() => {
    const worker = new Worker(new URL("./workers/converter.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const message = event.data;
      if (message.ok) {
        updateJobs((current) =>
          current.map((job) => {
            if (job.id !== message.id) return job;
            if (job.downloadUrl) {
              URL.revokeObjectURL(job.downloadUrl);
            }
            return {
              ...job,
              status: "done",
              result: message.result,
              downloadUrl: URL.createObjectURL(message.result.blob),
            };
          })
        );
      } else {
        updateJobs((current) =>
          current.map((job) =>
            job.id === message.id
              ? { ...job, status: "error", error: message.error }
              : job
          )
        );
      }

      processNext();
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [processNext, updateJobs]);

  useEffect(() => {
    return () => {
      jobsRef.current.forEach((job) => {
        if (job.downloadUrl) {
          URL.revokeObjectURL(job.downloadUrl);
        }
        if (job.previewUrl) {
          URL.revokeObjectURL(job.previewUrl);
        }
      });
    };
  }, []);

  const handleFilesAdded = (files: File[]) => {
    const accepted = files.filter(isSupportedInput);
    if (!accepted.length) return;

    updateJobs((current) => [
      ...current,
      ...accepted.map((file) => ({
        id: createId(),
        file,
        status: "pending" as const,
        previewUrl: URL.createObjectURL(file),
        settings: settingsRef.current,
        outputFormat: settingsRef.current.outputFormat,
      })),
    ]);
  };

  const handleConvert = () => {
    if (!jobsRef.current.length || isConverting) return;
    setIsConverting(true);
    processNext();
  };

  const handleClear = () => {
    jobsRef.current.forEach((job) => {
      if (job.downloadUrl) {
        URL.revokeObjectURL(job.downloadUrl);
      }
      if (job.previewUrl) {
        URL.revokeObjectURL(job.previewUrl);
      }
    });
    setIsConverting(false);
    updateJobs(() => []);
  };

  const handleDownloadZip = async () => {
    if (isZipping) return;
    const readyJobs = jobsRef.current.filter((job) => job.status === "done" && job.result);
    if (!readyJobs.length) return;

    setIsZipping(true);
    try {
      await downloadZip(readyJobs, getOutputName);
    } finally {
      setIsZipping(false);
    }
  };

  const summary = useMemo(() => {
    const total = jobs.length;
    const done = jobs.filter((job) => job.status === "done").length;
    const pending = jobs.filter((job) => job.status === "pending").length;
    const errors = jobs.filter((job) => job.status === "error").length;
    return { total, done, pending, errors };
  }, [jobs]);

  const progress = useMemo(() => {
    const total = jobs.length || 1;
    const done = jobs.filter((job) => job.status === "done").length;
    const error = jobs.filter((job) => job.status === "error").length;
    const processing = jobs.filter((job) => job.status === "processing").length;
    const completed = done + error;
    return {
      pct: Math.round((completed / total) * 100),
      done,
      error,
      processing,
      completed,
      total: jobs.length,
    };
  }, [jobs]);

  const doneJobs = useMemo(
    () => jobs.filter((job) => job.status === "done" && job.result),
    [jobs]
  );

  const handleRemove = (id: string) => {
    updateJobs((current) => {
      const target = current.find((job) => job.id === id);
      if (target?.downloadUrl) {
        URL.revokeObjectURL(target.downloadUrl);
      }
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return current.filter((job) => job.id !== id);
    });
  };

  const getOutputName = (job: JobItem): string => {
    const format = job.settings?.outputFormat ?? job.outputFormat ?? settings.outputFormat;
    const extension = format === "jpeg" ? "jpg" : format;
    const baseName = job.file.name.replace(/\.[^.]+$/, "");
    return `${baseName}.${extension}`;
  };

  const copy = COPY[language];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-8 px-5 py-8">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              className="h-[84px] w-auto max-w-[360px] object-contain object-left"
              src={theme === "dark" ? logoLight : logoDark}
              alt="FileAlchemist logo"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--panel-shadow)] transition hover:-translate-y-0.5"
              onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              aria-label={copy.themeToggle}
              title={copy.themeToggle}
            >
              {theme === "dark" ? "☀️" : "🌙"}
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--panel-shadow)] transition hover:-translate-y-0.5"
              onClick={() => setLanguage((current) => (current === "pt" ? "en" : "pt"))}
              aria-label={copy.languageToggle}
              title={copy.languageToggle}
            >
              {language === "pt" ? "🇧🇷" : "🇺🇸"}
            </button>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <section className="grid gap-6">
            <div className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{copy.dropTitle}</h2>
                <span className="text-xs text-[var(--muted)]">
                  {summary.total} {copy.inQueue}
                </span>
              </div>
              <Dropzone
                onFilesAdded={handleFilesAdded}
                accept={ACCEPT}
                title={copy.dropzoneTitle}
                subtitle={copy.dropzoneSubtitle}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-[var(--bg)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleConvert}
                  disabled={!jobs.length || isConverting}
                >
                  {isConverting ? copy.dropActionConverting : copy.dropActionPrimary}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-5 py-2 text-sm font-semibold text-[var(--text)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleDownloadZip}
                  disabled={!doneJobs.length || isZipping}
                >
                  {isZipping ? copy.dropActionZipping : copy.dropActionZip}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-[var(--danger)]/40 px-5 py-2 text-sm font-semibold text-[var(--danger)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={handleClear}
                  disabled={!jobs.length}
                >
                  {copy.dropActionClear}
                </button>
              </div>
              <p className="text-xs text-[var(--muted)]">{copy.dropHelper}</p>
            </div>

            <div className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
              <h2 className="text-lg font-semibold">{copy.queueSummaryTitle}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
                  <span className="h-2 w-2 rounded-full bg-[#94a3b8]" /> {copy.queueTotal}{" "}
                  <b className="text-[var(--text)]">{summary.total}</b>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
                  <span className="h-2 w-2 rounded-full bg-[#f59e0b]" /> {copy.queuePending}{" "}
                  <b className="text-[var(--text)]">{summary.pending}</b>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
                  <span className="h-2 w-2 rounded-full bg-[#22c55e]" /> {copy.queueDone}{" "}
                  <b className="text-[var(--text)]">{summary.done}</b>
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs text-[var(--muted)]">
                  <span className="h-2 w-2 rounded-full bg-[#ef4444]" /> {copy.queueErrors}{" "}
                  <b className="text-[var(--text)]">{summary.errors}</b>
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-[var(--muted)]">
                <span>{progress.pct}%</span>
                <span>
                  {progress.completed}/{progress.total || 0} {copy.progressProcessed}
                </span>
              </div>
            </div>

            {!jobs.length ? (
              <div className="grid place-items-center py-4">
                <div className="w-full rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-5 text-left">
                  <p className="mb-1 font-semibold text-[var(--text)]">{copy.emptyTitle}</p>
                  <p className="text-sm text-[var(--muted)]">{copy.emptySubtitle}</p>
                </div>
              </div>
            ) : (
              <QueueList jobs={jobs} getOutputName={getOutputName} onRemove={handleRemove} copy={copy} />
            )}
          </section>

          <section className="lg:sticky lg:top-5">
            <SettingsPanel
              settings={settings}
              onChange={setSettings}
              webpSupported={webpSupported}
              onReset={() => setSettings(DEFAULT_SETTINGS)}
              copy={copy}
            />
          </section>
        </main>

        <footer className="mt-auto border-t border-[var(--border)] pt-5 text-center">
          <a
            className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
            href="https://williamalmeida.dev"
            target="_blank"
            rel="noreferrer"
          >
            {copy.footer}
          </a>
        </footer>
      </div>
    </div>
  );
}
