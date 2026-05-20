import { NextResponse } from "next/server";
import { searchCatalogItems } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const toNumber = (value: string | null, fallback: number): number => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await searchCatalogItems({
    query: searchParams.get("q") ?? "",
    artist: searchParams.get("artist") ?? "",
    color: searchParams.get("color") ?? "",
    orientation: searchParams.get("orientation") ?? "",
    limit: toNumber(searchParams.get("limit"), 60),
    offset: toNumber(searchParams.get("offset"), 0)
  });

  return NextResponse.json(result);
}
