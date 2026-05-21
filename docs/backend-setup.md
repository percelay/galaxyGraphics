# Backend Setup

## 1. Neon

Open the Neon project SQL editor and run:

```sql
-- paste the contents of db/schema.sql here
```

Then add this environment variable in Vercel:

```text
DATABASE_URL
```

Use the Neon pooled connection string.

## 2. Cloudflare R2

Create these Vercel environment variables:

```text
R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET_THUMBNAILS=galaxy-thumb
R2_BUCKET_LARGE=galaxy-large
```

## 3. Deploy

Add these admin protection variables in Vercel too:

```text
ADMIN_USERNAME
ADMIN_PASSWORD
```

Redeploy the site after adding the environment variables.

## 4. Seed Data

After deployment:

1. Open `/admin`.
2. Upload the catalog CSV.
3. Upload the image folder.
4. Check `/gallery`.

CSV records will persist in Neon. Images will persist in R2.
