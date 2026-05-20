import { ArrowRight, Mail, Palette, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { CatalogSearchSection } from "@/components/catalog-search-section";
import { GallerySection } from "@/components/gallery-section";
import { SiteHeader } from "@/components/site-header";
import { getCatalogItems, searchCatalogItems } from "@/lib/catalog";
import { getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = getSiteContent();
  const catalogItems = await getCatalogItems();
  const initialCatalogResult =
    catalogItems.length > 0
      ? await searchCatalogItems({ limit: 60 })
      : null;
  const licensingText = content.licensing.join(" ");

  return (
    <div className="watercolor-shell min-h-screen text-text-main">
      <SiteHeader brand={content.name} />

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
                  href="#gallery"
                  className="btn-primary-watercolor inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold"
                >
                  {content.hero.primaryCta}
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#contact"
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

        <section
          id="about"
          className="paper-panel scroll-mt-32 rounded-2xl p-6 sm:p-9"
        >
          <div className="grid gap-9 lg:grid-cols-[1fr_1fr] lg:gap-10">
            <div className="space-y-4">
              <p className="eyebrow">
                About / Licensing
              </p>
              <h2 className="section-title">Business-ready art direction</h2>
              {content.about.map((paragraph, index) => (
                <p key={`about-${index}`} className="text-base leading-relaxed text-text-muted">
                  {paragraph}
                </p>
              ))}
              {content.licensing.map((paragraph, index) => (
                <p key={`licensing-${index}`} className="text-base leading-relaxed text-text-muted">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <article className="feature-tile rounded-2xl p-6">
                <Palette className="text-primary" size={22} />
                <h3 className="mt-4 text-2xl">Fine Art Aesthetic</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  Elegant visual language with watercolor influence and clean modern structure.
                </p>
              </article>

              <article className="feature-tile rounded-2xl p-6">
                <ShieldCheck className="text-primary" size={22} />
                <h3 className="mt-4 text-2xl">Clear Licensing</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  Usage-ready terms to simplify approvals across marketing, product, and print teams.
                </p>
              </article>
            </div>
          </div>
        </section>

        {initialCatalogResult ? (
          <CatalogSearchSection initialResult={initialCatalogResult} />
        ) : (
          <GallerySection
            intro={content.galleryIntro}
            licensingText={licensingText}
            brandName={content.name}
            artworks={content.artworks}
          />
        )}

        <section
          id="contact"
          className="paper-panel scroll-mt-32 rounded-2xl p-6 sm:p-9"
        >
          <p className="eyebrow">
            Contact
          </p>
          <h2 className="section-title mt-3">Start your curated selection</h2>
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

      <footer className="footer-shell mt-8 py-7">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 text-sm text-text-muted sm:px-8">
          <p>{content.name}</p>
          <a href={`mailto:${content.contactEmail}`} className="site-nav-link">
            {content.contactEmail}
          </a>
        </div>
      </footer>
    </div>
  );
}
