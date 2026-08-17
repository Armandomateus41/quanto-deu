create extension if not exists citext;

create table profiles (
  id uuid primary key,
  name text not null check (char_length(btrim(name)) >= 1),
  email citext not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table purchases (
  id uuid primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  title text null check (title is null or char_length(btrim(title)) >= 1),
  status text not null default 'open' check (status in ('open', 'closed')),
  closed_at timestamptz null,
  total_cents bigint null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'open' and closed_at is null and total_cents is null)
    or
    (status = 'closed' and closed_at is not null and total_cents is not null and total_cents >= 0)
  )
);

create unique index purchases_one_open_per_user
  on purchases (user_id)
  where status = 'open';

create index purchases_user_created_at_idx
  on purchases (user_id, created_at desc);

create table purchase_items (
  id uuid primary key,
  purchase_id uuid not null references purchases (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  price_cents integer not null check (price_cents > 0 and price_cents <= 99999999),
  quantity integer not null check (quantity >= 1 and quantity <= 9999),
  position integer not null check (position >= 0 and position < 200),
  created_at timestamptz not null default now(),
  unique (purchase_id, position)
);

create index purchase_items_purchase_id_idx
  on purchase_items (purchase_id, position);

create view purchase_item_totals as
select
  id,
  purchase_id,
  (price_cents::bigint * quantity) as subtotal_cents
from purchase_items;

create view purchase_open_totals as
select
  p.id as purchase_id,
  p.user_id,
  coalesce(sum(i.price_cents::bigint * i.quantity), 0) as total_cents
from purchases p
left join purchase_items i on i.purchase_id = p.id
where p.status = 'open'
group by p.id, p.user_id;
