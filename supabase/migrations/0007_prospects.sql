create table public.prospects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);

create trigger set_updated_at
  before update on public.prospects
  for each row execute function public.set_updated_at();
