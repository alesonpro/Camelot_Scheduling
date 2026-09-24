create table public.properties (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  property_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_active_idx on public.properties (active);

create trigger set_updated_at
  before update on public.properties
  for each row execute function public.set_updated_at();
