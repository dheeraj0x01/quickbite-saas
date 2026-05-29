-- =============================================================
-- 007_feedback.sql
-- Customer feedback / rating table.
-- Idempotent: safe to run multiple times.
-- =============================================================

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  table_id uuid references public.restaurant_tables(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  overall_rating int not null,
  food_rating int not null,
  service_rating int not null,
  comment text,
  created_at timestamptz not null default now()
);

alter table public.feedback add column if not exists restaurant_id uuid;
alter table public.feedback add column if not exists table_id uuid;
alter table public.feedback add column if not exists order_id uuid;
alter table public.feedback add column if not exists overall_rating int;
alter table public.feedback add column if not exists food_rating int;
alter table public.feedback add column if not exists service_rating int;
alter table public.feedback add column if not exists comment text;
alter table public.feedback add column if not exists created_at timestamptz default now();

-- Constrain ratings to 1..5.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.feedback'::regclass
      and conname = 'feedback_rating_range_check'
  ) then
    alter table public.feedback
      add constraint feedback_rating_range_check
      check (
        overall_rating between 1 and 5
        and food_rating between 1 and 5
        and service_rating between 1 and 5
      );
  end if;
end $$;

-- One feedback per order. Allows the column to be null (no order id), but
-- prevents duplicate submissions when an order id is provided.
create unique index if not exists feedback_order_id_unique
  on public.feedback (order_id)
  where order_id is not null;

create index if not exists feedback_restaurant_id_idx
  on public.feedback (restaurant_id);

create index if not exists feedback_created_at_idx
  on public.feedback (created_at desc);

alter table public.feedback enable row level security;

-- Public read (admin dashboards work via service role anyway, but keeping
-- this consistent with the rest of the schema in this demo).
drop policy if exists "public read feedback" on public.feedback;
create policy "public read feedback" on public.feedback
  for select using (true);
