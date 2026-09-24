-- Row Level Security (CLAUDE.md §18). Enabled on every table; the frontend
-- must never be the only thing enforcing these rules.

alter table public.users enable row level security;
alter table public.agents enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.properties enable row level security;
alter table public.prospects enable row level security;
alter table public.showings enable row level security;

-- Helper functions (security definer so policies can check role/identity
-- without recursively triggering RLS on public.users/public.agents).
create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

create or replace function public.current_agent_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.agents where user_id = auth.uid();
$$;

-- users ----------------------------------------------------------------
create policy users_select_own on public.users
  for select using (id = auth.uid());

create policy users_select_receptionist_admin on public.users
  for select using (public.current_user_role() in ('receptionist', 'admin'));

create policy users_update_own on public.users
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy users_all_admin on public.users
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- agents -----------------------------------------------------------------
create policy agents_select_own on public.agents
  for select using (user_id = auth.uid());

create policy agents_select_receptionist_admin on public.agents
  for select using (public.current_user_role() in ('receptionist', 'admin'));

create policy agents_update_own on public.agents
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy agents_all_admin on public.agents
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- availability_rules -------------------------------------------------------
-- Agents manage their own recurring availability; receptionists can read
-- all of it but cannot modify it (CLAUDE.md §17); admin has full access.
create policy availability_rules_select_own on public.availability_rules
  for select using (agent_id = public.current_agent_id());

create policy availability_rules_select_receptionist_admin on public.availability_rules
  for select using (public.current_user_role() in ('receptionist', 'admin'));

create policy availability_rules_insert_own on public.availability_rules
  for insert with check (agent_id = public.current_agent_id());

create policy availability_rules_update_own on public.availability_rules
  for update using (agent_id = public.current_agent_id())
  with check (agent_id = public.current_agent_id());

create policy availability_rules_delete_own on public.availability_rules
  for delete using (agent_id = public.current_agent_id());

create policy availability_rules_all_admin on public.availability_rules
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- availability_exceptions -------------------------------------------------
create policy availability_exceptions_select_own on public.availability_exceptions
  for select using (agent_id = public.current_agent_id());

create policy availability_exceptions_select_receptionist_admin on public.availability_exceptions
  for select using (public.current_user_role() in ('receptionist', 'admin'));

create policy availability_exceptions_insert_own on public.availability_exceptions
  for insert with check (agent_id = public.current_agent_id());

create policy availability_exceptions_update_own on public.availability_exceptions
  for update using (agent_id = public.current_agent_id())
  with check (agent_id = public.current_agent_id());

create policy availability_exceptions_delete_own on public.availability_exceptions
  for delete using (agent_id = public.current_agent_id());

create policy availability_exceptions_all_admin on public.availability_exceptions
  for all using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

-- properties ---------------------------------------------------------------
create policy properties_select_authenticated on public.properties
  for select using (auth.role() = 'authenticated');

create policy properties_modify_admin on public.properties
  for insert with check (public.current_user_role() = 'admin');

create policy properties_update_admin on public.properties
  for update using (public.current_user_role() = 'admin')
  with check (public.current_user_role() = 'admin');

create policy properties_delete_admin on public.properties
  for delete using (public.current_user_role() = 'admin');

-- prospects ------------------------------------------------------------
-- Agents get read-only access scoped to prospects tied to their own
-- showings (they need to know who they're meeting); receptionist/admin
-- manage prospects directly.
create policy prospects_select_receptionist_admin on public.prospects
  for select using (public.current_user_role() in ('receptionist', 'admin'));

create policy prospects_select_own_showings on public.prospects
  for select using (
    exists (
      select 1 from public.showings
      where showings.prospect_id = prospects.id
        and showings.agent_id = public.current_agent_id()
    )
  );

create policy prospects_modify_receptionist_admin on public.prospects
  for insert with check (public.current_user_role() in ('receptionist', 'admin'));

create policy prospects_update_receptionist_admin on public.prospects
  for update using (public.current_user_role() in ('receptionist', 'admin'))
  with check (public.current_user_role() in ('receptionist', 'admin'));

create policy prospects_delete_receptionist_admin on public.prospects
  for delete using (public.current_user_role() in ('receptionist', 'admin'));

-- showings -----------------------------------------------------------------
-- Booking is receptionist/admin-driven (CLAUDE.md §4); agents view their own
-- showings but do not create/modify them directly.
create policy showings_select_own on public.showings
  for select using (agent_id = public.current_agent_id());

create policy showings_select_receptionist_admin on public.showings
  for select using (public.current_user_role() in ('receptionist', 'admin'));

create policy showings_insert_receptionist_admin on public.showings
  for insert with check (public.current_user_role() in ('receptionist', 'admin'));

create policy showings_update_receptionist_admin on public.showings
  for update using (public.current_user_role() in ('receptionist', 'admin'))
  with check (public.current_user_role() in ('receptionist', 'admin'));

create policy showings_delete_receptionist_admin on public.showings
  for delete using (public.current_user_role() in ('receptionist', 'admin'));
