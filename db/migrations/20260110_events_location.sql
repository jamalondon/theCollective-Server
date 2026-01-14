-- Events location schema migration
--
-- Run this in Supabase SQL editor (or your preferred migration runner).
-- This migration is designed to be safe to run even if columns already exist.
--
-- New columns:
--   location_name, address, city, state, latitude, longitude
--
-- Backfill:
--   If legacy `events.location` contains JSON (json/jsonb or text JSON),
--   we attempt to populate the new columns from it.

alter table if exists public.events
  add column if not exists location_name text,
  add column if not exists address text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

-- Backfill when `location` is json/jsonb
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'events'
      and column_name = 'location'
      and data_type in ('json', 'jsonb')
  ) then
    update public.events
    set
      location_name = coalesce(location_name, (location->>'name')),
      address       = coalesce(address,       (location->>'address')),
      city          = coalesce(city,          (location->>'city')),
      state         = coalesce(state,         (location->>'state')),
      latitude      = coalesce(latitude, nullif((location->>'latitude'), '')::double precision),
      longitude     = coalesce(longitude, nullif((location->>'longitude'), '')::double precision)
    where location is not null;
  end if;
end $$;

-- Backfill when `location` is text containing JSON
do $$
declare
  col_type text;
begin
  select data_type into col_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'events'
    and column_name = 'location';

  if col_type = 'text' then
    update public.events
    set
      location_name = coalesce(location_name, (location::jsonb->>'name')),
      address       = coalesce(address,       (location::jsonb->>'address')),
      city          = coalesce(city,          (location::jsonb->>'city')),
      state         = coalesce(state,         (location::jsonb->>'state')),
      latitude      = coalesce(latitude, nullif((location::jsonb->>'latitude'), '')::double precision),
      longitude     = coalesce(longitude, nullif((location::jsonb->>'longitude'), '')::double precision)
    where location is not null
      and location like '{%';
  end if;
exception
  when others then
    -- If some rows contain non-JSON strings, ignore and leave those rows as-is.
    raise notice 'Skipping some legacy location backfill due to parsing errors.';
end $$;

-- Optional cleanup (leave commented for now for backwards compatibility)
-- alter table public.events drop column if exists location;


