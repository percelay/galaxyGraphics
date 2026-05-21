import { NextResponse } from "next/server";
import {
  getCatalogImageFromR2,
  hasR2Storage,
  type CatalogImageKind
} from "@/lib/r2-storage";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    kind: string;
    key: string[];
  }>;
};

const isCatalogImageKind = (value: string): value is CatalogImageKind =>
  value === "thumbs" || value === "large";

export async function GET(_request: Request, context: RouteContext) {
  const { kind, key } = await context.params;

  if (!isCatalogImageKind(kind) || key.length === 0 || !hasR2Storage()) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  const image = await getCatalogImageFromR2({
    kind,
    key: key.join("/")
  });

  if (!image) {
    return NextResponse.json({ error: "Image not found." }, { status: 404 });
  }

  return new Response(image.bytes as BodyInit, {
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": image.cacheControl
    }
  });
}
