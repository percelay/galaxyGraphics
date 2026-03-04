"use client";

import { Check, FileDown, Plus, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import type { Artwork } from "@/lib/content";

type GallerySectionProps = {
  intro: string;
  licensingText: string;
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
  "w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toUniqueSorted = (values: string[]): string[] =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b));

export function GallerySection({
  intro,
  licensingText,
  artworks
}: GallerySectionProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const exportSelectedAsPdf = (): void => {
    if (selectedArtworks.length === 0) {
      return;
    }

    const printWindow = window.open(
      "",
      "_blank",
      "noopener,noreferrer,width=1200,height=900"
    );

    if (!printWindow) {
      return;
    }

    const cards = selectedArtworks
      .map((artwork) => {
        const imageUrl = artwork.image.startsWith("http")
          ? artwork.image
          : `${window.location.origin}${artwork.image}`;

        return `
          <article class="card">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(artwork.title)}" />
            <div class="meta">
              <h3>${escapeHtml(artwork.title)}</h3>
              <p>${escapeHtml(artwork.author)} • ${artwork.year}</p>
              <p>${escapeHtml(artwork.color)} • ${escapeHtml(artwork.dimensions)}</p>
            </div>
          </article>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <title>Galaxy Graphics Selection</title>
          <style>
            :root {
              color-scheme: light;
            }
            * {
              box-sizing: border-box;
            }
            body {
              margin: 0;
              font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
              color: #000;
              background: #fff;
              padding: 40px;
            }
            .brand {
              margin-bottom: 18px;
              border-bottom: 1px solid #e8e8e8;
              padding-bottom: 18px;
            }
            .brand h1 {
              margin: 0;
              font-size: 28px;
            }
            .brand p {
              margin: 8px 0 0;
              color: #525252;
              max-width: 900px;
              line-height: 1.45;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 20px;
              margin-top: 24px;
            }
            .card {
              border: 1px solid #ececec;
              border-radius: 14px;
              overflow: hidden;
              break-inside: avoid;
            }
            .card img {
              display: block;
              width: 100%;
              height: 240px;
              object-fit: cover;
            }
            .meta {
              padding: 12px 14px 14px;
            }
            .meta h3 {
              margin: 0 0 8px;
              font-size: 18px;
            }
            .meta p {
              margin: 0;
              color: #525252;
              font-size: 14px;
              line-height: 1.5;
            }
            .meta p + p {
              margin-top: 4px;
            }
            @page {
              size: A4;
              margin: 12mm;
            }
          </style>
        </head>
        <body>
          <section class="brand">
            <h1>Galaxy Graphics</h1>
            <p>${escapeHtml(licensingText)}</p>
          </section>
          <section class="grid">${cards}</section>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 350);
  };

  return (
    <section id="gallery" className="scroll-mt-28">
      <div className="rounded-2xl bg-surface p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Gallery
            </p>
            <h2 className="text-3xl">Curated Collection</h2>
            <p className="max-w-2xl text-sm text-text-muted sm:text-base">{intro}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm font-medium transition hover:-translate-y-1 hover:shadow-sm"
          >
            <SlidersHorizontal size={16} />
            Custom Filter
          </button>
        </div>

        <p className="mt-5 rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-text-main">
          <span className="font-semibold">Licensing:</span> {licensingText}
        </p>

        {showFilters ? (
          <div className="mt-5 grid gap-3 rounded-xl border border-black/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
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
                className="rounded-xl border border-black/10 px-3 py-2 text-sm transition hover:border-primary hover:text-primary"
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
                className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <img
                  src={artwork.image}
                  alt={artwork.title}
                  className="h-52 w-full object-cover"
                  loading="lazy"
                />

                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="text-xl">{artwork.title}</h3>
                    <p className="text-sm text-text-muted">
                      {artwork.author} • {artwork.year}
                    </p>
                  </div>

                  <p className="text-sm text-text-muted">
                    {artwork.color} • {artwork.dimensions}
                  </p>

                  <button
                    type="button"
                    onClick={() => toggleArtworkSelection(artwork.id)}
                    className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
                      isSelected
                        ? "border border-primary bg-primary text-white"
                        : "border border-black/10 bg-white hover:border-primary hover:text-primary"
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
          <p className="mt-6 text-sm text-text-muted">
            No artworks match the current filters.
          </p>
        ) : null}

        <div className="sticky bottom-4 z-20 mt-8 rounded-2xl bg-text-main p-4 text-white shadow-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-white/85">
              Selected artworks: <span className="font-semibold">{selectedArtworks.length}</span>
            </p>
            <button
              type="button"
              disabled={selectedArtworks.length === 0}
              onClick={exportSelectedAsPdf}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-1 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              <FileDown size={16} />
              Export Selected PDF
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
