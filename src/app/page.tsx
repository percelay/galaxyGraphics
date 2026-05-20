import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { PageShell } from "@/components/page-shell";
import { getSiteContent } from "@/lib/content";

export default function Home() {
  const content = getSiteContent();

  return (
    <PageShell>
      <main className="relative z-10 mx-auto w-full max-w-6xl space-y-16 px-5 pb-12 pt-8 sm:px-8 sm:pt-10">
        <section
          id="hero"
          className="paper-panel scroll-mt-32 rounded-2xl p-6 sm:p-9 lg:p-12"
        >
          <div className="grid items-center gap-9 lg:grid-cols-[1.06fr_1fr] lg:gap-12">
            <div className="space-y-6">
              <p className="eyebrow">
                {content.tagline}
              </p>
              <h1 className="hero-title">
                {content.hero.headline}
              </h1>
              <p className="hero-copy">
                {content.hero.subheadline}
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href="/gallery"
                  className="btn-primary-watercolor inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold"
                >
                  {content.hero.primaryCta}
                  <ArrowRight size={16} />
                </a>
                <a
                  href="/contact"
                  className="btn-secondary-watercolor inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold"
                >
                  {content.hero.secondaryCta}
                </a>
              </div>
            </div>

            <div className="hero-image-shell relative overflow-hidden rounded-2xl">
              <Image
                src={content.hero.image}
                alt="Watercolor-inspired gallery hero artwork"
                width={1600}
                height={1200}
                priority
                className="h-full min-h-[340px] w-full object-cover object-center"
              />
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
