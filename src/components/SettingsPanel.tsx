import type { ConvertSettings, OutputFormat } from "../types/image";
import { MAX_DIMENSION } from "../lib/image/resize";

interface SettingsPanelProps {
  settings: ConvertSettings;
  onChange: (settings: ConvertSettings) => void;
  webpSupported: boolean;
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

export default function SettingsPanel({ settings, onChange, webpSupported }: SettingsPanelProps) {
  const quality = Math.round((settings.quality ?? 0.92) * 100);

  return (
    <section className="panel">
      <h2>Settings</h2>
      <div className="field">
        <label htmlFor="output-format">Output format</label>
        <select
          id="output-format"
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
        <div className="field">
          <label htmlFor="quality">Quality ({quality}%)</label>
          <input
            id="quality"
            type="range"
            min={0}
            max={100}
            value={quality}
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
        <div className="field">
          <label htmlFor="background">JPEG background</label>
          <input
            id="background"
            type="color"
            value={settings.background ?? "#ffffff"}
            onChange={(event) =>
              onChange({
                ...settings,
                background: event.target.value,
              })
            }
          />
        </div>
      )}

      <div className="field-row">
        <div className="field">
          <label htmlFor="resize-width">Width (px)</label>
          <input
            id="resize-width"
            type="number"
            min={1}
            placeholder="Auto"
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
        <div className="field">
          <label htmlFor="resize-height">Height (px)</label>
          <input
            id="resize-height"
            type="number"
            min={1}
            placeholder="Auto"
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

      <div className="field">
        <label htmlFor="max-dimension">Max dimension (px)</label>
        <input
          id="max-dimension"
          type="number"
          min={1}
          max={MAX_DIMENSION}
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
