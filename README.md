# FileAlchemist

FileAlchemist is a client-side image converter that runs entirely in the browser. Users can drop or select PNG/JPG/WebP files, pick an output format, adjust quality, optionally resize, and convert locally using the Canvas API. No uploads. No server processing. Files never leave the device.

## MVP Scope
- Input: PNG, JPG/JPEG, WebP
- Output: PNG, JPG/JPEG, WebP (runtime WebP support detection)
- Quality slider for JPG/WebP
- Optional resize
- Batch processing with a job queue
- Individual downloads and ZIP download for all
- Responsive UI, desktop-first

## Privacy
All processing happens locally in the browser. Files are kept in memory only for the current session.

## Tech Stack (MVP)
- Vite + React + TypeScript
- Tailwind CSS (or CSS Modules if kept minimal)
- Canvas + `createImageBitmap()` with fallback to `HTMLImageElement`
- Web Worker for conversion jobs
- JSZip for ZIP downloads
- Optional: `pica` for higher-quality resizing

## Development
This repo follows Gitflow-style branching:
- `main` for releases
- `develop` for integration
- `feature/*` for incremental features

## License
MIT
