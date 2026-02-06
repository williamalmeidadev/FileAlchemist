import { useRef, useState, type DragEvent } from "react";

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
  accept: string;
  disabled?: boolean;
  title: string;
  subtitle: string;
}

export default function Dropzone({
  onFilesAdded,
  accept,
  disabled,
  title,
  subtitle,
}: DropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) return;
    const files = Array.from(fileList);
    if (files.length) {
      onFilesAdded(files);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  return (
    <div
      className={`grid place-items-center rounded-2xl border-2 border-dashed border-[var(--drop-border)] bg-[var(--drop-bg)] p-6 text-center transition ${
        isDragging ? "border-[var(--accent)] bg-[var(--accent-soft)]" : ""
      }`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          inputRef.current?.click();
        }
      }}
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
        className="hidden"
      />
      <div className="grid gap-1">
        <p className="text-base font-semibold text-[var(--text)]">{title}</p>
        <p className="text-sm text-[var(--muted)]">{subtitle}</p>
      </div>
    </div>
  );
}
