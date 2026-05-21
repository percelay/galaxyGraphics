create table if not exists catalog_items (
  sku text primary key,
  item_name text not null default '',
  artist text not null default '',
  orientation text not null default '',
  published_stock_size text not null default '',
  stock_size_code text not null default '',
  file_name text not null default '',
  groups jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  colors jsonb not null default '[]'::jsonb,
  thumbnail_image text not null default '',
  large_image text not null default '',
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists catalog_items_artist_idx on catalog_items (artist);
create index if not exists catalog_items_orientation_idx on catalog_items (orientation);
create index if not exists catalog_items_groups_gin_idx on catalog_items using gin (groups);
create index if not exists catalog_items_categories_gin_idx on catalog_items using gin (categories);
create index if not exists catalog_items_colors_gin_idx on catalog_items using gin (colors);

create or replace function set_catalog_items_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists catalog_items_set_updated_at on catalog_items;
create trigger catalog_items_set_updated_at
before update on catalog_items
for each row execute function set_catalog_items_updated_at();
