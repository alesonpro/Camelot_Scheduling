create table public.agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index agents_active_idx on public.agents (active);

create trigger set_updated_at
  before update on public.agents
  for each row execute function public.set_updated_at();
