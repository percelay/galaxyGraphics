"use client";

export default function GlobalError() {
  return (
    <html lang="en">
      <body>
        <main className="watercolor-shell flex min-h-screen items-center justify-center px-5 text-text-main">
          <section className="paper-panel max-w-xl rounded-2xl p-8 text-center">
            <p className="eyebrow">Galaxy Graphics</p>
            <h1 className="section-title mt-3">Something went wrong</h1>
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              Refresh the page and try again.
            </p>
          </section>
        </main>
      </body>
    </html>
  );
}
