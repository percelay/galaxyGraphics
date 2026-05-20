import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";

export type CatalogItem = {
  sku: string;
  itemName: string;
  artist: string;
  orientation: string;
  publishedStockSize: string;
  stockSizeCode: string;
  fileName: string;
  groups: string[];
  categories: string[];
  colors: string[];
  importedAt: string;
};

export type CatalogUploadResult = {
  inserted: number;
  skipped: number;
  totalRows: number;
  totalCatalogItems: number;
  sampleItems: CatalogItem[];
};

export type CatalogSearchParams = {
  query?: string;
  artist?: string;
  color?: string;
  orientation?: string;
  limit?: number;
  offset?: number;
};

export type CatalogSearchResult = {
  items: CatalogItem[];
  total: number;
  limit: number;
  offset: number;
  facets: {
    artists: string[];
    colors: string[];
    orientations: string[];
  };
};

const DATA_DIR = path.join(process.cwd(), "data");
const CATALOG_PATH = path.join(DATA_DIR, "catalog.json");

const CSV_HEADERS = {
  sku: "Item Number",
  itemName: "Item Name",
  artist: "Artist",
  orientation: "Orientation",
  publishedStockSize: "Published Stock Size",
  stockSizeCode: "Stock Size Code",
  fileName: "File Name"
} as const;

const normalizeValue = (value: string | undefined): string =>
  (value ?? "").trim();

const compactValues = (values: string[]): string[] =>
  values.map(normalizeValue).filter(Boolean);

const ensureDataDir = async (): Promise<void> => {
  await mkdir(DATA_DIR, { recursive: true });
};

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
      if (currentRow.some((field) => field.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
      continue;
    }

    currentField += character;
  }

  currentRow.push(currentField);
  if (currentRow.some((field) => field.trim().length > 0)) {
    rows.push(currentRow);
  }

  return rows;
};

const mapCsvRowsToCatalogItems = (csv: string, importedAt: string): CatalogItem[] => {
  const rows = parseCsv(csv);
  const [headerRow, ...dataRows] = rows;

  if (!headerRow) {
    return [];
  }

  const headerMap = new Map<string, number>();
  headerRow.forEach((header, index) => {
    headerMap.set(header.trim(), index);
  });

  const getByHeader = (row: string[], header: string): string =>
    normalizeValue(row[headerMap.get(header) ?? -1]);

  return dataRows
    .map((row) => {
      const sku = getByHeader(row, CSV_HEADERS.sku);

      if (!sku) {
        return null;
      }

      const groupValues = Array.from({ length: 4 }, (_, index) =>
        getByHeader(row, `Group ${index + 1}`)
      );
      const categoryValues = Array.from({ length: 15 }, (_, index) =>
        getByHeader(row, `Category ${index + 1}`)
      );
      const colorValues = Array.from({ length: 10 }, (_, index) =>
        getByHeader(row, `Color ${index + 1}`)
      );

      return {
        sku,
        itemName: getByHeader(row, CSV_HEADERS.itemName),
        artist: getByHeader(row, CSV_HEADERS.artist),
        orientation: getByHeader(row, CSV_HEADERS.orientation),
        publishedStockSize: getByHeader(row, CSV_HEADERS.publishedStockSize),
        stockSizeCode: getByHeader(row, CSV_HEADERS.stockSizeCode),
        fileName: getByHeader(row, CSV_HEADERS.fileName),
        groups: compactValues(groupValues),
        categories: compactValues(categoryValues),
        colors: compactValues(colorValues),
        importedAt
      };
    })
    .filter((item): item is CatalogItem => item !== null);
};

const readCatalogItemsUncached = async (): Promise<CatalogItem[]> => {
  try {
    const file = await readFile(CATALOG_PATH, "utf8");
    const parsed = JSON.parse(file) as unknown;
    return Array.isArray(parsed) ? (parsed as CatalogItem[]) : [];
  } catch {
    return [];
  }
};

const writeCatalogItems = async (items: CatalogItem[]): Promise<void> => {
  await ensureDataDir();
  const temporaryPath = `${CATALOG_PATH}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(items, null, 2), "utf8");
  await rename(temporaryPath, CATALOG_PATH);
};

export const getCatalogItems = cache(readCatalogItemsUncached);

export const searchCatalogItems = async ({
  query = "",
  artist = "",
  color = "",
  orientation = "",
  limit = 60,
  offset = 0
}: CatalogSearchParams = {}): Promise<CatalogSearchResult> => {
  const items = await readCatalogItemsUncached();
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedArtist = artist.trim();
  const normalizedColor = color.trim();
  const normalizedOrientation = orientation.trim();
  const safeLimit = Math.max(1, Math.min(limit, 120));
  const safeOffset = Math.max(0, offset);

  const filteredItems = items.filter((item) => {
    if (normalizedArtist && item.artist !== normalizedArtist) {
      return false;
    }
    if (normalizedColor && !item.colors.includes(normalizedColor)) {
      return false;
    }
    if (normalizedOrientation && item.orientation !== normalizedOrientation) {
      return false;
    }
    if (!normalizedQuery) {
      return true;
    }

    const searchableText = [
      item.sku,
      item.itemName,
      item.artist,
      item.orientation,
      item.publishedStockSize,
      item.stockSizeCode,
      item.fileName,
      ...item.groups,
      ...item.categories,
      ...item.colors
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });

  return {
    items: filteredItems.slice(safeOffset, safeOffset + safeLimit),
    total: filteredItems.length,
    limit: safeLimit,
    offset: safeOffset,
    facets: {
      artists: [...new Set(items.map((item) => item.artist).filter(Boolean))].sort(),
      colors: [...new Set(items.flatMap((item) => item.colors))].sort(),
      orientations: [
        ...new Set(items.map((item) => item.orientation).filter(Boolean))
      ].sort()
    }
  };
};

export const importCatalogCsv = async (
  csv: string
): Promise<CatalogUploadResult> => {
  const importedAt = new Date().toISOString();
  const incomingItems = mapCsvRowsToCatalogItems(csv, importedAt);
  const existingItems = await readCatalogItemsUncached();
  const existingSkus = new Set(existingItems.map((item) => item.sku));
  const batchSkus = new Set<string>();
  const newItems: CatalogItem[] = [];
  let skipped = 0;

  for (const item of incomingItems) {
    if (existingSkus.has(item.sku) || batchSkus.has(item.sku)) {
      skipped += 1;
      continue;
    }

    batchSkus.add(item.sku);
    newItems.push(item);
  }

  const catalogItems = [...existingItems, ...newItems];
  await writeCatalogItems(catalogItems);

  return {
    inserted: newItems.length,
    skipped,
    totalRows: incomingItems.length,
    totalCatalogItems: catalogItems.length,
    sampleItems: newItems.slice(0, 5)
  };
};
