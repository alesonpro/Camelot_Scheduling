-- Recurring weekly availability (CLAUDE.md §6). day_of_week: 0 = Sunday.
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'America/Chicago',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index availability_rules_agent_day_idx on public.availability_rules (agent_id, day_of_week);

create trigger set_updated_at
  before update on public.availability_rules
  for each row execute function public.set_updated_at();
