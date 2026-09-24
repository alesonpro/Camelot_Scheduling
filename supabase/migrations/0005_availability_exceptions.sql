-- Temporary overrides (CLAUDE.md §7): unavailable/available windows that
-- take priority over recurring availability_rules. Null start/end means the
-- exception covers the whole day.
create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete cascade,
  date date not null,
  start_time time,
  end_time time,
  type availability_exception_type not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (start_time is null and end_time is null)
    or (start_time is not null and end_time is not null and end_time > start_time)
  )
);

create index availability_exceptions_agent_date_idx on public.availability_exceptions (agent_id, date);

create trigger set_updated_at
  before update on public.availability_exceptions
  for each row execute function public.set_updated_at();
