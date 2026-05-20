"use client";

import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { CatalogItem, CatalogItemInput } from "@/lib/catalog";

type CatalogManagerProps = {
  initialItems: CatalogItem[];
};

type FormState = Omit<CatalogItemInput, "groups" | "categories" | "colors"> & {
  groups: string;
  categories: string;
  colors: string;
};

const emptyForm: FormState = {
  sku: "",
  itemName: "",
  artist: "",
  orientation: "",
  publishedStockSize: "",
  stockSizeCode: "",
  fileName: "",
  groups: "",
  categories: "",
  colors: ""
};

const inputClassName =
  "filter-input w-full rounded-xl px-3 py-2 text-sm outline-none";

const listToText = (values: string[]): string => values.join(", ");

const textToList = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const itemToForm = (item: CatalogItem): FormState => ({
  sku: item.sku,
  itemName: item.itemName,
  artist: item.artist,
  orientation: item.orientation,
  publishedStockSize: item.publishedStockSize,
  stockSizeCode: item.stockSizeCode,
  fileName: item.fileName,
  groups: listToText(item.groups),
  categories: listToText(item.categories),
  colors: listToText(item.colors),
  importedAt: item.importedAt
});

const formToPayload = (form: FormState): CatalogItemInput => ({
  sku: form.sku.trim(),
  itemName: form.itemName.trim(),
  artist: form.artist.trim(),
  orientation: form.orientation.trim(),
  publishedStockSize: form.publishedStockSize.trim(),
  stockSizeCode: form.stockSizeCode.trim(),
  fileName: form.fileName.trim(),
  groups: textToList(form.groups),
  categories: textToList(form.categories),
  colors: textToList(form.colors),
  importedAt: form.importedAt
});

