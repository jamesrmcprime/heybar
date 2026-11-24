# Supabase (stub / prep)

SQL migrations under `migrations/` sketch the HeyBar core schema + RLS against
local/stub placeholders. **No live Supabase project or credentials required.**

## Apply later (owner)

When James creates a project and supplies URL + keys:

1. Copy `.env.example` → `.env.local` and replace placeholders.
2. Install the Supabase CLI (or use the dashboard SQL editor).
3. `supabase db push` / link the project and apply `migrations/` in order.
4. Swap `src/lib/supabase/client.ts` stub bodies to `@supabase/supabase-js`.

## What is covered

| Area | Tables |
|---|---|
| Customers | `profiles`, `customer_addresses` |
| Membership / Guilds | `membership_tiers`, `guilds` |
| Catalogue / stock | `bottles`, `inventory_reservations` |
| Orders | `orders`, `order_participants`, `order_line_items` |
| Delivery | `delivery_shipments`, `delivery_events` |
| Bottle Tops | `bottle_tops_ledger` (append-only credits) |
| Friends | `friend_relations` |

## RLS sketch

Authenticated customers own their profile / addresses / Tops history and can
read orders they host or participate in. Catalogue writes and ledger appends
stay service-role. **Never ship the service-role key to the browser.**

## OPEN (do not invent)

Bottle Top earn/redeem, XP &gt;1000, payment provider, delivery territory/fees,
final T&Cs — stubs and flags only.
