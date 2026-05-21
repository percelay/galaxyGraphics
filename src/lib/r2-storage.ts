import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const thumbnailBucket = process.env.R2_BUCKET_THUMBNAILS;
const largeBucket = process.env.R2_BUCKET_LARGE;

const globalForR2 = globalThis as unknown as {
  galaxyR2Client?: S3Client;
};

export type CatalogImageKind = "thumbs" | "large";

export const hasR2Storage = (): boolean =>
  Boolean(
    accountId &&
      accessKeyId &&
      secretAccessKey &&
      thumbnailBucket &&
      largeBucket
  );

const getR2Client = (): S3Client | null => {
  if (!hasR2Storage()) {
    return null;
  }

  if (!globalForR2.galaxyR2Client) {
    globalForR2.galaxyR2Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId as string,
        secretAccessKey: secretAccessKey as string
      }
    });
  }

  return globalForR2.galaxyR2Client;
};

const bucketForKind = (kind: CatalogImageKind): string =>
  kind === "thumbs" ? (thumbnailBucket as string) : (largeBucket as string);

export const uploadCatalogImageToR2 = async ({
  kind,
  key,
  bytes,
  contentType
}: {
  kind: CatalogImageKind;
  key: string;
  bytes: Uint8Array;
  contentType: string;
}): Promise<string> => {
  const client = getR2Client();
  if (!client) {
    throw new Error("R2 storage is not configured.");
  }

  await client.send(
    new PutObjectCommand({
      Bucket: bucketForKind(kind),
      Key: key,
      Body: bytes,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable"
    })
  );

  return `/api/catalog/images/${kind}/${encodeURIComponent(key)}`;
};

export const getCatalogImageFromR2 = async ({
  kind,
  key
}: {
  kind: CatalogImageKind;
  key: string;
}): Promise<{
  bytes: Uint8Array;
  contentType: string;
  cacheControl: string;
} | null> => {
  const client = getR2Client();
  if (!client) {
    return null;
  }

  const response = await client
    .send(
      new GetObjectCommand({
        Bucket: bucketForKind(kind),
        Key: key
      })
    )
    .catch((error: unknown) => {
      const statusCode =
        typeof error === "object" &&
        error !== null &&
        "$metadata" in error &&
        typeof error.$metadata === "object" &&
        error.$metadata !== null &&
        "httpStatusCode" in error.$metadata
          ? error.$metadata.httpStatusCode
          : undefined;
      const errorName =
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        typeof error.name === "string"
          ? error.name
          : "";

      if (statusCode === 404 || errorName === "NoSuchKey") {
        return null;
      }

      throw error;
    });

  if (!response) {
    return null;
  }

  const bytes = response.Body
    ? await response.Body.transformToByteArray()
    : new Uint8Array();

  return {
    bytes,
    contentType: response.ContentType ?? "application/octet-stream",
    cacheControl: response.CacheControl ?? "public, max-age=86400"
  };
};
