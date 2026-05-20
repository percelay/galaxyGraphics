import { NextResponse } from "next/server";
import { getCatalogItems } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getCatalogItems();

  return NextResponse.json({
    items,
    total: items.length
  });
}
