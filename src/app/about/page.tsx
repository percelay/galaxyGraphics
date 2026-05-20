import { Palette, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { getSiteContent } from "@/lib/content";

export default function AboutPage() {
  const content = getSiteContent();

  return (
    <PageShell>
      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pt-10">
        <section className="paper-panel rounded-2xl p-6 sm:p-9">
          <div className="grid gap-9 lg:grid-cols-[1fr_1fr] lg:gap-10">
            <div className="space-y-4">
              <p className="eyebrow">About / Licensing</p>
              <h1 className="section-title">Business-ready art direction</h1>
              {content.about.map((paragraph, index) => (
                <p
                  key={`about-${index}`}
                  className="text-base leading-relaxed text-text-muted"
                >
                  {paragraph}
                </p>
              ))}
              {content.licensing.map((paragraph, index) => (
                <p
                  key={`licensing-${index}`}
                  className="text-base leading-relaxed text-text-muted"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="feature-tile rounded-2xl p-6">
                <Palette className="text-primary" size={22} />
                <h2 className="mt-4 text-2xl">Fine Art Aesthetic</h2>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  Elegant visual language with watercolor influence and clean modern structure.
                </p>
              </article>

              <article className="feature-tile rounded-2xl p-6">
                <ShieldCheck className="text-primary" size={22} />
                <h2 className="mt-4 text-2xl">Clear Licensing</h2>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  Usage-ready terms to simplify approvals across marketing, product, and print teams.
                </p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
