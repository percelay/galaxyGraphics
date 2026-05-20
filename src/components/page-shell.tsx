import type { ReactNode } from "react";
import { getSiteContent } from "@/lib/content";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

type PageShellProps = {
  children: ReactNode;
};

export function PageShell({ children }: PageShellProps) {
  const content = getSiteContent();

  return (
    <div className="watercolor-shell min-h-screen text-text-main">
      <SiteHeader brand={content.name} />
      {children}
      <SiteFooter brand={content.name} contactEmail={content.contactEmail} />
    </div>
  );
}
