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
        status: "pending",
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
    <div className="app">
      <header className="app__header">
        <div className="brand">
          <h1 className="brand__title">{copy.brandTitle}</h1>
          <p className="brand__subtitle">{copy.brandSubtitle}</p>
        </div>

        <div className="header__actions">
          <button
            type="button"
            className="iconbtn"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            aria-label={copy.themeToggle}
            title={copy.themeToggle}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          <button
            type="button"
            className="iconbtn"
            onClick={() => setLanguage((current) => (current === "pt" ? "en" : "pt"))}
            aria-label={copy.languageToggle}
            title={copy.languageToggle}
          >
            {language === "pt" ? "🇧🇷" : "🇺🇸"}
          </button>
        </div>
      </header>

      <main className="app__main">
        <section className="left-stack">
          <div className="panel">
            <div className="panel__title">
              <h2>{copy.dropTitle}</h2>
              <span className="helper">
                {summary.total} {copy.inQueue}
              </span>
            </div>
          <Dropzone
            onFilesAdded={handleFilesAdded}
            accept={ACCEPT}
            title={copy.dropzoneTitle}
            subtitle={copy.dropzoneSubtitle}
          />
          <div className="panel__actions">
            <button
              type="button"
              className="btn"
              onClick={handleConvert}
              disabled={!jobs.length || isConverting}
            >
              {isConverting ? copy.dropActionConverting : copy.dropActionPrimary}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleDownloadZip}
              disabled={!doneJobs.length || isZipping}
            >
              {isZipping ? copy.dropActionZipping : copy.dropActionZip}
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleClear}
              disabled={!jobs.length}
            >
              {copy.dropActionClear}
            </button>
          </div>
          <p className="helper">
            {copy.dropHelper}
          </p>
          </div>

          <div className="panel queue-summary">
            <div className="panel__title">
              <h2>{copy.queueSummaryTitle}</h2>
            </div>
            <div className="chips" aria-label="Queue summary">
              <span className="chip">
                <span className="dot dot--muted" /> {copy.queueTotal} <b>{summary.total}</b>
              </span>
              <span className="chip">
                <span className="dot dot--warn" /> {copy.queuePending} <b>{summary.pending}</b>
              </span>
              <span className="chip">
                <span className="dot dot--ok" /> {copy.queueDone} <b>{summary.done}</b>
              </span>
              <span className="chip">
                <span className="dot dot--bad" /> {copy.queueErrors} <b>{summary.errors}</b>
              </span>
            </div>

            <div className="progress">
              <div className="progress__bar" style={{ width: `${progress.pct}%` }} />
            </div>
            <div className="progress__meta">
              <span>{progress.pct}%</span>
              <span>
                {progress.completed}/{progress.total || 0} {copy.progressProcessed}
              </span>
            </div>
          </div>

          {!jobs.length ? (
            <div className="empty">
              <div className="empty__card">
                <p className="empty__title">{copy.emptyTitle}</p>
                <p className="empty__subtitle">{copy.emptySubtitle}</p>
              </div>
            </div>
          ) : (
            <QueueList
              jobs={jobs}
              getOutputName={getOutputName}
              onRemove={handleRemove}
              copy={copy}
            />
          )}
        </section>

        <section className="right-stack">
          <SettingsPanel
            settings={settings}
            onChange={setSettings}
            webpSupported={webpSupported}
            onReset={() => setSettings(DEFAULT_SETTINGS)}
            copy={copy}
          />
        </section>
      </main>
      <footer className="app__footer">
        <a
          className="footer__link"
          href="https://williamalmeida.dev"
          target="_blank"
          rel="noreferrer"
        >
          {copy.footer}
        </a>
      </footer>
    </div>
  );
}
