"use client";

import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { useState } from "react";
import type { CatalogUploadResult } from "@/lib/catalog";

export function CatalogUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<CatalogUploadResult | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const uploadCsv = async (): Promise<void> => {
    if (!file || isUploading) {
      return;
    }

    setIsUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/catalog/upload", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as CatalogUploadResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Upload failed.");
      }

      setResult(payload);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="paper-panel rounded-2xl p-6 sm:p-9">
      <label
        htmlFor="catalog-upload"
        className="filter-surface flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line px-5 py-10 text-center"
      >
        <UploadCloud className="text-primary" size={32} />
        <span className="mt-3 text-lg font-semibold">
          {file ? file.name : "Choose CSV file"}
        </span>
        <span className="mt-1 text-sm text-text-muted">
          CSV uploads are additive by SKU.
        </span>
      </label>
      <input
        id="catalog-upload"
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={!file || isUploading}
          onClick={uploadCsv}
          className="btn-primary-watercolor inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          {isUploading ? <Loader2 className="animate-spin" size={16} /> : <UploadCloud size={16} />}
          {isUploading ? "Uploading..." : "Upload CSV"}
        </button>
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </div>

      {result ? (
        <div className="license-banner mt-6 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 text-primary" size={20} />
            <div>
              <p className="font-semibold">Import complete</p>
              <p className="mt-1 text-sm text-text-muted">
                Added {result.inserted} new records, skipped {result.skipped} duplicate SKUs, and now have {result.totalCatalogItems} total records.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
