"use client";

import { Check, FileDown, Plus, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { Artwork } from "@/lib/content";
import { exportGalleryPdf } from "@/lib/pdf-export";

type GallerySectionProps = {
  intro: string;
  licensingText: string;
  brandName: string;
  artworks: Artwork[];
};

type FilterState = {
  author: string;
  title: string;
  year: string;
  color: string;
  dimensions: string;
};

const initialFilters: FilterState = {
  author: "",
  title: "",
  year: "",
  color: "",
  dimensions: ""
};

const inputClassName =
  "filter-input w-full rounded-xl px-3 py-2 text-sm outline-none";

const toUniqueSorted = (values: string[]): string[] =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b));

export function GallerySection({
  intro,
  licensingText,
  brandName,
  artworks
}: GallerySectionProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const options = useMemo(
    () => ({
      authors: toUniqueSorted(artworks.map((art) => art.author)),
      years: toUniqueSorted(artworks.map((art) => art.year.toString())),
      colors: toUniqueSorted(artworks.map((art) => art.color)),
      dimensions: toUniqueSorted(artworks.map((art) => art.dimensions))
    }),
    [artworks]
  );

  const filteredArtworks = useMemo(() => {
    const titleFilter = filters.title.trim().toLowerCase();

    return artworks.filter((artwork) => {
      if (filters.author && artwork.author !== filters.author) {
        return false;
      }
      if (titleFilter && !artwork.title.toLowerCase().includes(titleFilter)) {
        return false;
      }
      if (filters.year && artwork.year.toString() !== filters.year) {
        return false;
      }
      if (filters.color && artwork.color !== filters.color) {
        return false;
      }
      if (filters.dimensions && artwork.dimensions !== filters.dimensions) {
        return false;
      }
      return true;
    });
  }, [artworks, filters]);

  const selectedArtworks = useMemo(
    () => artworks.filter((artwork) => selectedIds.has(artwork.id)),
    [artworks, selectedIds]
  );

  const toggleArtworkSelection = (id: string): void => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const exportSelectedAsPdf = async (): Promise<void> => {
    if (selectedArtworks.length === 0 || isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      await exportGalleryPdf({
        artworks: selectedArtworks,
        licensingText,
        brandName
      });
    } catch (error) {
      console.error("Failed to export gallery PDF", error);
      window.alert("Unable to export PDF right now. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section id="gallery" className="scroll-mt-32">
      <div className="paper-panel rounded-2xl p-6 sm:p-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="eyebrow">
              Gallery
            </p>
            <h2 className="section-title">Curated Collection</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
              {intro}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="btn-secondary-watercolor inline-flex w-fit items-center gap-2 px-3 py-2 text-sm font-semibold"
          >
            <SlidersHorizontal size={16} />
            Custom Filter
          </button>
        </div>

        <p className="license-banner mt-6 rounded-xl p-4 text-sm text-text-main">
          <span className="font-semibold">Licensing:</span> {licensingText}
        </p>

        {showFilters ? (
          <div className="filter-surface mt-6 grid gap-3 rounded-xl p-4 sm:grid-cols-2 lg:grid-cols-5">
            <select
              value={filters.author}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, author: event.target.value }))
              }
              className={inputClassName}
            >
              <option value="">Author</option>
              {options.authors.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>

            <input
              type="search"
              value={filters.title}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, title: event.target.value }))
              }
              placeholder="Title"
              className={inputClassName}
            />

            <select
              value={filters.year}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, year: event.target.value }))
              }
              className={inputClassName}
            >
              <option value="">Year</option>
              {options.years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={filters.color}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, color: event.target.value }))
              }
              className={inputClassName}
            >
              <option value="">Color</option>
              {options.colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>

            <select
              value={filters.dimensions}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, dimensions: event.target.value }))
              }
              className={inputClassName}
            >
              <option value="">Dimensions</option>
              {options.dimensions.map((dimensions) => (
                <option key={dimensions} value={dimensions}>
                  {dimensions}
                </option>
              ))}
            </select>

            <div className="sm:col-span-2 lg:col-span-5">
              <button
                type="button"
                onClick={() => setFilters(initialFilters)}
                className="btn-secondary-watercolor rounded-xl px-3 py-2 text-sm font-semibold"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArtworks.map((artwork) => {
            const isSelected = selectedIds.has(artwork.id);

            return (
              <article
                key={artwork.id}
                className="artwork-card overflow-hidden rounded-2xl"
              >
                <img
                  src={artwork.image}
                  alt={artwork.title}
                  className="artwork-image h-52 w-full object-cover"
                  loading="lazy"
                />

                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="text-2xl">{artwork.title}</h3>
                    <p className="text-sm tracking-wide text-text-muted">
                      {artwork.author} • {artwork.year}
                    </p>
                  </div>

                  <p className="text-sm tracking-wide text-text-muted">
                    {artwork.color} • {artwork.dimensions}
                  </p>

                  <button
                    type="button"
                    onClick={() => toggleArtworkSelection(artwork.id)}
                    className={`inline-flex w-full items-center justify-center gap-2 px-3 py-2 text-sm font-semibold ${
                      isSelected
                        ? "btn-primary-watercolor"
                        : "btn-secondary-watercolor hover:text-primary"
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

        {filteredArtworks.length === 0 ? (
          <p className="mt-6 text-sm tracking-wide text-text-muted">
            No artworks match the current filters.
          </p>
        ) : null}

        <div className="gallery-sticky-bar sticky bottom-4 z-20 mt-8 rounded-2xl p-4 text-white">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm tracking-wide text-white/85">
              Selected artworks: <span className="font-semibold">{selectedArtworks.length}</span>
            </p>
            <button
              type="button"
              disabled={selectedArtworks.length === 0 || isExporting}
              onClick={exportSelectedAsPdf}
              className="btn-primary-watercolor inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              <FileDown size={16} />
              {isExporting ? "Preparing PDF..." : "Export Selected PDF"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
