import type { ConvertSettings, OutputFormat } from "../types/image";
import { MAX_DIMENSION } from "../lib/image/resize";

interface SettingsPanelProps {
  settings: ConvertSettings;
  onChange: (settings: ConvertSettings) => void;
  webpSupported: boolean;
  onReset: () => void;
  copy: {
    settingsTitle: string;
    outputFormat: string;
    quality: string;
    jpegBackground: string;
    width: string;
    height: string;
    maxDimension: string;
    resetSettings: string;
  };
}

const OUTPUT_OPTIONS: { value: OutputFormat; label: string }[] = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WebP" },
];

const formatNumber = (value: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export default function SettingsPanel({
  settings,
  onChange,
  webpSupported,
  onReset,
  copy,
}: SettingsPanelProps) {
  const quality = Math.round((settings.quality ?? 0.92) * 100);

  return (
    <section className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-soft)]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{copy.settingsTitle}</h2>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--text)] transition hover:-translate-y-0.5"
          onClick={onReset}
        >
          {copy.resetSettings}
        </button>
      </div>
      <div className="grid gap-2 text-sm">
        <label htmlFor="output-format">{copy.outputFormat}</label>
        <select
          id="output-format"
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
          value={settings.outputFormat}
          onChange={(event) =>
            onChange({
              ...settings,
              outputFormat: event.target.value as OutputFormat,
            })
          }
        >
          {OUTPUT_OPTIONS.filter(
            (option) => option.value !== "webp" || webpSupported
          ).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {(settings.outputFormat === "jpeg" || settings.outputFormat === "webp") && (
        <div className="grid gap-2 text-sm">
          <label htmlFor="quality">
            {copy.quality} ({quality}%)
          </label>
          <input
            id="quality"
            type="range"
            min={0}
            max={100}
            value={quality}
            className="range-input"
            onChange={(event) =>
              onChange({
                ...settings,
                quality: Number(event.target.value) / 100,
              })
            }
          />
        </div>
      )}

      {settings.outputFormat === "jpeg" && (
        <div className="grid gap-2 text-sm">
          <label htmlFor="background">{copy.jpegBackground}</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="background"
              type="color"
              className="h-10 w-16 cursor-pointer rounded-lg border border-[var(--border)] bg-transparent"
              value={settings.background ?? "#ffffff"}
              onChange={(event) =>
                onChange({
                  ...settings,
                  background: event.target.value,
                })
              }
            />
            <span
              className="h-6 w-6 rounded-md border border-[var(--border)]"
              style={{ backgroundColor: settings.background ?? "#ffffff" }}
              aria-hidden="true"
            />
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2 text-sm">
          <label htmlFor="resize-width">{copy.width}</label>
          <input
            id="resize-width"
            type="number"
            min={1}
            placeholder="Auto"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            value={settings.resize?.width ?? ""}
            onChange={(event) =>
              onChange({
                ...settings,
                resize: {
                  ...settings.resize,
                  width: formatNumber(event.target.value),
                },
              })
            }
          />
        </div>
        <div className="grid gap-2 text-sm">
          <label htmlFor="resize-height">{copy.height}</label>
          <input
            id="resize-height"
            type="number"
            min={1}
            placeholder="Auto"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
            value={settings.resize?.height ?? ""}
            onChange={(event) =>
              onChange({
                ...settings,
                resize: {
                  ...settings.resize,
                  height: formatNumber(event.target.value),
                },
              })
            }
          />
        </div>
      </div>

      <div className="grid gap-2 text-sm">
        <label htmlFor="max-dimension">{copy.maxDimension}</label>
        <input
          id="max-dimension"
          type="number"
          min={1}
          max={MAX_DIMENSION}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
          value={settings.resize?.maxDimension ?? MAX_DIMENSION}
          onChange={(event) =>
            onChange({
              ...settings,
              resize: {
                ...settings.resize,
                maxDimension: formatNumber(event.target.value) ?? MAX_DIMENSION,
              },
            })
          }
        />
      </div>
    </section>
  );
}
