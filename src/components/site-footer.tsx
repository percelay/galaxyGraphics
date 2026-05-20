type SiteFooterProps = {
  brand: string;
  contactEmail: string;
};

export function SiteFooter({ brand, contactEmail }: SiteFooterProps) {
  return (
    <footer className="footer-shell mt-14 py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-5 text-sm text-text-muted sm:px-8 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <div className="max-w-md">
          <p className="text-base font-bold tracking-wide text-text-main">
            {brand}
          </p>
          <p className="mt-3 leading-relaxed">
            Licensed artwork and print imagery for retailers, product manufacturers,
            hospitality teams, and brand partners.
          </p>
        </div>

        <div>
          <p className="font-semibold text-text-main">Explore</p>
          <nav className="mt-3 grid gap-2">
            <a href="/gallery" className="site-nav-link w-fit">Gallery</a>
            <a href="/about" className="site-nav-link w-fit">About/Licensing</a>
            <a href="/contact" className="site-nav-link w-fit">Contact</a>
          </nav>
        </div>

        <div>
          <p className="font-semibold text-text-main">Contact</p>
          <a href={`mailto:${contactEmail}`} className="site-nav-link mt-3 inline-block">
            {contactEmail}
          </a>
          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-primary">
            Image Licensing
          </p>
        </div>
      </div>
    </footer>
  );
}
