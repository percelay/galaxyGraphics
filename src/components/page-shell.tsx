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
    <div className="watercolor-shell flex min-h-screen flex-col text-text-main">
      <SiteHeader brand={content.name} />
      <div className="flex-1">{children}</div>
      <SiteFooter brand={content.name} contactEmail={content.contactEmail} />
    </div>
  );
}
