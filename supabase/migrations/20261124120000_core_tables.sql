-- HeyBar core schema — aligned with TypeScript stubs on main.
-- Stub/local placeholders only. No live project credentials required.
-- Do NOT invent OPEN freeze rules (Tops earn/redeem, XP>1000, territory, payment provider).

-- ---------------------------------------------------------------------------
-- Reference / config (membership + guilds mirror seed tables)
-- ---------------------------------------------------------------------------

create table if not exists public.membership_tiers (
  id text primary key,
  name text not null,
  fee_zar_per_month numeric(10, 2) not null check (fee_zar_per_month >= 0),
  product_discount_pct numeric(5, 2) not null check (product_discount_pct >= 0),
  delivery_discount_pct numeric(5, 2) not null check (delivery_discount_pct >= 0),
  created_at timestamptz not null default now()
);

comment on table public.membership_tiers is
  'Brief-table membership tiers (Straight Up / Neat / The Reserve / Top Shelf). Rates are seed config — do not invent new ones.';

create table if not exists public.guilds (
  id text primary key,
  name text not null,
  focus text not null,
  accent text not null,
  created_at timestamptz not null default now()
);

comment on table public.guilds is
  'Eight Guilds from seed config. Focus/name only — no invent earn/claim rules.';

-- ---------------------------------------------------------------------------
-- Customers / profiles (maps DEMO_USER + ProfileFieldsForm)
-- id matches auth.users when real Supabase Auth is wired.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  initials text,
  mobile text,
  email text,
  dob_verified boolean not null default false,
  city text,
  membership_id text references public.membership_tiers (id),
  guild_id text references public.guilds (id),
  -- Display XP within configured ranks (≤1000). Behaviour above 1000 remains OPEN.
  xp integer not null default 0 check (xp >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Customer profile. Owns membership/guild display fields. PII minimized; RLS owner-only.';

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  summary text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists customer_addresses_profile_idx
  on public.customer_addresses (profile_id);

-- ---------------------------------------------------------------------------
-- Bottles catalogue + inventory reservations (sealed bottles only)
-- ---------------------------------------------------------------------------

create table if not exists public.bottles (
  id text primary key,
  name text not null,
  price_zar numeric(10, 2) not null check (price_zar >= 0),
  size_ml integer not null check (size_ml > 0),
  abv_percent numeric(5, 2),
  category text not null,
  guild text not null,
  stock integer not null default 0 check (stock >= 0),
  available boolean not null default true,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.bottles is
  'Sealed-bottle catalogue. Prototype prices are editable seed — not confirmed retail. No cocktails.';

create table if not exists public.inventory_reservations (
  id text primary key,
  -- Opaque JSON array of { bottleId, qty } matching ReserveLine
  lines jsonb not null default '[]'::jsonb,
  status text not null default 'open'
    check (status in ('open', 'committed', 'released')),
  created_by uuid references public.profiles (id) on delete set null,
  order_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.inventory_reservations is
  'Reserve → commit/release skeleton. Timing (cart vs pay vs fulfill) remains OPEN.';

-- ---------------------------------------------------------------------------
-- Orders / shared-orders + participants + line items
-- Soft cancel / exception are status transitions — no hard-deletes of peers.
-- ---------------------------------------------------------------------------

create table if not exists public.orders (
  id text primary key,
  kind text not null check (kind in ('shared', 'solo')),
  title text not null,
  status_label text not null default '',
  pending boolean not null default false,
  note text not null default '',
  active boolean not null default true,
  -- Seed / stub fee ZAR — territory & commercial schedule remain OPEN
  delivery_fee_zar numeric(10, 2) not null default 0 check (delivery_fee_zar >= 0),
  fulfillment_status text not null default 'preparation'
    check (
      fulfillment_status in (
        'preparation',
        'assigned',
        'pickup',
        'in_transit',
        'delivered',
        'exception',
        'cancelled'
      )
    ),
  exception_note text,
  host_participant_id text,
  past_date_label text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_by_idx on public.orders (created_by);
create index if not exists orders_active_idx on public.orders (active);

create table if not exists public.order_participants (
  id text primary key,
  order_id text not null references public.orders (id) on delete cascade,
  -- auth profile when known; null for invite shells / friends without accounts yet
  profile_id uuid references public.profiles (id) on delete set null,
  -- Demo seed uses "self" or friends graph person id
  person_key text not null,
  membership_id text not null references public.membership_tiers (id),
  locked boolean not null default false,
  payment_state text not null default 'awaiting_pay'
    check (
      payment_state in (
        'awaiting_pay',
        'failed',
        'paid',
        'out_for_delivery',
        'delivered',
        'cancelled'
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (order_id, person_key)
);

create index if not exists order_participants_order_idx
  on public.order_participants (order_id);
create index if not exists order_participants_profile_idx
  on public.order_participants (profile_id);

create table if not exists public.order_line_items (
  id uuid primary key default gen_random_uuid(),
  participant_id text not null
    references public.order_participants (id) on delete cascade,
  bottle_id text not null references public.bottles (id),
  qty integer not null check (qty > 0),
  created_at timestamptz not null default now()
);

create index if not exists order_line_items_participant_idx
  on public.order_line_items (participant_id);

-- ---------------------------------------------------------------------------
-- Delivery status (adapter shipment + append-only events)
-- ---------------------------------------------------------------------------

create table if not exists public.delivery_shipments (
  order_id text primary key references public.orders (id) on delete cascade,
  status text not null default 'preparation'
    check (
      status in (
        'preparation',
        'assigned',
        'pickup',
        'in_transit',
        'delivered',
        'exception',
        'cancelled'
      )
    ),
  address_summary text not null default '',
  kind text not null check (kind in ('shared', 'solo')),
  stub_fee_zar numeric(10, 2) not null default 0 check (stub_fee_zar >= 0),
  exception_note text,
  soft_cancelled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.delivery_shipments is
  'Fulfillment shipment row. Soft cancel retains record (no hard-delete). Territory OPEN.';

create table if not exists public.delivery_events (
  id text primary key,
  order_id text not null references public.orders (id) on delete cascade,
  kind text not null
    check (kind in ('dispatch', 'advance', 'exception', 'soft_cancel')),
  from_status text,
  to_status text not null,
  note text,
  recorded_at timestamptz not null default now()
);

create index if not exists delivery_events_order_idx
  on public.delivery_events (order_id);

-- ---------------------------------------------------------------------------
-- Bottle Tops ledger (append-only Blue/Gold; balances derived)
-- Earn / redeem / conversion remain OPEN — shell only allows credits.
-- ---------------------------------------------------------------------------

create table if not exists public.bottle_tops_ledger (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  currency text not null check (currency in ('blue', 'gold')),
  -- Positive = credit. Shell rejects debits (earn/redeem OPEN).
  delta integer not null check (delta > 0),
  reason text not null check (reason in ('admin_credit', 'display_seed')),
  actor text not null check (actor in ('system', 'admin')),
  note text,
  related_order_id text references public.orders (id) on delete set null,
  related_reward_id text,
  recorded_at timestamptz not null default now()
);

create index if not exists bottle_tops_ledger_user_idx
  on public.bottle_tops_ledger (user_id, recorded_at);

comment on table public.bottle_tops_ledger is
  'Append-only Bottle Tops. No UPDATE/DELETE for customers. No earn/redeem rates invented.';

-- ---------------------------------------------------------------------------
-- Friends graph shell (display relations; mutations stay local until backend)
-- ---------------------------------------------------------------------------

create table if not exists public.friend_relations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  other_profile_id uuid references public.profiles (id) on delete cascade,
  other_person_key text,
  relation text not null
    check (
      relation in (
        'buddy',
        'incoming_request',
        'outgoing_request',
        'discover'
      )
    ),
  note text,
  created_at timestamptz not null default now(),
  check (
    other_profile_id is not null
    or (other_person_key is not null and length(trim(other_person_key)) > 0)
  )
);

create index if not exists friend_relations_profile_idx
  on public.friend_relations (profile_id);
