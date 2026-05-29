-- =============================================================
-- 003_kitchen_realtime.sql
-- Enables Supabase Realtime for the kitchen dashboard.
-- Idempotent: safe to run multiple times.
-- =============================================================

-- 1. Add public read access to orders + order_items so the browser
--    Supabase client (using the anon key) can subscribe to realtime
--    INSERT/UPDATE events. Writes still go through the API route
--    (service-role client), so this is safe for the demo.
drop policy if exists "public read orders" on public.orders;
create policy "public read orders" on public.orders
  for select using (true);

drop policy if exists "public read order_items" on public.order_items;
create policy "public read order_items" on public.order_items
  for select using (true);

-- 2. Add the tables to the supabase_realtime publication.
--    Drop+add to ensure they're definitely included.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    -- Remove if present, then re-add
    begin
      alter publication supabase_realtime drop table public.orders;
    exception when undefined_object then null;
    end;
    begin
      alter publication supabase_realtime drop table public.order_items;
    exception when undefined_object then null;
    end;

    alter publication supabase_realtime add table public.orders;
    alter publication supabase_realtime add table public.order_items;
  end if;
end $$;

-- 3. Make sure replica identity is FULL so UPDATE events carry every column.
alter table public.orders replica identity full;
alter table public.order_items replica identity full;