export function CatalogManager({ initialItems }: CatalogManagerProps) {
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [query, setQuery] = useState("");
  const [editingSku, setEditingSku] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingSku, setDeletingSku] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return items.slice(0, 80);
    }

    return items
      .filter((item) =>
        [
          item.sku,
          item.itemName,
          item.artist,
          item.orientation,
          item.fileName,
          ...item.categories,
          ...item.colors
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery)
      )
      .slice(0, 80);
  }, [items, query]);

  const updateForm = (field: keyof FormState, value: string): void => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const startNewRecord = (): void => {
    setEditingSku(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
  };

  const startEditing = (item: CatalogItem): void => {
    setEditingSku(item.sku);
    setForm(itemToForm(item));
    setError("");
    setMessage("");
  };

  const saveRecord = async (): Promise<void> => {
    if (isSaving) {
      return;
    }

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = formToPayload(form);
      const response = await fetch(
        editingSku ? `/api/catalog/${encodeURIComponent(editingSku)}` : "/api/catalog",
        {
          method: editingSku ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      const data = (await response.json()) as {
        item?: CatalogItem;
        error?: string;
      };

      if (!response.ok || !data.item) {
        throw new Error(data.error || "Unable to save record.");
      }

      setItems((currentItems) => {
        if (!editingSku) {
          return [data.item as CatalogItem, ...currentItems];
        }

        return currentItems.map((item) =>
          item.sku === editingSku ? (data.item as CatalogItem) : item
        );
      });
      setEditingSku(data.item.sku);
      setForm(itemToForm(data.item));
      setMessage(editingSku ? "Record updated." : "Record added.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save record."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteRecord = async (sku: string): Promise<void> => {
    if (deletingSku) {
      return;
    }

    const confirmed = window.confirm(`Delete SKU ${sku}?`);
    if (!confirmed) {
      return;
    }

    setDeletingSku(sku);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/catalog/${encodeURIComponent(sku)}`, {
        method: "DELETE"
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete record.");
      }

      setItems((currentItems) =>
        currentItems.filter((item) => item.sku !== sku)
      );
      if (editingSku === sku) {
        startNewRecord();
      }
      setMessage("Record deleted.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to delete record."
      );
    } finally {
      setDeletingSku(null);
    }
  };

  return (
    <div className="paper-panel rounded-2xl p-6 sm:p-9">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl">Manage Records</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Add, edit, or delete individual catalog records without uploading a CSV.
          </p>
        </div>
        <button
          type="button"
          onClick={startNewRecord}
          className="btn-secondary-watercolor inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold"
        >
          <Plus size={16} />
          New Record
        </button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.2fr]">
        <div className="filter-surface rounded-xl p-4">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search records"
            className={inputClassName}
          />

          <div className="mt-4 max-h-[560px] space-y-3 overflow-auto pr-1">
            {filteredItems.map((item) => (
              <article
                key={item.sku}
                className="rounded-xl border border-line bg-surface/70 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{item.itemName || "Untitled"}</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">
                      {item.sku} · {item.artist || "No artist"} · {item.orientation || "No orientation"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEditing(item)}
                      className="btn-secondary-watercolor inline-flex h-9 w-9 items-center justify-center"
                      aria-label={`Edit SKU ${item.sku}`}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRecord(item.sku)}
                      className="btn-secondary-watercolor inline-flex h-9 w-9 items-center justify-center text-red-700"
                      aria-label={`Delete SKU ${item.sku}`}
                    >
                      {deletingSku === item.sku ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="filter-surface rounded-xl p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-2xl">
              {editingSku ? `Edit ${editingSku}` : "Add Record"}
            </h3>
            {editingSku ? (
              <button
                type="button"
                onClick={startNewRecord}
                className="btn-secondary-watercolor inline-flex h-9 w-9 items-center justify-center"
                aria-label="Clear form"
              >
                <X size={15} />
              </button>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={form.sku}
              onChange={(event) => updateForm("sku", event.target.value)}
              placeholder="SKU"
              disabled={Boolean(editingSku)}
              className={`${inputClassName} disabled:cursor-not-allowed disabled:opacity-60`}
            />
            <input
              value={form.itemName}
              onChange={(event) => updateForm("itemName", event.target.value)}
              placeholder="Item name"
              className={inputClassName}
            />
            <input
              value={form.artist}
              onChange={(event) => updateForm("artist", event.target.value)}
              placeholder="Artist"
              className={inputClassName}
            />
            <input
              value={form.orientation}
              onChange={(event) => updateForm("orientation", event.target.value)}
              placeholder="Orientation"
              className={inputClassName}
            />
            <input
              value={form.publishedStockSize}
              onChange={(event) =>
                updateForm("publishedStockSize", event.target.value)
              }
              placeholder="Published stock size"
              className={inputClassName}
            />
            <input
              value={form.stockSizeCode}
              onChange={(event) => updateForm("stockSizeCode", event.target.value)}
              placeholder="Stock size code"
              className={inputClassName}
            />
            <input
              value={form.fileName}
              onChange={(event) => updateForm("fileName", event.target.value)}
              placeholder="File name"
              className="filter-input w-full rounded-xl px-3 py-2 text-sm outline-none sm:col-span-2"
            />
            <textarea
              value={form.groups}
              onChange={(event) => updateForm("groups", event.target.value)}
              placeholder="Groups, comma separated"
              className="filter-input min-h-20 w-full rounded-xl px-3 py-2 text-sm outline-none sm:col-span-2"
            />
            <textarea
              value={form.categories}
              onChange={(event) => updateForm("categories", event.target.value)}
              placeholder="Categories, comma separated"
              className="filter-input min-h-24 w-full rounded-xl px-3 py-2 text-sm outline-none sm:col-span-2"
            />
            <textarea
              value={form.colors}
              onChange={(event) => updateForm("colors", event.target.value)}
              placeholder="Colors, comma separated"
              className="filter-input min-h-20 w-full rounded-xl px-3 py-2 text-sm outline-none sm:col-span-2"
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={saveRecord}
              disabled={isSaving}
              className="btn-primary-watercolor inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              {editingSku ? "Save Changes" : "Add Record"}
            </button>
            {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
            {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
