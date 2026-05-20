import type { Artwork } from "@/lib/content";
import type { CatalogItem } from "@/lib/catalog";

type RenderedPage = {
  bytes: Uint8Array;
  width: number;
  height: number;
};

type PdfObject = {
  id: number;
  parts: Uint8Array[];
};

const A4_WIDTH_POINTS = 595;
const A4_HEIGHT_POINTS = 842;
const CANVAS_WIDTH = 1240;
const CANVAS_HEIGHT = 1754;
const ARTWORKS_PER_PAGE = 4;

const textEncoder = new TextEncoder();

const encodeText = (value: string): Uint8Array => textEncoder.encode(value);

const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
};

const toAssetUrl = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return new URL(path, window.location.origin).toString();
};

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });

const roundRectPath = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));

  context.beginPath();
  context.moveTo(x + r, y);
  context.lineTo(x + width - r, y);
  context.quadraticCurveTo(x + width, y, x + width, y + r);
  context.lineTo(x + width, y + height - r);
  context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  context.lineTo(x + r, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - r);
  context.lineTo(x, y + r);
  context.quadraticCurveTo(x, y, x + r, y);
  context.closePath();
};

const drawWrappedText = (
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number => {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;
    if (context.measureText(nextLine).width <= maxWidth) {
      line = nextLine;
      continue;
    }

    if (line) {
      lines.push(line);
    }
    line = word;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  if (line && lines.length < maxLines) {
    lines.push(line);
  }

  lines.forEach((item, index) => {
    context.fillText(item, x, y + index * lineHeight);
  });

  return y + lines.length * lineHeight;
};

const renderArtworkPages = async (
  artworks: Artwork[],
  licensingText: string,
  brandName: string
): Promise<RenderedPage[]> => {
  const imageMap = new Map<string, HTMLImageElement | null>();

  await Promise.all(
    artworks.map(async (artwork) => {
      try {
        const image = await loadImage(toAssetUrl(artwork.image));
        imageMap.set(artwork.id, image);
      } catch {
        imageMap.set(artwork.id, null);
      }
    })
  );

  const pages: RenderedPage[] = [];
  const totalPages = Math.ceil(artworks.length / ARTWORKS_PER_PAGE);

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not initialize 2D canvas for PDF rendering.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.fillStyle = "#fff4e6";
    context.beginPath();
    context.arc(120, 120, 170, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "#ffe7cc";
    context.beginPath();
    context.arc(CANVAS_WIDTH - 80, 180, 200, 0, Math.PI * 2);
    context.fill();

    const marginX = 82;
    let cursorY = 118;

    context.fillStyle = "#000000";
    context.font = "700 54px Georgia, 'Times New Roman', serif";
    context.fillText(brandName, marginX, cursorY);

    cursorY += 46;
    context.fillStyle = "#ff8c00";
    context.font = "600 24px 'Helvetica Neue', Arial, sans-serif";
    context.fillText("Curated Artwork Selection", marginX, cursorY);

    cursorY += 56;
    context.fillStyle = "#525252";
    context.font = "400 22px 'Helvetica Neue', Arial, sans-serif";
    cursorY = drawWrappedText(
      context,
      licensingText,
      marginX,
      cursorY,
      CANVAS_WIDTH - marginX * 2,
      32,
      4
    );

    const pageStart = pageIndex * ARTWORKS_PER_PAGE;
    const pageArtworks = artworks.slice(pageStart, pageStart + ARTWORKS_PER_PAGE);
    const gridTop = cursorY + 32;
    const columnGap = 30;
    const rowGap = 30;
    const cardWidth = (CANVAS_WIDTH - marginX * 2 - columnGap) / 2;
    const cardHeight = (CANVAS_HEIGHT - gridTop - 72 - rowGap) / 2;
    const imageHeight = Math.max(340, cardHeight - 190);

    for (let itemIndex = 0; itemIndex < pageArtworks.length; itemIndex += 1) {
      const artwork = pageArtworks[itemIndex];
      const row = Math.floor(itemIndex / 2);
      const column = itemIndex % 2;
      const cardX = marginX + column * (cardWidth + columnGap);
      const cardY = gridTop + row * (cardHeight + rowGap);

      context.fillStyle = "#f8f8f8";
      roundRectPath(context, cardX, cardY, cardWidth, cardHeight, 24);
      context.fill();

      context.strokeStyle = "rgba(0,0,0,0.08)";
      context.lineWidth = 1.5;
      roundRectPath(context, cardX, cardY, cardWidth, cardHeight, 24);
      context.stroke();

      const image = imageMap.get(artwork.id) ?? null;
      const imageX = cardX + 14;
      const imageY = cardY + 14;
      const imageWidth = cardWidth - 28;

      roundRectPath(context, imageX, imageY, imageWidth, imageHeight, 18);
      context.save();
      context.clip();

      if (image) {
        context.drawImage(image, imageX, imageY, imageWidth, imageHeight);
      } else {
        context.fillStyle = "#ececec";
        context.fillRect(imageX, imageY, imageWidth, imageHeight);
        context.fillStyle = "#808080";
        context.font = "500 22px 'Helvetica Neue', Arial, sans-serif";
        context.fillText("Image unavailable", imageX + 24, imageY + imageHeight / 2);
      }

      context.restore();

      const textX = cardX + 20;
      let textY = imageY + imageHeight + 42;

      context.fillStyle = "#000000";
      context.font = "600 32px Georgia, 'Times New Roman', serif";
      textY = drawWrappedText(
        context,
        artwork.title,
        textX,
        textY,
        cardWidth - 40,
        34,
        2
      );

      context.fillStyle = "#525252";
      context.font = "500 20px 'Helvetica Neue', Arial, sans-serif";
      context.fillText(`${artwork.author} • ${artwork.year}`, textX, textY + 12);
      context.fillText(`${artwork.color} • ${artwork.dimensions}`, textX, textY + 42);
    }

    pages.push({
      bytes: dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.92)),
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT
    });
  }

  return pages;
};

