import { Sparkles } from "lucide-react";

type SiteHeaderProps = {
  brand: string;
};

const navItems = [
  { label: "Hero", href: "#hero" },
  { label: "About/Licensing", href: "#about" },
  { label: "Gallery", href: "#gallery" },
  { label: "Contact", href: "#contact" }
];

export function SiteHeader({ brand }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-50 px-5 pt-4 sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="site-nav-shell flex flex-col gap-3 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 md:flex-row md:items-center md:justify-between md:gap-8">
          <a
            href="#hero"
            className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide text-text-main"
          >
            <Sparkles size={16} className="text-primary" />
            <span className="brand-wordmark">{brand}</span>
          </a>

          <nav className="flex w-full items-center gap-4 overflow-x-auto text-xs sm:text-sm md:w-auto md:gap-7">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="site-nav-link whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
