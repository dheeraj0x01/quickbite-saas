-- =============================================================
-- 006_payments.sql
-- Adds Razorpay-related columns to orders.
-- Idempotent: safe to run multiple times.
-- =============================================================

alter table public.orders
  add column if not exists payment_status text not null default 'unpaid';

alter table public.orders
  add column if not exists razorpay_order_id text;

alter table public.orders
  add column if not exists razorpay_payment_id text;

alter table public.orders
  add column if not exists paid_at timestamptz;

-- Constrain payment_status to known values.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.orders'::regclass
      and conname = 'orders_payment_status_check'
  ) then
    alter table public.orders
      add constraint orders_payment_status_check
      check (payment_status in ('unpaid', 'paid', 'failed', 'refunded'));
  end if;
end $$;

-- Useful indexes.
create index if not exists orders_razorpay_order_id_idx
  on public.orders (razorpay_order_id);

create index if not exists orders_payment_status_idx
  on public.orders (payment_status);
