-- =============================================================
-- 001_schema.sql
-- Idempotent schema for QuickBite QR.
-- Safe to run multiple times — existing tables/columns/constraints are kept.
-- Run this in: Supabase Dashboard -> SQL Editor -> New query
-- =============================================================

-- ---------- restaurants ----------
create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  subtitle text,
  rating numeric default 4.5,
  prep_time text default '15-20 min',
  created_at timestamptz not null default now()
);

-- Add columns that might be missing on a pre-existing table.
alter table public.restaurants add column if not exists slug text;
alter table public.restaurants add column if not exists name text;
alter table public.restaurants add column if not exists subtitle text;
alter table public.restaurants add column if not exists rating numeric default 4.5;
alter table public.restaurants add column if not exists prep_time text default '15-20 min';
alter table public.restaurants add column if not exists created_at timestamptz default now();

-- Enforce the unique constraint Postgres needs for ON CONFLICT (slug).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.restaurants'::regclass
      and contype = 'u'
      and conname = 'restaurants_slug_key'
  ) then
    -- Drop any duplicate slugs first so the constraint can be added.
    delete from public.restaurants r
    using public.restaurants r2
    where r.ctid < r2.ctid
      and r.slug is not distinct from r2.slug;

    alter table public.restaurants
      add constraint restaurants_slug_key unique (slug);
  end if;
end $$;

-- ---------- restaurant_tables ----------
create table if not exists public.restaurant_tables (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_number int not null,
  created_at timestamptz not null default now()
);

alter table public.restaurant_tables
  add column if not exists restaurant_id uuid;
alter table public.restaurant_tables
  add column if not exists table_number int;
alter table public.restaurant_tables
  add column if not exists created_at timestamptz default now();

-- Composite unique constraint for ON CONFLICT (restaurant_id, table_number).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.restaurant_tables'::regclass
      and contype = 'u'
      and conname = 'restaurant_tables_restaurant_id_table_number_key'
  ) then
    alter table public.restaurant_tables
      add constraint restaurant_tables_restaurant_id_table_number_key
      unique (restaurant_id, table_number);
  end if;
end $$;

-- ---------- menu_items ----------
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  category text not null,
  price numeric not null,
  veg boolean not null default true,
  emoji text,
  image_url text,
  tags text[] not null default '{}',
  in_stock boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.menu_items add column if not exists restaurant_id uuid;
alter table public.menu_items add column if not exists name text;
alter table public.menu_items add column if not exists description text;
alter table public.menu_items add column if not exists category text;
alter table public.menu_items add column if not exists price numeric;
alter table public.menu_items add column if not exists veg boolean default true;
alter table public.menu_items add column if not exists emoji text;
alter table public.menu_items add column if not exists image_url text;
alter table public.menu_items add column if not exists tags text[] default '{}';
alter table public.menu_items add column if not exists in_stock boolean default true;
alter table public.menu_items add column if not exists display_order int default 0;
alter table public.menu_items add column if not exists created_at timestamptz default now();

create index if not exists menu_items_restaurant_id_idx
  on public.menu_items (restaurant_id);
create index if not exists menu_items_category_idx
  on public.menu_items (category);

-- ---------- orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  status text not null default 'received',
  subtotal numeric not null default 0,
  gst numeric not null default 0,
  total numeric not null default 0,
  payment_method text,
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists restaurant_id uuid;
alter table public.orders add column if not exists table_id uuid;
alter table public.orders add column if not exists status text default 'received';
alter table public.orders add column if not exists subtotal numeric default 0;
alter table public.orders add column if not exists gst numeric default 0;
alter table public.orders add column if not exists total numeric default 0;
alter table public.orders add column if not exists payment_method text;
alter table public.orders add column if not exists created_at timestamptz default now();

-- ---------- order_items ----------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  menu_item_id uuid references public.menu_items(id) on delete cascade,
  quantity int not null,
  price numeric not null
);

-- =============================================================
-- Row Level Security
-- For the demo we allow public read access to menu data.
-- The service-role key (server.ts) bypasses RLS automatically.
-- Tighten these for production.
-- =============================================================
alter table public.restaurants enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "public read restaurants" on public.restaurants;
create policy "public read restaurants" on public.restaurants
  for select using (true);

drop policy if exists "public read tables" on public.restaurant_tables;
create policy "public read tables" on public.restaurant_tables
  for select using (true);

drop policy if exists "public read menu" on public.menu_items;
create policy "public read menu" on public.menu_items
  for select using (true);