const drawContainedImage = (
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
): void => {
  const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = x + (width - drawWidth) / 2;
  const drawY = y + (height - drawHeight) / 2;

  context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
};

const catalogDetailLine = (item: CatalogItem): string =>
  [
    item.artist,
    item.publishedStockSize || item.stockSizeCode,
    item.orientation,
    item.colors.slice(0, 4).join(", ")
  ]
    .filter(Boolean)
    .join(" • ");

const renderCatalogSelectionPages = async (
  items: CatalogItem[],
  brandName: string
): Promise<RenderedPage[]> => {
  const pages: RenderedPage[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const imageSrc = item.largeImage || item.thumbnailImage;
    let image: HTMLImageElement | null = null;

    if (imageSrc) {
      try {
        image = await loadImage(toAssetUrl(imageSrc));
      } catch {
        image = null;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not initialize 2D canvas for PDF rendering.");
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.fillStyle = "#f2f8fd";
    context.fillRect(0, 0, CANVAS_WIDTH, 180);
    context.fillRect(0, CANVAS_HEIGHT - 118, CANVAS_WIDTH, 118);

    context.fillStyle = "#2f80c8";
    context.fillRect(76, 64, 56, 56);
    context.strokeStyle = "#ffffff";
    context.lineWidth = 6;
    context.beginPath();
    context.arc(104, 92, 16, 0, Math.PI * 2);
    context.stroke();

    context.fillStyle = "#122033";
    context.font = "800 38px 'Helvetica Neue', Arial, sans-serif";
    context.fillText(brandName.toUpperCase(), 154, 88);
    context.fillStyle = "#2f80c8";
    context.font = "700 19px 'Helvetica Neue', Arial, sans-serif";
    context.fillText("CURATED IMAGE SELECTION", 156, 120);

    context.fillStyle = "#63758b";
    context.font = "600 18px 'Helvetica Neue', Arial, sans-serif";
    context.textAlign = "right";
    context.fillText(`PAGE ${index + 1} OF ${items.length}`, CANVAS_WIDTH - 76, 96);
    context.textAlign = "left";

    const imageBoxX = 98;
    const imageBoxY = 245;
    const imageBoxWidth = CANVAS_WIDTH - 196;
    const imageBoxHeight = 910;

    context.fillStyle = "#f8fcff";
    context.fillRect(imageBoxX, imageBoxY, imageBoxWidth, imageBoxHeight);
    context.strokeStyle = "#d7e6f3";
    context.lineWidth = 2;
    context.strokeRect(imageBoxX, imageBoxY, imageBoxWidth, imageBoxHeight);

    if (image) {
      drawContainedImage(
        context,
        image,
        imageBoxX + 36,
        imageBoxY + 36,
        imageBoxWidth - 72,
        imageBoxHeight - 72
      );
    } else {
      context.fillStyle = "#63758b";
      context.font = "600 24px 'Helvetica Neue', Arial, sans-serif";
      context.fillText("Image unavailable", imageBoxX + 40, imageBoxY + 90);
    }

    let textY = 1245;
    context.fillStyle = "#122033";
    context.font = "800 44px 'Helvetica Neue', Arial, sans-serif";
    textY = drawWrappedText(
      context,
      item.itemName || "Untitled",
      98,
      textY,
      CANVAS_WIDTH - 196,
      50,
      2
    );

    context.fillStyle = "#2f80c8";
    context.font = "700 23px 'Helvetica Neue', Arial, sans-serif";
    context.fillText(`SKU ${item.sku}`, 98, textY + 18);

    context.fillStyle = "#40536b";
    context.font = "500 23px 'Helvetica Neue', Arial, sans-serif";
    drawWrappedText(
      context,
      catalogDetailLine(item),
      98,
      textY + 58,
      CANVAS_WIDTH - 196,
      32,
      3
    );

    context.fillStyle = "#63758b";
    context.font = "500 18px 'Helvetica Neue', Arial, sans-serif";
    context.fillText("Prepared for review only. Image rights remain with Galaxy Graphics.", 76, CANVAS_HEIGHT - 54);
    context.textAlign = "right";
    context.fillText("galaxygraphics.com", CANVAS_WIDTH - 76, CANVAS_HEIGHT - 54);
    context.textAlign = "left";

    pages.push({
      bytes: dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.94)),
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT
    });
  }

  return pages;
};

