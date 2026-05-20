import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { attachCatalogImages, imageMatchKey } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const PUBLIC_IMAGE_DIR = path.join(process.cwd(), "public", "catalog-images");
const PUBLIC_IMAGE_PATH = "/catalog-images";
const IMAGE_FILE_PATTERN = /\.(jpg|jpeg|png|webp)$/i;

const isThumbnailPath = (value: string): boolean =>
  /thumb|thumbnail/i.test(value);

const isLargePath = (value: string): boolean =>
  /large|view|hi|big/i.test(value);

const safeFileName = (name: string): string =>
  path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "-");

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((file): file is File => file instanceof File);
  const relativePaths = formData.getAll("relativePaths").map(String);
  const imageMap = new Map<
    string,
    {
      matchKey: string;
      thumbnailImage?: string;
      largeImage?: string;
    }
  >();
  let stored = 0;

  await mkdir(path.join(PUBLIC_IMAGE_DIR, "thumbs"), { recursive: true });
  await mkdir(path.join(PUBLIC_IMAGE_DIR, "large"), { recursive: true });

  for (const [index, file] of files.entries()) {
    const sourcePath = relativePaths[index] || file.name;

    if (!IMAGE_FILE_PATTERN.test(file.name)) {
      continue;
    }

    const matchKey = imageMatchKey(file.name);
    const sizeFolder = isThumbnailPath(sourcePath)
      ? "thumbs"
      : isLargePath(sourcePath)
        ? "large"
        : "";

    if (!sizeFolder || !matchKey) {
      continue;
    }

    const fileName = safeFileName(file.name);
    const destination = path.join(PUBLIC_IMAGE_DIR, sizeFolder, fileName);
    const bytes = new Uint8Array(await file.arrayBuffer());
    await writeFile(destination, bytes);

    const existing = imageMap.get(matchKey) ?? { matchKey };
    const publicPath = `${PUBLIC_IMAGE_PATH}/${sizeFolder}/${fileName}`;

    if (sizeFolder === "thumbs") {
      existing.thumbnailImage = publicPath;
    } else {
      existing.largeImage = publicPath;
    }

    imageMap.set(matchKey, existing);
    stored += 1;
  }

  const result = await attachCatalogImages([...imageMap.values()]);

  return NextResponse.json({
    stored,
    ...result
  });
}
