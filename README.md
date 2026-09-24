# Camelot Scheduler

Internal agent availability & showing scheduler for Camelot Properties. See
[CLAUDE.md](./CLAUDE.md) for the full product/engineering spec.

This is Phase 1 ("Foundation"): project scaffold, database schema, auth +
role system, and a role-based layout shell. No availability CRUD, booking,
search, or admin management UI yet — those are later phases.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at https://app.supabase.com.

3. **Copy environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
   `SUPABASE_SERVICE_ROLE_KEY` from your project's Settings > API page.

4. **Apply the database migrations** in `supabase/migrations/`, in order
   (`0001` through `0010`). Either paste each file into the Supabase SQL
   Editor, or, if you have the Supabase CLI installed and linked to your
   project, run `supabase db push`.

5. **Create your first user** via Supabase Dashboard > Authentication >
   Users > "Add user", setting a password directly (no email flow needed).
   Accounts are admin-provisioned only in Phase 1 — there's no public
   sign-up page.

6. **Promote that user to admin** by running the commented SQL in
   `supabase/migrations/0010_seed_admin_optional.sql` (with your user's
   email) in the Supabase SQL Editor. Every other user you create this way
   defaults to the `agent` role — change it with the same kind of `update`
   statement, or set it at creation time via that user's
   `raw_user_meta_data.role` field.

7. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open http://localhost:3000.

## Verification checklist

Database

- [ ] All 7 tables exist (`users, agents, availability_rules,
      availability_exceptions, properties, prospects, showings`) with Row
      Level Security enabled.
- [ ] Inserting two overlapping `showings` rows for the same agent
      (non-cancelled status) — the second insert fails on the
      `no_overlapping_showings` constraint.

Auth + roles

- [ ] Creating a user via the Supabase dashboard auto-creates a matching row
      in `public.users` with `role = 'agent'` by default.
- [ ] Promoting a user to `admin` and logging in lands on `/admin/dashboard`;
      `agent` lands on `/agent/dashboard`; `receptionist` lands on
      `/receptionist/dashboard`.

Route guarding

- [ ] Logged out, visiting `/admin/dashboard` redirects to `/login`.
- [ ] Logged in as `agent`, visiting `/admin/dashboard` or
      `/receptionist/dashboard` redirects to `/unauthorized`.
- [ ] Logged in as `receptionist`, visiting `/agent/dashboard` redirects to
      `/unauthorized`.
- [ ] Admin can reach all three dashboards.
- [ ] Logging out and revisiting a protected route redirects to `/login`.

RLS spot checks (per CLAUDE.md §18 — test these, don't assume they work)

- [ ] Agent A cannot read or write agent B's `availability_rules` or
      `availability_exceptions`.
- [ ] Receptionist can read all agents' `availability_rules` but cannot
      insert/update/delete them.
- [ ] Admin can do all of the above.

Build/tooling

- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] `npm run lint` passes.
- [ ] `/api/health` returns `{ "status": "ok", "supabaseConfigured": true }`.
- [ ] The service role key never appears in the client bundle (spot-check
      `.next/static` after a build).

## Project structure

- `src/app` — routes. `(auth)` is the unauthenticated shell (`/login`),
  `(app)` is the authenticated shell with role-scoped subtrees
  (`/agent`, `/receptionist`, `/admin`).
- `src/lib/supabase` — browser/server/middleware/admin Supabase clients.
- `src/lib/auth` — role types, session lookup, route guards.
- `src/lib/scheduling`, `src/lib/services`, `src/lib/integrations` — reserved
  for Phase 2+ business logic and Phase 6/7 integrations; see each folder's
  README.
- `supabase/migrations` — schema, RLS policies, and the double-booking
  exclusion constraint, applied in order.

Regenerate typed Supabase types once your project exists:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/lib/db/types.ts
```
