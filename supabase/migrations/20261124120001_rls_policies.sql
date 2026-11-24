-- HeyBar RLS sketch — authenticated customer owns their rows.
-- Service role bypasses RLS (server-only). Never ship service-role keys to the client.
-- These policies are intentionally conservative stubs until a live project exists.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.is_order_participant(p_order_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.order_participants op
    where op.order_id = p_order_id
      and op.profile_id = auth.uid()
  );
$$;

revoke all on function public.is_order_participant(text) from public;
grant execute on function public.is_order_participant(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------------------

alter table public.membership_tiers enable row level security;
alter table public.guilds enable row level security;
alter table public.profiles enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.bottles enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.orders enable row level security;
alter table public.order_participants enable row level security;
alter table public.order_line_items enable row level security;
alter table public.delivery_shipments enable row level security;
alter table public.delivery_events enable row level security;
alter table public.bottle_tops_ledger enable row level security;
alter table public.friend_relations enable row level security;

-- ---------------------------------------------------------------------------
-- Reference tables: authenticated read; writes via service role / migrations
-- ---------------------------------------------------------------------------

create policy membership_tiers_select_authenticated
  on public.membership_tiers
  for select
  to authenticated
  using (true);

create policy guilds_select_authenticated
  on public.guilds
  for select
  to authenticated
  using (true);

create policy bottles_select_authenticated
  on public.bottles
  for select
  to authenticated
  using (true);

-- No insert/update/delete policies for bottles/membership/guilds for authenticated.
-- Catalogue & tier writes stay service-role (ops/admin), never anon/client.

-- ---------------------------------------------------------------------------
-- Profiles: owner only
-- ---------------------------------------------------------------------------

create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Addresses: owner only
-- ---------------------------------------------------------------------------

create policy customer_addresses_select_own
  on public.customer_addresses
  for select
  to authenticated
  using (profile_id = auth.uid());

create policy customer_addresses_insert_own
  on public.customer_addresses
  for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy customer_addresses_update_own
  on public.customer_addresses
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy customer_addresses_delete_own
  on public.customer_addresses
  for delete
  to authenticated
  using (profile_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Inventory reservations: creator can read own open holds
-- Mutating stock remains server/service-role (oversell-safe path).
-- ---------------------------------------------------------------------------

create policy inventory_reservations_select_own
  on public.inventory_reservations
  for select
  to authenticated
  using (created_by = auth.uid());

-- ---------------------------------------------------------------------------
-- Orders: host (created_by) or participant
-- ---------------------------------------------------------------------------

create policy orders_select_participant
  on public.orders
  for select
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_order_participant(id)
  );

create policy orders_insert_own
  on public.orders
  for insert
  to authenticated
  with check (created_by = auth.uid());

create policy orders_update_participant
  on public.orders
  for update
  to authenticated
  using (
    created_by = auth.uid()
    or public.is_order_participant(id)
  )
  with check (
    created_by = auth.uid()
    or public.is_order_participant(id)
  );

-- Soft cancel retains rows — no delete policy for authenticated customers.

-- ---------------------------------------------------------------------------
-- Order participants + line items
-- ---------------------------------------------------------------------------

create policy order_participants_select_on_order
  on public.order_participants
  for select
  to authenticated
  using (
    profile_id = auth.uid()
    or public.is_order_participant(order_id)
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.created_by = auth.uid()
    )
  );

create policy order_participants_update_own
  on public.order_participants
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy order_line_items_select_on_order
  on public.order_line_items
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.order_participants op
      where op.id = participant_id
        and (
          op.profile_id = auth.uid()
          or public.is_order_participant(op.order_id)
        )
    )
  );

-- ---------------------------------------------------------------------------
-- Delivery: readable if on the order; writes stay server/adapter
-- ---------------------------------------------------------------------------

create policy delivery_shipments_select_on_order
  on public.delivery_shipments
  for select
  to authenticated
  using (
    public.is_order_participant(order_id)
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.created_by = auth.uid()
    )
  );

create policy delivery_events_select_on_order
  on public.delivery_events
  for select
  to authenticated
  using (
    public.is_order_participant(order_id)
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.created_by = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Bottle Tops ledger: owner can SELECT only (append via service role / admin)
-- ---------------------------------------------------------------------------

create policy bottle_tops_ledger_select_own
  on public.bottle_tops_ledger
  for select
  to authenticated
  using (user_id = auth.uid());

-- No update/delete policies — append-only. No customer insert (admin_credit via service role).

-- ---------------------------------------------------------------------------
-- Friends: owner of the relation row
-- ---------------------------------------------------------------------------

create policy friend_relations_select_own
  on public.friend_relations
  for select
  to authenticated
  using (profile_id = auth.uid() or other_profile_id = auth.uid());

create policy friend_relations_insert_own
  on public.friend_relations
  for insert
  to authenticated
  with check (profile_id = auth.uid());

create policy friend_relations_update_own
  on public.friend_relations
  for update
  to authenticated
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy friend_relations_delete_own
  on public.friend_relations
  for delete
  to authenticated
  using (profile_id = auth.uid());
