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
      className={`dropzone ${isDragging ? "dropzone--active" : ""}`}
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
        className="dropzone__input"
      />
      <div className="dropzone__content">
        <p className="dropzone__title">{title}</p>
        <p className="dropzone__subtitle">{subtitle}</p>
      </div>
    </div>
  );
}
