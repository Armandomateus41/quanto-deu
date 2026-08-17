create table public.shopping_lists (
  user_id uuid primary key references auth.users (id) on delete cascade,
  version integer not null default 1,
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint shopping_lists_items_is_array check (jsonb_typeof(items) = 'array')
);

alter table public.shopping_lists enable row level security;

revoke all on table public.shopping_lists from anon;
revoke all on table public.shopping_lists from public;

grant select, insert, update, delete on table public.shopping_lists to authenticated;

create policy "shopping_lists_select_own"
on public.shopping_lists
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "shopping_lists_insert_own"
on public.shopping_lists
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "shopping_lists_update_own"
on public.shopping_lists
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "shopping_lists_delete_own"
on public.shopping_lists
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);
