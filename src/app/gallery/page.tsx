import { CatalogSearchSection } from "@/components/catalog-search-section";
import { GallerySection } from "@/components/gallery-section";
import { PageShell } from "@/components/page-shell";
import { getCatalogItems, searchCatalogItems } from "@/lib/catalog";
import { getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const content = getSiteContent();
  const catalogItems = await getCatalogItems();
  const initialCatalogResult =
    catalogItems.length > 0
      ? await searchCatalogItems({ limit: 60 })
      : null;
  const licensingText = content.licensing.join(" ");

  return (
    <PageShell>
      <main className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-12 pt-8 sm:px-8 sm:pt-10">
        {initialCatalogResult ? (
          <CatalogSearchSection
            initialResult={initialCatalogResult}
            brandName={content.name}
          />
        ) : (
          <GallerySection
            intro={content.galleryIntro}
            licensingText={licensingText}
            brandName={content.name}
            artworks={content.artworks}
          />
        )}
      </main>
    </PageShell>
  );
}
