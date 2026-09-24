-- Extensions
create extension if not exists "pgcrypto";
create extension if not exists "btree_gist";

-- Enums
do $$ begin
  create type user_role as enum ('admin', 'receptionist', 'agent');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type availability_exception_type as enum ('unavailable', 'available');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type showing_status as enum ('scheduled', 'confirmed', 'cancelled', 'completed', 'rescheduled');
exception
  when duplicate_object then null;
end $$;

-- Shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
