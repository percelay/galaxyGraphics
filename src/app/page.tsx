import { ArrowRight, Mail, Palette, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { GallerySection } from "@/components/gallery-section";
import { SiteHeader } from "@/components/site-header";
import { getSiteContent } from "@/lib/content";

export default function Home() {
  const content = getSiteContent();
  const licensingText = content.licensing.join(" ");

  return (
    <div className="min-h-screen bg-bg text-text-main">
      <SiteHeader brand={content.name} />

      <main className="mx-auto w-full max-w-6xl space-y-14 px-5 py-10 sm:px-8">
        <section
          id="hero"
          className="scroll-mt-28 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm sm:p-8 lg:p-10"
        >
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_1fr]">
            <div className="space-y-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                {content.tagline}
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl">
                {content.hero.headline}
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-text-muted sm:text-lg">
                {content.hero.subheadline}
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <a
                  href="#gallery"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-1 hover:shadow-sm"
                >
                  {content.hero.primaryCta}
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold transition hover:-translate-y-1 hover:border-primary hover:text-primary hover:shadow-sm"
                >
                  {content.hero.secondaryCta}
                </a>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl shadow-md">
              <Image
                src={content.hero.image}
                alt="Watercolor-inspired gallery hero artwork"
                width={1600}
                height={1200}
                priority
                className="h-full min-h-[320px] w-full object-cover"
              />
            </div>
          </div>
        </section>

        <section
          id="about"
          className="scroll-mt-28 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
                About / Licensing
              </p>
              <h2 className="text-3xl">Business-ready art direction</h2>
              {content.about.map((paragraph, index) => (
                <p key={`about-${index}`} className="text-text-muted">
                  {paragraph}
                </p>
              ))}
              {content.licensing.map((paragraph, index) => (
                <p key={`licensing-${index}`} className="text-text-muted">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-xl border border-black/5 bg-surface p-5 shadow-sm">
                <Palette className="text-primary" size={22} />
                <h3 className="mt-3 text-xl">Fine Art Aesthetic</h3>
                <p className="mt-2 text-sm text-text-muted">
                  Elegant visual language with watercolor influence and clean modern structure.
                </p>
              </article>

              <article className="rounded-xl border border-black/5 bg-surface p-5 shadow-sm">
                <ShieldCheck className="text-primary" size={22} />
                <h3 className="mt-3 text-xl">Clear Licensing</h3>
                <p className="mt-2 text-sm text-text-muted">
                  Usage-ready terms to simplify approvals across marketing, product, and print teams.
                </p>
              </article>
            </div>
          </div>
        </section>

        <GallerySection
          intro={content.galleryIntro}
          licensingText={licensingText}
          brandName={content.name}
          artworks={content.artworks}
        />

        <section
          id="contact"
          className="scroll-mt-28 rounded-2xl border border-black/5 bg-surface p-6 shadow-sm sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
            Contact
          </p>
          <h2 className="mt-2 text-3xl">Start your curated selection</h2>
          <p className="mt-3 max-w-2xl text-text-muted">
            Share your campaign goals and we will prepare a licensing-ready visual set tailored to your team.
          </p>
          <a
            href={`mailto:${content.contactEmail}`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium transition hover:-translate-y-1 hover:border-primary hover:text-primary hover:shadow-sm"
          >
            <Mail size={16} />
            {content.contactEmail}
          </a>
        </section>
      </main>

      <footer className="border-t border-black/5 py-6">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 text-sm text-text-muted sm:px-8">
          <p>{content.name}</p>
          <a href={`mailto:${content.contactEmail}`} className="transition hover:text-primary">
            {content.contactEmail}
          </a>
        </div>
      </footer>
    </div>
  );
}
