import { NextResponse } from "next/server";
import { importCatalogCsv } from "@/lib/catalog";

export const dynamic = "force-dynamic";

const decodeCsvFile = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const utf8 = new TextDecoder("utf-8").decode(buffer);

  if (!utf8.includes("\uFFFD")) {
    return utf8;
  }

  return new TextDecoder("windows-1252").decode(buffer);
};

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Upload a CSV file using the file field." },
      { status: 400 }
    );
  }

  const csv = await decodeCsvFile(file);
  const result = await importCatalogCsv(csv);

  return NextResponse.json(result);
}
