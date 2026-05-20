"use client";

import { Check, FileDown, Loader2, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { CatalogItem, CatalogSearchResult } from "@/lib/catalog";
import { exportCatalogSelectionPdf } from "@/lib/pdf-export";

type CatalogSearchSectionProps = {
  initialResult: CatalogSearchResult;
  brandName: string;
};

const pageSize = 60;

const fallbackImages = [
  "/gallery/cobalt-drift.svg",
  "/gallery/amber-geometry.svg",
  "/gallery/midnight-bloom.svg",
  "/gallery/ochre-tide.svg",
  "/gallery/rose-current.svg",
  "/gallery/coral-radius.svg",
  "/gallery/mint-topography.svg"
];

const inputClassName =
  "filter-input w-full rounded-xl px-3 py-2 text-sm outline-none";

const buildSearchUrl = (
  query: string,
  artist: string,
  color: string,
  orientation: string,
  offset: number
): string => {
  const params = new URLSearchParams({
    limit: pageSize.toString(),
    offset: offset.toString()
  });

  if (query.trim()) {
    params.set("q", query.trim());
  }
  if (artist) {
    params.set("artist", artist);
  }
  if (color) {
    params.set("color", color);
  }
  if (orientation) {
    params.set("orientation", orientation);
  }

  return `/api/catalog/search?${params.toString()}`;
};

const itemDetail = (item: CatalogItem): string =>
  [
    item.sku,
    item.artist,
    item.orientation,
    item.publishedStockSize || item.stockSizeCode,
    item.colors.slice(0, 3).join(", ")
  ]
    .filter(Boolean)
    .join(" • ");

export function CatalogSearchSection({
  initialResult,
  brandName
}: CatalogSearchSectionProps) {
  const [query, setQuery] = useState("");
  const [artist, setArtist] = useState("");
  const [color, setColor] = useState("");
  const [orientation, setOrientation] = useState("");
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState<CatalogSearchResult>(initialResult);
  const [isLoading, setIsLoading] = useState(false);
  const [previewItem, setPreviewItem] = useState<CatalogItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<CatalogItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(result.total / pageSize));
  const currentPage = Math.floor(offset / pageSize) + 1;
  const selectedSkus = useMemo(
    () => new Set(selectedItems.map((item) => item.sku)),
    [selectedItems]
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          buildSearchUrl(query, artist, color, orientation, offset),
          { signal: controller.signal }
        );
        const payload = (await response.json()) as CatalogSearchResult;
        setResult(payload);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Catalog search failed", error);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [artist, color, offset, orientation, query]);

  const resetOffset = (next: () => void): void => {
    setOffset(0);
    next();
  };

  const visibleRange = useMemo(() => {
    if (result.total === 0) {
      return "0 results";
    }

    const start = offset + 1;
    const end = Math.min(offset + result.items.length, result.total);
    return `${start}-${end} of ${result.total}`;
  }, [offset, result.items.length, result.total]);

  const toggleSelectedItem = (item: CatalogItem): void => {
    setSelectedItems((currentItems) => {
      if (currentItems.some((currentItem) => currentItem.sku === item.sku)) {
        return currentItems.filter((currentItem) => currentItem.sku !== item.sku);
      }

      return [...currentItems, item];
    });
  };

  const downloadSelection = async (): Promise<void> => {
    if (selectedItems.length === 0 || isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      await exportCatalogSelectionPdf({
        items: selectedItems,
        brandName
      });
    } catch (error) {
      console.error("Catalog PDF export failed", error);
      window.alert("Unable to export PDF right now. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section id="gallery" className="scroll-mt-32">
      <div className="paper-panel rounded-2xl p-6 sm:p-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2 className="section-title mt-2">Search the Collection</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
              Search by SKU, title, artist, category, color, orientation, or file name.
            </p>
          </div>
          <p className="filter-surface rounded-xl px-4 py-3 text-sm font-semibold text-text-muted">
            {isLoading ? "Searching..." : visibleRange}
          </p>
        </div>

        <div className="filter-surface mt-6 grid gap-3 rounded-xl p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <label className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
              size={16}
            />
            <input
              type="search"
              value={query}
              onChange={(event) =>
                resetOffset(() => setQuery(event.target.value))
              }
              placeholder="Search catalog"
              className={`${inputClassName} pl-9`}
            />
          </label>

          <select
            value={artist}
            onChange={(event) =>
              resetOffset(() => setArtist(event.target.value))
            }
            className={inputClassName}
          >
            <option value="">Artist</option>
            {result.facets.artists.map((facet) => (
              <option key={facet} value={facet}>
                {facet}
              </option>
            ))}
          </select>

          <select
            value={color}
            onChange={(event) =>
              resetOffset(() => setColor(event.target.value))
            }
            className={inputClassName}
          >
            <option value="">Color</option>
            {result.facets.colors.map((facet) => (
              <option key={facet} value={facet}>
                {facet}
              </option>
            ))}
          </select>

          <select
            value={orientation}
            onChange={(event) =>
              resetOffset(() => setOrientation(event.target.value))
            }
            className={inputClassName}
          >
            <option value="">Orientation</option>
            {result.facets.orientations.map((facet) => (
              <option key={facet} value={facet}>
                {facet}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((item, index) => {
            const isSelected = selectedSkus.has(item.sku);

            return (
              <article
                key={item.sku}
                className="artwork-card overflow-hidden rounded-2xl"
              >
                <button
                  type="button"
                  onClick={() => setPreviewItem(item)}
                  className="block w-full text-left"
                >
                  <img
                    src={
                      item.thumbnailImage ||
                      item.largeImage ||
                      fallbackImages[index % fallbackImages.length]
                    }
                    alt={item.itemName || item.sku}
                    className="artwork-image h-48 w-full object-contain bg-surface"
                    loading="lazy"
                  />
                </button>
                <div className="space-y-3 p-4">
                <div>
                  <h3 className="text-2xl">{item.itemName || "Untitled"}</h3>
                  <p className="text-sm tracking-wide text-text-muted">
                    {itemDetail(item)}
                  </p>
                </div>
                <p className="line-clamp-2 text-sm leading-relaxed text-text-muted">
                  {item.categories.slice(0, 8).join(", ") || "No categories listed"}
                </p>
                <button
                  type="button"
                  onClick={() => toggleSelectedItem(item)}
                  className={`inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-semibold ${
                    isSelected ? "btn-primary-watercolor" : "btn-secondary-watercolor"
                  }`}
                >
                  {isSelected ? <Check size={16} /> : <Plus size={16} />}
                  {isSelected ? "Added" : "Add to Gallery"}
                </button>
              </div>
            </article>
            );
          })}
        </div>

        {previewItem ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setPreviewItem(null)}
          >
            <div
              className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-surface p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <img
                src={
                  previewItem.largeImage ||
                  previewItem.thumbnailImage ||
                  fallbackImages[0]
                }
                alt={previewItem.itemName || previewItem.sku}
                className="max-h-[72vh] w-full object-contain"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-2xl">{previewItem.itemName || "Untitled"}</h3>
                  <p className="text-sm text-text-muted">{itemDetail(previewItem)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  className="btn-secondary-watercolor px-4 py-2 text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {result.items.length === 0 ? (
          <p className="mt-6 text-sm tracking-wide text-text-muted">
            No catalog records match the current search.
          </p>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            disabled={offset === 0}
            onClick={() => setOffset((value) => Math.max(0, value - pageSize))}
            className="btn-secondary-watercolor px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
          >
            Previous
          </button>
          <p className="text-sm font-semibold text-text-muted">
            Page {currentPage} of {totalPages}
          </p>
          <button
            type="button"
            disabled={offset + pageSize >= result.total}
            onClick={() => setOffset((value) => value + pageSize)}
            className="btn-secondary-watercolor px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
          >
            Next
          </button>
        </div>

        <div className="gallery-sticky-bar sticky bottom-4 z-20 mt-8 rounded-2xl p-4 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm tracking-wide text-white/85">
              Selected images: <span className="font-semibold">{selectedItems.length}</span>
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={selectedItems.length === 0}
                onClick={() => setSelectedItems([])}
                className="btn-secondary-watercolor px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={selectedItems.length === 0 || isExporting}
                onClick={downloadSelection}
                className="btn-primary-watercolor inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                {isExporting ? <Loader2 className="animate-spin" size={16} /> : <FileDown size={16} />}
                {isExporting ? "Preparing PDF..." : "Download PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
