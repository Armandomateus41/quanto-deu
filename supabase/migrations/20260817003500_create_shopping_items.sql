create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  price_cents integer not null,
  quantity integer not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint shopping_items_name_len check (char_length(btrim(name)) between 1 and 80),
  constraint shopping_items_price_cents_range check (price_cents > 0 and price_cents <= 99999999),
  constraint shopping_items_quantity_range check (quantity >= 1 and quantity <= 9999),
  constraint shopping_items_position_range check (position >= 0 and position < 200)
);

create index shopping_items_user_id_position_idx
  on public.shopping_items (user_id, position);

alter table public.shopping_items enable row level security;
alter table public.shopping_items force row level security;

create policy shopping_items_select_own
  on public.shopping_items
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy shopping_items_insert_own
  on public.shopping_items
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy shopping_items_update_own
  on public.shopping_items
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy shopping_items_delete_own
  on public.shopping_items
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.shopping_items from anon, public;
grant select, insert, update, delete on table public.shopping_items to authenticated;
