-- Profile table extending auth.users. CLAUDE.md §17: every user has their
-- own Supabase Auth account; this table holds app-level profile/role data.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  name text not null,
  role user_role not null default 'agent',
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_role_idx on public.users (role);

create trigger set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Keeps public.users in sync with auth.users automatically. Role can be set
-- via raw_user_meta_data->>'role' at creation time (e.g. when an admin
-- creates a user in the Supabase dashboard and sets that metadata field);
-- otherwise defaults to 'agent'.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  requested_name text := coalesce(new.raw_user_meta_data ->> 'name', new.email);
begin
  insert into public.users (id, email, name, role)
  values (
    new.id,
    new.email,
    requested_name,
    case
      when requested_role in ('admin', 'receptionist', 'agent') then requested_role::user_role
      else 'agent'
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
