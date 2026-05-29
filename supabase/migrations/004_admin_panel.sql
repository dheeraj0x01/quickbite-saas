-- =============================================================
-- 004_admin_panel.sql
-- Schema additions for the admin control panel:
--   - categories table
--   - restaurants: logo, banner, contact, address, hours, gst_percent, theme_color
--   - storage bucket "menu-images" for uploaded photos
-- Idempotent: safe to run multiple times.
-- =============================================================

-- ---------- categories ----------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  slug text not null,
  label text not null,
  emoji text,
  display_order int not null default 0,
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories add column if not exists slug text;
alter table public.categories add column if not exists label text;
alter table public.categories add column if not exists emoji text;
alter table public.categories add column if not exists display_order int default 0;
alter table public.categories add column if not exists visible boolean default true;

-- Composite unique constraint so each restaurant has its own slug-space.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.categories'::regclass
      and contype = 'u'
      and conname = 'categories_restaurant_slug_key'
  ) then
    alter table public.categories
      add constraint categories_restaurant_slug_key unique (restaurant_id, slug);
  end if;
end $$;

create index if not exists categories_restaurant_id_idx
  on public.categories (restaurant_id);

alter table public.categories enable row level security;
drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (true);

-- Seed default categories for the demo restaurant if none exist yet.
insert into public.categories (restaurant_id, slug, label, emoji, display_order, visible)
select r.id, c.slug, c.label, c.emoji, c.ord, true
from public.restaurants r
cross join (values
  ('biryani',  'Biryani',  '🍛', 1),
  ('starters', 'Starters', '🍗', 2),
  ('breads',   'Breads',   '🫓', 3),
  ('drinks',   'Drinks',   '☕', 4),
  ('desserts', 'Desserts', '🍮', 5)
) as c(slug, label, emoji, ord)
where r.slug = 'spice-garden'
  and not exists (
    select 1 from public.categories x
    where x.restaurant_id = r.id and x.slug = c.slug
  );

-- ---------- restaurants extended ----------
alter table public.restaurants add column if not exists logo_url text;
alter table public.restaurants add column if not exists banner_url text;
alter table public.restaurants add column if not exists contact_phone text;
alter table public.restaurants add column if not exists address text;
alter table public.restaurants add column if not exists open_hours text;
alter table public.restaurants add column if not exists gst_percent numeric not null default 5;
alter table public.restaurants add column if not exists theme_color text not null default '#E06A3B';

-- ---------- storage bucket: menu-images ----------
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

-- Public read + service-role write is the cleanest demo setup:
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and policyname = 'public read menu-images'
  ) then
    create policy "public read menu-images" on storage.objects
      for select using (bucket_id = 'menu-images');
  end if;
end $$;