const buildPdfBlob = (pages: RenderedPage[]): Blob => {
  const objects: PdfObject[] = [];
  const pageObjectIds: number[] = [];

  objects.push({
    id: 1,
    parts: [encodeText("<< /Type /Catalog /Pages 2 0 R >>")]
  });

  for (let index = 0; index < pages.length; index += 1) {
    const pageObjectId = 3 + index * 3;
    const imageObjectId = pageObjectId + 1;
    const contentObjectId = pageObjectId + 2;
    const imageResource = `Im${index + 1}`;

    pageObjectIds.push(pageObjectId);

    const contentStream = encodeText(
      `q\n${A4_WIDTH_POINTS} 0 0 ${A4_HEIGHT_POINTS} 0 0 cm\n/${imageResource} Do\nQ\n`
    );

    objects.push({
      id: pageObjectId,
      parts: [
        encodeText(
          `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${A4_WIDTH_POINTS} ${A4_HEIGHT_POINTS}] /Resources << /ProcSet [/PDF /ImageC] /XObject << /${imageResource} ${imageObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`
        )
      ]
    });

    objects.push({
      id: imageObjectId,
      parts: [
        encodeText(
          `<< /Type /XObject /Subtype /Image /Width ${pages[index].width} /Height ${pages[index].height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pages[index].bytes.length} >>\nstream\n`
        ),
        pages[index].bytes,
        encodeText("\nendstream")
      ]
    });

    objects.push({
      id: contentObjectId,
      parts: [
        encodeText(`<< /Length ${contentStream.length} >>\nstream\n`),
        contentStream,
        encodeText("endstream")
      ]
    });
  }

  objects.push({
    id: 2,
    parts: [
      encodeText(
        `<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds
          .map((id) => `${id} 0 R`)
          .join(" ")}] >>`
      )
    ]
  });

  const sortedObjects = objects.sort((a, b) => a.id - b.id);
  const maxObjectId = sortedObjects[sortedObjects.length - 1]?.id ?? 0;
  const offsets = new Array<number>(maxObjectId + 1).fill(0);
  const chunks: Uint8Array[] = [];
  let offset = 0;

  const pushChunk = (chunk: Uint8Array): void => {
    chunks.push(chunk);
    offset += chunk.length;
  };

  pushChunk(
    new Uint8Array([
      0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34, 0x0a, 0x25, 0xff, 0xff,
      0xff, 0xff, 0x0a
    ])
  );

  sortedObjects.forEach((object) => {
    offsets[object.id] = offset;
    pushChunk(encodeText(`${object.id} 0 obj\n`));
    object.parts.forEach((part) => pushChunk(part));
    pushChunk(encodeText("\nendobj\n"));
  });

  const xrefStart = offset;
  pushChunk(encodeText(`xref\n0 ${maxObjectId + 1}\n`));
  pushChunk(encodeText("0000000000 65535 f \n"));

  for (let id = 1; id <= maxObjectId; id += 1) {
    if (offsets[id] === 0) {
      pushChunk(encodeText("0000000000 00000 f \n"));
      continue;
    }

    pushChunk(encodeText(`${offsets[id].toString().padStart(10, "0")} 00000 n \n`));
  }

  pushChunk(
    encodeText(
      `trailer\n<< /Size ${maxObjectId + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
    )
  );

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
};

export const exportGalleryPdf = async ({
  artworks,
  licensingText,
  brandName
}: {
  artworks: Artwork[];
  licensingText: string;
  brandName: string;
}): Promise<void> => {
  if (artworks.length === 0) {
    return;
  }

  const pages = await renderArtworkPages(artworks, licensingText, brandName);
  const pdfBlob = buildPdfBlob(pages);
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const safeBrand = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const dateToken = new Date().toISOString().slice(0, 10);

  const anchor = document.createElement("a");
  anchor.href = pdfUrl;
  anchor.download = `${safeBrand}-selection-${dateToken}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(pdfUrl);
  }, 10_000);
};

export const exportCatalogSelectionPdf = async ({
  items,
  brandName
}: {
  items: CatalogItem[];
  brandName: string;
}): Promise<void> => {
  if (items.length === 0) {
    return;
  }

  const pages = await renderCatalogSelectionPages(items, brandName);
  const pdfBlob = buildPdfBlob(pages);
  const pdfUrl = URL.createObjectURL(pdfBlob);
  const safeBrand = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const dateToken = new Date().toISOString().slice(0, 10);

  const anchor = document.createElement("a");
  anchor.href = pdfUrl;
  anchor.download = `${safeBrand}-gallery-selection-${dateToken}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(pdfUrl);
  }, 10_000);
};
