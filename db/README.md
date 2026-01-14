## Database migrations

This repo does not currently include a Supabase migration runner. The SQL files in `db/migrations/` are intended to be run manually in the Supabase SQL Editor (or via your own migration tooling).

### Migrations
- **`db/migrations/20260110_events_location.sql`**
  - Adds structured event location fields to `public.events`:
    - `location_name`, `address`, `city`, `state`, `latitude`, `longitude`
  - Attempts to backfill from legacy `events.location` when it contains JSON.


