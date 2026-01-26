-- Add created_by column and RLS policies for sermon_series

-- 1) Add created_by column and FK to users
ALTER TABLE IF EXISTS public.sermon_series
  ADD COLUMN IF NOT EXISTS created_by UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_sermon_series_created_by'
  ) THEN
    ALTER TABLE public.sermon_series
      ADD CONSTRAINT fk_sermon_series_created_by
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 2) Make end_date, number_of_weeks and cover_image nullable if currently NOT NULL
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sermon_series' AND column_name = 'end_date' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.sermon_series ALTER COLUMN end_date DROP NOT NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sermon_series' AND column_name = 'number_of_weeks' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.sermon_series ALTER COLUMN number_of_weeks DROP NOT NULL;
  END IF;
END$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sermon_series' AND column_name = 'cover_image' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.sermon_series ALTER COLUMN cover_image DROP NOT NULL;
  END IF;
END$$;

-- 3) Enable Row Level Security
ALTER TABLE public.sermon_series ENABLE ROW LEVEL SECURITY;

-- 4) Create policies
-- SELECT: allow authenticated users to read series
DROP POLICY IF EXISTS sermon_series_select_public ON public.sermon_series;
CREATE POLICY sermon_series_select_public ON public.sermon_series
  FOR SELECT
  USING (true);

-- INSERT: only allow if created_by = auth.uid() and user role is developer or leader
DROP POLICY IF EXISTS sermon_series_insert_role ON public.sermon_series;
CREATE POLICY sermon_series_insert_role ON public.sermon_series
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('developer','leader')
    )
  );

-- UPDATE: developers can update any series; leaders can update their own
DROP POLICY IF EXISTS sermon_series_update_role ON public.sermon_series;
CREATE POLICY sermon_series_update_role ON public.sermon_series
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'developer'
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'leader'
      )
      AND created_by = auth.uid()
    )
  )
  WITH CHECK (true);

-- DELETE: same as update
DROP POLICY IF EXISTS sermon_series_delete_role ON public.sermon_series;
CREATE POLICY sermon_series_delete_role ON public.sermon_series
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'developer'
    )
    OR (
      EXISTS (
        SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'leader'
      )
      AND created_by = auth.uid()
    )
  );

-- Notes:
-- Apply this migration using psql or Supabase SQL editor. Ensure you have a backup before enabling RLS in production.
