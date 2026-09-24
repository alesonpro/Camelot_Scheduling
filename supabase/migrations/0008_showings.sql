create table public.showings (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete restrict,
  property_id uuid not null references public.properties (id) on delete restrict,
  prospect_id uuid references public.prospects (id) on delete set null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status showing_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index showings_agent_start_idx on public.showings (agent_id, start_time);
create index showings_start_idx on public.showings (start_time);
create index showings_status_idx on public.showings (status);

create trigger set_updated_at
  before update on public.showings
  for each row execute function public.set_updated_at();

-- Database-level double-booking prevention (CLAUDE.md §9/§31): no two
-- non-cancelled showings for the same agent may overlap in time. This is a
-- hard constraint, not just a frontend check.
alter table public.showings
  add column time_range tstzrange
  generated always as (tstzrange(start_time, end_time, '[)')) stored;

alter table public.showings
  add constraint no_overlapping_showings
  exclude using gist (agent_id with =, time_range with &&)
  where (status <> 'cancelled');
