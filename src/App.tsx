export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1>FileAlchemist</h1>
        <p>Client-side image converter. No uploads, no servers.</p>
      </header>
      <main className="app__main">
        <section className="panel">
          <h2>Drop files</h2>
          <p>PNG, JPG/JPEG, WebP. Batch conversion coming next.</p>
          <button type="button" className="btn" disabled>
            Select files
          </button>
        </section>
        <section className="panel">
          <h2>Settings</h2>
          <p>Format, quality, resize. UI coming next.</p>
        </section>
        <section className="panel">
          <h2>Queue</h2>
          <p>Pending, processing, done.</p>
        </section>
      </main>
    </div>
  );
}
