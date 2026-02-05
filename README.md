# FileAlchemist

FileAlchemist is a client-side image converter that runs entirely in the browser. Users can drop or select PNG/JPG/WebP files, pick an output format, adjust quality, optionally resize, and convert locally using the Canvas API. No uploads. No server processing. Files never leave the device.

## MVP Scope
- Input: PNG, JPG/JPEG, WebP
- Output: PNG, JPG/JPEG, WebP (runtime WebP support detection)
- Quality slider for JPG/WebP
- Optional resize with a max dimension cap
- Batch processing with a job queue (Web Worker)
- Individual downloads and ZIP download for all
- Responsive UI, desktop-first

## Privacy
All processing happens locally in the browser. Files are kept in memory only for the current session.

## Tech Stack
- Vite + React + TypeScript
- Canvas + `createImageBitmap()` with fallback to `HTMLImageElement`
- Web Worker for conversion jobs
- JSZip for ZIP downloads

## Development
Install and run:

```bash
npm install
npm run dev
```

Build and preview:

```bash
npm run build
npm run preview
```

Run tests:

```bash
npm run test
```

## GitHub Pages
The Vite base path is set to `/FileAlchemist/` in `vite.config.ts` for GitHub Pages. Build the project and deploy the `dist/` folder using your preferred Pages workflow.

## Branching
This repo follows Gitflow-style branching:
- `main` for releases
- `develop` for integration
- `feature/*` for incremental features

## License
MIT
