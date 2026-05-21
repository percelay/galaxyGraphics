import { ArrowRight, Building2, ImageIcon, Store } from "lucide-react";
import Image from "next/image";
import { PageShell } from "@/components/page-shell";
import { getSiteContent } from "@/lib/content";

const trustedRetailers = [
  { name: "Target", logo: "/trusted/target.png" },
  { name: "Walmart", logo: "/trusted/walmart.png" },
  { name: "CVS", logo: "/trusted/cvs.png" },
  { name: "Big Lots", logo: "/trusted/big-lots.png" },
  { name: "Dollar Tree", logo: "/trusted/dollar-tree.png" },
  { name: "Dollar General", logo: "/trusted/dollar-general.png" },
];

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

        <section
          aria-labelledby="trusted-retailers"
          className="paper-panel rounded-2xl p-5 sm:p-7"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow" id="trusted-retailers">
                Trusted By
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Retail artwork programs for national shelves.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
                Galaxy Graphics artwork has supported print collections for major retailers including Target, Walmart, CVS, Big Lots, Dollar Tree, and Dollar General.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:w-[34rem]">
              {trustedRetailers.map((retailer) => (
                <div
                  className="flex h-24 items-center justify-center rounded-xl border border-line bg-white px-5 shadow-[0_10px_24px_rgb(20_70_118_/_0.06)]"
                  key={retailer.name}
                >
                  <Image
                    src={retailer.logo}
                    alt={`${retailer.name} logo`}
                    width={180}
                    height={80}
                    className="max-h-14 w-full object-contain"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          <article className="feature-tile rounded-2xl p-6">
            <Store className="text-primary" size={24} />
            <h2 className="mt-4 text-2xl font-bold">Retail Programs</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              Galaxy Graphics licenses print-ready artwork for major retail and consumer product programs.
            </p>
          </article>

          <article className="feature-tile rounded-2xl p-6">
            <ImageIcon className="text-primary" size={24} />
            <h2 className="mt-4 text-2xl font-bold">Large Image Library</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              Buyers can search a broad catalog by artist, style, color, orientation, and subject matter.
            </p>
          </article>

          <article className="feature-tile rounded-2xl p-6">
            <Building2 className="text-primary" size={24} />
            <h2 className="mt-4 text-2xl font-bold">Licensing Support</h2>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              The collection supports manufacturers, hospitality groups, and brands sourcing art for products and spaces.
            </p>
          </article>
        </section>
      </main>
    </PageShell>
  );
}
