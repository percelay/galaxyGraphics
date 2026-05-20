import { NextResponse } from "next/server";
import {
  addCatalogItem,
  getCatalogItems,
  type CatalogItemInput
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getCatalogItems();

  return NextResponse.json({
    items,
    total: items.length
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<CatalogItemInput>;
    const item = await addCatalogItem(body);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to create record."
      },
      { status: 400 }
    );
  }
}
