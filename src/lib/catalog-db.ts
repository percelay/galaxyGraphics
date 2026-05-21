import { Pool, type QueryResultRow } from "pg";
import type {
  CatalogItem,
  CatalogItemInput,
  CatalogSearchParams,
  CatalogSearchResult
} from "@/lib/catalog";

const databaseUrl = process.env.DATABASE_URL;

const globalForPg = globalThis as unknown as {
  galaxyCatalogPool?: Pool;
};

const getPool = (): Pool | null => {
  if (!databaseUrl) {
    return null;
  }

  if (!globalForPg.galaxyCatalogPool) {
    globalForPg.galaxyCatalogPool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 30_000
    });
  }

  return globalForPg.galaxyCatalogPool;
};

export const hasCatalogDatabase = (): boolean => Boolean(databaseUrl);

type CatalogItemRow = QueryResultRow & {
  sku: string;
  item_name: string;
  artist: string;
  orientation: string;
  published_stock_size: string;
  stock_size_code: string;
  file_name: string;
  groups: string[] | string;
  categories: string[] | string;
  colors: string[] | string;
  thumbnail_image: string;
  large_image: string;
  imported_at: Date | string;
};

const listFromJson = (value: string[] | string): string[] => {
  if (Array.isArray(value)) {
    return value;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

const rowToCatalogItem = (row: CatalogItemRow): CatalogItem => ({
  sku: row.sku,
  itemName: row.item_name,
  artist: row.artist,
  orientation: row.orientation,
  publishedStockSize: row.published_stock_size,
  stockSizeCode: row.stock_size_code,
  fileName: row.file_name,
  groups: listFromJson(row.groups),
  categories: listFromJson(row.categories),
  colors: listFromJson(row.colors),
  thumbnailImage: row.thumbnail_image,
  largeImage: row.large_image,
  importedAt:
    row.imported_at instanceof Date
      ? row.imported_at.toISOString()
      : String(row.imported_at)
});

const catalogItemToDbValues = (item: CatalogItem | CatalogItemInput) => [
  item.sku,
  item.itemName,
  item.artist,
  item.orientation,
  item.publishedStockSize,
  item.stockSizeCode,
  item.fileName,
  JSON.stringify(item.groups),
  JSON.stringify(item.categories),
  JSON.stringify(item.colors),
  item.thumbnailImage,
  item.largeImage,
  item.importedAt ?? new Date().toISOString()
];

const catalogColumns = `
  sku,
  item_name,
  artist,
  orientation,
  published_stock_size,
  stock_size_code,
  file_name,
  groups,
  categories,
  colors,
  thumbnail_image,
  large_image,
  imported_at
`;

export const getCatalogItemsFromDb = async (): Promise<CatalogItem[]> => {
  const pool = getPool();
  if (!pool) {
    return [];
  }

  const result = await pool.query<CatalogItemRow>(
    `select ${catalogColumns} from catalog_items order by sku`
  );
  return result.rows.map(rowToCatalogItem);
};

export const getCatalogItemFromDb = async (
  sku: string
): Promise<CatalogItem | null> => {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query<CatalogItemRow>(
    `select ${catalogColumns} from catalog_items where sku = $1`,
    [sku]
  );

  return result.rows[0] ? rowToCatalogItem(result.rows[0]) : null;
};

export const getCatalogItemCountFromDb = async (): Promise<number> => {
  const pool = getPool();
  if (!pool) {
    return 0;
  }

  const result = await pool.query<{ count: string }>(
    "select count(*) from catalog_items"
  );

  return Number.parseInt(result.rows[0]?.count ?? "0", 10);
};

export const importCatalogItemsToDb = async (
  incomingItems: CatalogItem[]
): Promise<CatalogItem[]> => {
  const pool = getPool();
  if (!pool || incomingItems.length === 0) {
    return [];
  }

  const inserted: CatalogItem[] = [];
  const chunkSize = 250;

  for (let start = 0; start < incomingItems.length; start += chunkSize) {
    const chunk = incomingItems.slice(start, start + chunkSize);
    const values: unknown[] = [];
    const placeholders = chunk.map((item, itemIndex) => {
      values.push(...catalogItemToDbValues(item));
      const offset = itemIndex * 13;
      return `(${Array.from({ length: 13 }, (_, index) => `$${offset + index + 1}`).join(", ")})`;
    });

    const result = await pool.query<CatalogItemRow>(
      `
        insert into catalog_items (${catalogColumns})
        values ${placeholders.join(", ")}
        on conflict (sku) do nothing
        returning ${catalogColumns}
      `,
      values
    );

    inserted.push(...result.rows.map(rowToCatalogItem));
  }

  return inserted;
};

export const addCatalogItemToDb = async (
  item: CatalogItem
): Promise<CatalogItem> => {
  const pool = getPool();
  if (!pool) {
    throw new Error("Database is not configured.");
  }

  const result = await pool.query<CatalogItemRow>(
    `
      insert into catalog_items (${catalogColumns})
      values (${Array.from({ length: 13 }, (_, index) => `$${index + 1}`).join(", ")})
      returning ${catalogColumns}
    `,
    catalogItemToDbValues(item)
  );

  return rowToCatalogItem(result.rows[0]);
};

export const updateCatalogItemInDb = async (
  sku: string,
  item: CatalogItem
): Promise<CatalogItem | null> => {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query<CatalogItemRow>(
    `
      update catalog_items
      set
        item_name = $2,
        artist = $3,
        orientation = $4,
        published_stock_size = $5,
        stock_size_code = $6,
        file_name = $7,
        groups = $8,
        categories = $9,
        colors = $10,
        thumbnail_image = $11,
        large_image = $12
      where sku = $1
      returning ${catalogColumns}
    `,
    [
      sku,
      item.itemName,
      item.artist,
      item.orientation,
      item.publishedStockSize,
      item.stockSizeCode,
      item.fileName,
      JSON.stringify(item.groups),
      JSON.stringify(item.categories),
      JSON.stringify(item.colors),
      item.thumbnailImage,
      item.largeImage
    ]
  );

  return result.rows[0] ? rowToCatalogItem(result.rows[0]) : null;
};

export const deleteCatalogItemFromDb = async (sku: string): Promise<boolean> => {
  const pool = getPool();
  if (!pool) {
    return false;
  }

  const result = await pool.query("delete from catalog_items where sku = $1", [
    sku
  ]);
  return (result.rowCount ?? 0) > 0;
};

export const updateCatalogImagesInDb = async (
  updates: {
    sku: string;
    thumbnailImage?: string;
    largeImage?: string;
  }[]
): Promise<void> => {
  const pool = getPool();
  if (!pool || updates.length === 0) {
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("begin");
    for (const update of updates) {
      await client.query(
        `
          update catalog_items
          set
            thumbnail_image = coalesce(nullif($2, ''), thumbnail_image),
            large_image = coalesce(nullif($3, ''), large_image)
          where sku = $1
        `,
        [update.sku, update.thumbnailImage ?? "", update.largeImage ?? ""]
      );
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
};

export const searchCatalogItemsInDb = async ({
  query = "",
  artist = "",
  color = "",
  orientation = "",
  limit = 60,
  offset = 0
}: CatalogSearchParams = {}): Promise<CatalogSearchResult> => {
  const pool = getPool();
  if (!pool) {
    return {
      items: [],
      total: 0,
      limit,
      offset,
      facets: { artists: [], colors: [], orientations: [] }
    };
  }

  const safeLimit = Math.max(1, Math.min(limit, 120));
  const safeOffset = Math.max(0, offset);
  const normalizedQuery = query.trim();
  const normalizedArtist = artist.trim();
  const normalizedColor = color.trim();
  const normalizedOrientation = orientation.trim();
  const where = `
    ($1 = '' or (
      sku ilike '%' || $1 || '%' or
      item_name ilike '%' || $1 || '%' or
      artist ilike '%' || $1 || '%' or
      orientation ilike '%' || $1 || '%' or
      published_stock_size ilike '%' || $1 || '%' or
      stock_size_code ilike '%' || $1 || '%' or
      file_name ilike '%' || $1 || '%' or
      exists (select 1 from jsonb_array_elements_text(groups) value where value ilike '%' || $1 || '%') or
      exists (select 1 from jsonb_array_elements_text(categories) value where value ilike '%' || $1 || '%') or
      exists (select 1 from jsonb_array_elements_text(colors) value where value ilike '%' || $1 || '%')
    ))
    and ($2 = '' or artist = $2)
    and ($3 = '' or colors ? $3)
    and ($4 = '' or orientation = $4)
  `;
  const params = [
    normalizedQuery,
    normalizedArtist,
    normalizedColor,
    normalizedOrientation
  ];

  const [itemsResult, countResult, artistsResult, colorsResult, orientationsResult] =
    await Promise.all([
      pool.query<CatalogItemRow>(
        `select ${catalogColumns} from catalog_items where ${where} order by sku limit $5 offset $6`,
        [...params, safeLimit, safeOffset]
      ),
      pool.query<{ count: string }>(
        `select count(*) from catalog_items where ${where}`,
        params
      ),
      pool.query<{ artist: string }>(
        "select distinct artist from catalog_items where artist <> '' order by artist"
      ),
      pool.query<{ color: string }>(
        "select distinct jsonb_array_elements_text(colors) as color from catalog_items order by color"
      ),
      pool.query<{ orientation: string }>(
        "select distinct orientation from catalog_items where orientation <> '' order by orientation"
      )
    ]);

  return {
    items: itemsResult.rows.map(rowToCatalogItem),
    total: Number.parseInt(countResult.rows[0]?.count ?? "0", 10),
    limit: safeLimit,
    offset: safeOffset,
    facets: {
      artists: artistsResult.rows.map((row) => row.artist),
      colors: colorsResult.rows.map((row) => row.color).filter(Boolean),
      orientations: orientationsResult.rows.map((row) => row.orientation)
    }
  };
};
