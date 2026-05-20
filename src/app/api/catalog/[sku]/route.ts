import { NextResponse } from "next/server";
import {
  deleteCatalogItem,
  updateCatalogItem,
  type CatalogItemInput
} from "@/lib/catalog";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    sku: string;
  }>;
};

export async function PUT(request: Request, context: RouteContext) {
  const { sku } = await context.params;
  const body = (await request.json()) as Partial<CatalogItemInput>;
  const updatedItem = await updateCatalogItem(decodeURIComponent(sku), body);

  if (!updatedItem) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  return NextResponse.json({ item: updatedItem });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { sku } = await context.params;
  const deleted = await deleteCatalogItem(decodeURIComponent(sku));

  if (!deleted) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
