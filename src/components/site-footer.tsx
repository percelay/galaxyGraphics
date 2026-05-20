type SiteFooterProps = {
  brand: string;
  contactEmail: string;
};

export function SiteFooter({ brand, contactEmail }: SiteFooterProps) {
  return (
    <footer className="footer-shell mt-8 py-7">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 text-sm text-text-muted sm:px-8">
        <p>{brand}</p>
        <a href={`mailto:${contactEmail}`} className="site-nav-link">
          {contactEmail}
        </a>
      </div>
    </footer>
  );
}
