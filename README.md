# SwiftDrop

Local food and grocery delivery — customers order from stores, pay item subtotals online after store confirmation, and pay the delivery fee in cash to the rider.

## Roles

| Role | How assigned | Dashboard |
|------|----------------|-----------|
| **customer** | Automatic on signup | `/shop`, `/cart`, `/orders` |
| **delivery_agent** | Self-serve via `/become-rider` (pending admin verification) | `/rider` |
| **vendor** | Admin only (`assign_vendor_role` RPC + store link) | `/vendor` (only when store `mode = dashboard`) |
| **admin** | Migration `20260529180000_bootstrap_super_admin.sql` or existing admin | `/admin` |

New signups always receive the **customer** role. Users cannot assign themselves **vendor** or **admin**.

**Bootstrap super-admin:** Create `pascodinamic00@gmail.com` in Supabase Auth, run migrations (grants `admin` in `user_roles`), sign in at `/auth`, then change the password under **Admin → Settings** (`/admin/settings`).

## Environment setup

1. Copy `.env.example` to `.env` and fill in Supabase keys from [Project Settings → API](https://supabase.com/dashboard/project/_/settings/api).
2. Install dependencies: `npm install`
3. Run the app: `npm run dev`

Required client vars (see `.env.example`):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Server routes that use `requireSupabaseAuth` (TanStack Start middleware in `src/integrations/supabase/auth-middleware.ts`) also need:

- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

Optional (Phase 3 payments — not configured by default):

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` — see [docs/payments.md](docs/payments.md)

## Database migrations

```bash
# Local Supabase (if using CLI)
supabase start
supabase db reset   # applies migrations + supabase/seed.sql

# Or push migrations to linked remote project
supabase db push
```

Migrations live in `supabase/migrations/` (timestamped SQL). Apply in order on fresh databases.

## Seed data

`supabase/seed.sql` inserts demo stores when the `stores` table is empty (idempotent). Use after migrations on a new project:

```bash
supabase db reset
# or: psql $DATABASE_URL -f supabase/seed.sql
```

## Order state machine

```
pending_confirmation
        │
        ├─► rejected / cancelled
        │
        ▼
awaiting_payment  (store confirmed; customer pays subtotal)
        │
        ▼
preparing ──► ready ──► picked_up ──► delivered
```

| Status | Meaning |
|--------|---------|
| `pending_confirmation` | Customer placed order; store must confirm availability |
| `awaiting_payment` | Store confirmed; customer must pay item subtotal (Stripe when enabled) |
| `preparing` | Paid; store is preparing |
| `ready` | Ready for rider pickup; offered to online riders |
| `picked_up` | Rider has the order |
| `delivered` | Completed |
| `cancelled` | Customer or system cancelled (early stages) |
| `rejected` | Store cannot fulfill |
| `failed` | Payment or operational failure |

**Payment:** `payment_status` is `unpaid` → `paid` (subtotal only). Delivery fee is collected in cash (`cash_collected` on the order).

## Server auth middleware

`requireSupabaseAuth` validates a `Bearer` JWT on TanStack Start server functions. Pass the user's Supabase access token in the `Authorization` header. Missing `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY` returns HTTP 500 with a clear message.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
