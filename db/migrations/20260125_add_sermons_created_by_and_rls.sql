-- Add created_by column and RLS policies for sermons

-- 1) Add created_by column and FK to users
ALTER TABLE IF EXISTS public.sermons
  ADD COLUMN IF NOT EXISTS created_by UUID;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_sermons_created_by'
  ) THEN
    ALTER TABLE public.sermons
      ADD CONSTRAINT fk_sermons_created_by
      FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END$$;

-- 2) Enable Row Level Security
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

-- 3) Create policies
-- SELECT: allow authenticated users to read sermons
DROP POLICY IF EXISTS sermons_select_public ON public.sermons;
CREATE POLICY sermons_select_public ON public.sermons
  FOR SELECT
  USING (true);

-- INSERT: only allow if created_by = auth.uid() and user role is developer or leader
DROP POLICY IF EXISTS sermons_insert_role ON public.sermons;
CREATE POLICY sermons_insert_role ON public.sermons
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('developer','leader')
    )
  );

-- UPDATE: developers can update any sermon; leaders can update their own; created_by must remain unchanged or be set to auth.uid()
DROP POLICY IF EXISTS sermons_update_role ON public.sermons;
CREATE POLICY sermons_update_role ON public.sermons
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
DROP POLICY IF EXISTS sermons_delete_role ON public.sermons;
CREATE POLICY sermons_delete_role ON public.sermons
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
