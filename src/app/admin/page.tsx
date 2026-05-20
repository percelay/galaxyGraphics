import { UploadCloud } from "lucide-react";
import { getCatalogItems } from "@/lib/catalog";
import { CatalogUploadForm } from "./upload-form";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const catalogItems = await getCatalogItems();
  const latestImport = catalogItems
    .map((item) => item.importedAt)
    .sort()
    .at(-1);

  return (
    <main className="watercolor-shell min-h-screen px-5 py-8 text-text-main sm:px-8">
      <section className="mx-auto w-full max-w-5xl space-y-6">
        <div className="paper-panel rounded-2xl p-6 sm:p-9">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="eyebrow">Admin</p>
              <h1 className="section-title mt-3">Catalog Upload</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                Upload the master CSV here. New SKUs are added, existing SKUs are skipped, and blank fields stay blank.
              </p>
            </div>
            <div className="feature-tile rounded-2xl p-5">
              <UploadCloud className="text-primary" size={22} />
              <p className="mt-3 text-3xl font-semibold">{catalogItems.length}</p>
              <p className="text-sm text-text-muted">catalog records</p>
            </div>
          </div>
        </div>

        <CatalogUploadForm />

        <div className="paper-panel rounded-2xl p-6 sm:p-9">
          <h2 className="text-3xl">Current Import</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <div className="filter-surface rounded-xl p-4">
              <p className="text-sm text-text-muted">Total records</p>
              <p className="mt-1 text-2xl font-semibold">{catalogItems.length}</p>
            </div>
            <div className="filter-surface rounded-xl p-4">
              <p className="text-sm text-text-muted">Latest import</p>
              <p className="mt-1 text-sm font-semibold">
                {latestImport ? new Date(latestImport).toLocaleString() : "No uploads yet"}
              </p>
            </div>
            <div className="filter-surface rounded-xl p-4">
              <p className="text-sm text-text-muted">Unique key</p>
              <p className="mt-1 text-2xl font-semibold">SKU</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
