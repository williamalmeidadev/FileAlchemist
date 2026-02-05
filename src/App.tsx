import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Dropzone from "./components/Dropzone";
import QueueList from "./components/QueueList";
import SettingsPanel from "./components/SettingsPanel";
import { createId } from "./lib/id";
import { isSupportedInput } from "./lib/image/formats";
import { detectWebpSupport } from "./lib/image/support";
import { applyTheme, getInitialTheme, persistTheme, type ThemeMode } from "./lib/theme";
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
              outputFormat: settingsRef.current.outputFormat,
              error: undefined,
            }
          : job
      )
    );

    worker.postMessage({
      id: nextJob.id,
      file: nextJob.file,
      settings: settingsRef.current,
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

  const doneJobs = useMemo(
    () => jobs.filter((job) => job.status === "done" && job.result),
    [jobs]
  );

  const getOutputName = (job: JobItem): string => {
    const format = job.outputFormat ?? settings.outputFormat;
    const extension = format === "jpeg" ? "jpg" : format;
    const baseName = job.file.name.replace(/\.[^.]+$/, "");
    return `${baseName}.${extension}`;
  };

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <p className="eyebrow">Private image converter</p>
          <h1>FileAlchemist</h1>
          <p>Convert images locally. No uploads, no servers.</p>
        </div>
        <div className="header__right">
          <div className="summary">
            <span>Total: {summary.total}</span>
            <span>Pending: {summary.pending}</span>
            <span>Done: {summary.done}</span>
            <span>Errors: {summary.errors}</span>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "Light theme" : "Dark theme"}
          </button>
        </div>
      </header>

      <main className="app__main">
        <section className="panel">
          <h2>Drop files</h2>
          <Dropzone onFilesAdded={handleFilesAdded} accept={ACCEPT} />
          <div className="panel__actions">
            <button
              type="button"
              className="btn"
              onClick={handleConvert}
              disabled={!jobs.length || isConverting}
            >
              Convert
            </button>
            <button type="button" className="btn btn--ghost" onClick={handleClear}>
              Clear
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={handleDownloadZip}
              disabled={!doneJobs.length || isZipping}
            >
              Download ZIP
            </button>
          </div>
          <p className="helper">
            Supported: PNG, JPG/JPEG, WebP. Processing stays on your device.
          </p>
        </section>

        <SettingsPanel
          settings={settings}
          onChange={setSettings}
          webpSupported={webpSupported}
        />

        <QueueList jobs={jobs} getOutputName={getOutputName} />
      </main>
    </div>
  );
}
