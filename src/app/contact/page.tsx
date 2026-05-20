import { Mail } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { getSiteContent } from "@/lib/content";

export default function ContactPage() {
  const content = getSiteContent();

  return (
    <PageShell>
      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pt-10">
        <section className="paper-panel rounded-2xl p-6 sm:p-9">
          <p className="eyebrow">Contact</p>
          <h1 className="section-title mt-3">Start your curated selection</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted">
            Share your campaign goals and we will prepare a licensing-ready visual set tailored to your team.
          </p>
          <a
            href={`mailto:${content.contactEmail}`}
            className="btn-secondary-watercolor mt-6 inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold"
          >
            <Mail size={16} />
            {content.contactEmail}
          </a>
        </section>
      </main>
    </PageShell>
  );
}
