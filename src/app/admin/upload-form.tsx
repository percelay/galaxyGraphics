"use client";

import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { useState } from "react";
import type { CatalogItem, CatalogUploadResult } from "@/lib/catalog";

const LOCAL_CATALOG_STORAGE_KEY = "galaxy-graphics-local-catalog-items";

const parseCsv = (csv: string): string[][] => {
  const rows: string[][] = [];
  let currentField = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    const nextCharacter = csv[index + 1];

    if (character === "\"") {
      if (inQuotes && nextCharacter === "\"") {
        currentField += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentField);
      if (currentRow.some((field) => field.trim())) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += character;
  }

  currentRow.push(currentField);
  if (currentRow.some((field) => field.trim())) {
    rows.push(currentRow);
  }

  return rows;
};

const compactValues = (values: string[]): string[] =>
  values.map((value) => value.trim()).filter(Boolean);

const readLocalCatalogItems = (): CatalogItem[] => {
  try {
    const stored = window.localStorage.getItem(LOCAL_CATALOG_STORAGE_KEY);
    const parsed = stored ? (JSON.parse(stored) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as CatalogItem[]) : [];
  } catch {
    return [];
  }
};

const csvToCatalogItems = (csv: string): CatalogItem[] => {
  const rows = parseCsv(csv);
  const [headers, ...dataRows] = rows;

  if (!headers) {
    return [];
  }

  const headerMap = new Map<string, number>();
  headers.forEach((header, index) => headerMap.set(header.trim(), index));
  const getValue = (row: string[], header: string): string =>
    (row[headerMap.get(header) ?? -1] ?? "").trim();
  const importedAt = new Date().toISOString();

  return dataRows
    .map((row) => {
      const sku = getValue(row, "Item Number");

      if (!sku) {
        return null;
      }

      return {
        sku,
        itemName: getValue(row, "Item Name"),
        artist: getValue(row, "Artist"),
        orientation: getValue(row, "Orientation"),
        publishedStockSize: getValue(row, "Published Stock Size"),
        stockSizeCode: getValue(row, "Stock Size Code"),
        fileName: getValue(row, "File Name"),
        groups: compactValues(
          Array.from({ length: 4 }, (_, index) =>
            getValue(row, `Group ${index + 1}`)
          )
        ),
        categories: compactValues(
          Array.from({ length: 15 }, (_, index) =>
            getValue(row, `Category ${index + 1}`)
          )
        ),
        colors: compactValues(
          Array.from({ length: 10 }, (_, index) =>
            getValue(row, `Color ${index + 1}`)
          )
        ),
        thumbnailImage: "",
        largeImage: "",
        importedAt
      };
    })
    .filter((item): item is CatalogItem => item !== null);
};

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

    const saveBrowserOnlyImport = async (): Promise<CatalogUploadResult> => {
      const csv = await file.text();
      const incomingItems = csvToCatalogItems(csv);
      const localItems = readLocalCatalogItems();
      const existingSkus = new Set(localItems.map((item) => item.sku));
      const newItems: CatalogItem[] = [];
      let skipped = 0;

      incomingItems.forEach((item) => {
        if (existingSkus.has(item.sku)) {
          skipped += 1;
          return;
        }

        existingSkus.add(item.sku);
        newItems.push(item);
      });

      const nextLocalItems = [...localItems, ...newItems];
      window.localStorage.setItem(
        LOCAL_CATALOG_STORAGE_KEY,
        JSON.stringify(nextLocalItems)
      );

      return {
        inserted: newItems.length,
        skipped,
        totalRows: incomingItems.length,
        totalCatalogItems: nextLocalItems.length,
        sampleItems: newItems.slice(0, 5)
      };
    };

    try {
      const response = await fetch("/api/catalog/upload", {
        method: "POST",
        body: formData
      });
      const responseText = await response.text();
      let payload: (CatalogUploadResult & { error?: string }) | null = null;

      if (responseText) {
        try {
          payload = JSON.parse(responseText) as CatalogUploadResult & {
            error?: string;
          };
        } catch {
          throw new Error(
            `Upload failed with server response ${response.status}. Please refresh and try again.`
          );
        }
      }

      if (!response.ok || !payload) {
        throw new Error(
          payload?.error ||
            `Upload failed with server response ${response.status}. Please try again.`
        );
      }

      setResult(payload);
    } catch (caughtError) {
      try {
        const fallbackResult = await saveBrowserOnlyImport();
        setResult(fallbackResult);
      } catch {
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Upload failed. Please try again."
        );
      }
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
