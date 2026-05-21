"use client";

import { ImageUp, Loader2 } from "lucide-react";
import { useState } from "react";

type ImageUploadResult = {
  stored: number;
  matched: number;
  unmatched: string[];
  totalCatalogItems: number;
};

type DirectoryInputElement = HTMLInputElement & {
  webkitdirectory: boolean;
  directory: boolean;
};

type DirectoryFile = File & {
  webkitRelativePath?: string;
};

type ImageUploadFormProps = {
  onUploadComplete?: () => void | Promise<void>;
};

export function ImageUploadForm({ onUploadComplete }: ImageUploadFormProps) {
  const [files, setFiles] = useState<DirectoryFile[]>([]);
  const [result, setResult] = useState<ImageUploadResult | null>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const uploadImages = async (): Promise<void> => {
    if (files.length === 0 || isUploading) {
      return;
    }

    setIsUploading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
      formData.append("relativePaths", file.webkitRelativePath || file.name);
    });

    try {
      const response = await fetch("/api/catalog/images", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as ImageUploadResult & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "Image upload failed.");
      }

      setResult(payload);
      await onUploadComplete?.();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Image upload failed. Please try again."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="paper-panel rounded-2xl p-6 sm:p-9">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-3xl">Image Folder Upload</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Upload one folder containing thumbnail and large image folders. Images are matched to records by filename.
          </p>
        </div>
        <ImageUp className="text-primary" size={26} />
      </div>

      <label
        htmlFor="image-folder-upload"
        className="filter-surface mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-line px-5 py-8 text-center"
      >
        <ImageUp className="text-primary" size={30} />
        <span className="mt-3 text-lg font-semibold">
          {files.length > 0 ? `${files.length} image files selected` : "Choose image folder"}
        </span>
        <span className="mt-1 text-sm text-text-muted">
          Folder names should include Thumbnail/Thumb and Large.
        </span>
      </label>
      <input
        id="image-folder-upload"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        ref={(input) => {
          if (input) {
            const directoryInput = input as DirectoryInputElement;
            directoryInput.webkitdirectory = true;
            directoryInput.directory = true;
          }
        }}
        onChange={(event) =>
          setFiles(Array.from(event.target.files ?? []) as DirectoryFile[])
        }
      />

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={files.length === 0 || isUploading}
          onClick={uploadImages}
          className="btn-primary-watercolor inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
        >
          {isUploading ? <Loader2 className="animate-spin" size={16} /> : <ImageUp size={16} />}
          {isUploading ? "Uploading..." : "Upload Images"}
        </button>
        {error ? <p className="text-sm font-semibold text-red-700">{error}</p> : null}
      </div>

      {result ? (
        <div className="license-banner mt-6 rounded-xl p-4 text-sm text-text-muted">
          <p className="font-semibold text-text-main">Image matching complete</p>
          <p className="mt-1">
            Stored {result.stored} files and matched images to {result.matched} catalog records.
          </p>
          {result.unmatched.length > 0 ? (
            <p className="mt-2">
              Unmatched filenames: {result.unmatched.slice(0, 12).join(", ")}
              {result.unmatched.length > 12 ? "..." : ""}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
