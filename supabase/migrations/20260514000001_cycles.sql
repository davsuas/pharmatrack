-- ============================================================
-- Slice 2: cycles table + RLS
-- Run in Supabase dashboard: SQL Editor
-- ============================================================

-- 1. Cycle status enum
CREATE TYPE public.cycle_status AS ENUM ('active', 'completed');

-- 2. Cycles table
CREATE TABLE public.cycles (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date        DATE        NOT NULL,
  end_date          DATE        NOT NULL,
  working_day_count INT         NOT NULL,
  status            cycle_status NOT NULL DEFAULT 'active',
  created_by        UUID        NOT NULL REFERENCES auth.users (id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. updated_at auto-stamp (reuses function from slice 1)
CREATE TRIGGER cycles_updated_at
  BEFORE UPDATE ON public.cycles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Enforce only one active cycle at a time at the DB level
CREATE UNIQUE INDEX one_active_cycle
  ON public.cycles (status)
  WHERE status = 'active';

-- 5. Enable RLS
ALTER TABLE public.cycles ENABLE ROW LEVEL SECURITY;

-- 6. Policies
--    All authenticated users can read cycles.
CREATE POLICY "cycles_select"
  ON public.cycles FOR SELECT TO authenticated
  USING (true);

--    Only admins can insert cycles.
CREATE POLICY "cycles_insert"
  ON public.cycles FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() = 'admin');

--    Only admins can update cycles (used for closing).
CREATE POLICY "cycles_update"
  ON public.cycles FOR UPDATE TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');
