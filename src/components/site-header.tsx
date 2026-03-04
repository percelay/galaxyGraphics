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
    <header className="sticky top-0 z-40 border-b border-black/5 bg-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-4 sm:px-8 md:flex-row md:items-center md:justify-between md:gap-6">
        <a
          href="#hero"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide transition-colors hover:text-primary"
        >
          <Sparkles size={16} />
          <span>{brand}</span>
        </a>

        <nav className="flex w-full items-center gap-4 overflow-x-auto text-xs text-text-muted sm:text-sm md:w-auto md:gap-6">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="whitespace-nowrap transition-colors hover:text-text-main"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
