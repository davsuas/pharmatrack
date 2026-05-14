-- ============================================================
-- Slice 3: product_lines, hcps, hcp_tier_assignments + RLS
-- Run in Supabase dashboard: SQL Editor
-- ============================================================

-- 1. Product lines
CREATE TABLE public.product_lines (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Seed default product lines
INSERT INTO public.product_lines (name) VALUES
  ('Cardiology'),
  ('Oncology'),
  ('Neurology');

-- 3. HCPs
CREATE TABLE public.hcps (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  hcp_id      TEXT        NOT NULL UNIQUE,
  name        TEXT        NOT NULL,
  specialty   TEXT        NOT NULL,
  address     TEXT        NOT NULL,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  msr_id      UUID        REFERENCES auth.users (id),
  geocoded_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER hcps_updated_at
  BEFORE UPDATE ON public.hcps
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. HCP tier assignments (per product line)
CREATE TABLE public.hcp_tier_assignments (
  hcp_id          TEXT        NOT NULL REFERENCES public.hcps (hcp_id) ON DELETE CASCADE,
  product_line_id UUID        NOT NULL REFERENCES public.product_lines (id) ON DELETE CASCADE,
  tier            SMALLINT    NOT NULL CHECK (tier IN (1, 2, 3)),
  PRIMARY KEY (hcp_id, product_line_id)
);

-- 5. Enable RLS
ALTER TABLE public.product_lines       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hcps                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hcp_tier_assignments ENABLE ROW LEVEL SECURITY;

-- 6. product_lines: all authenticated users can read
CREATE POLICY "product_lines_select"
  ON public.product_lines FOR SELECT TO authenticated
  USING (true);

-- 7. hcps: admin can do anything; MSR can read their own panel; DM can read all
CREATE POLICY "hcps_admin_all"
  ON public.hcps FOR ALL TO authenticated
  USING  (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "hcps_msr_select"
  ON public.hcps FOR SELECT TO authenticated
  USING (public.get_my_role() = 'msr' AND msr_id = auth.uid());

CREATE POLICY "hcps_dm_select"
  ON public.hcps FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('dm', 'pm'));

-- 8. hcp_tier_assignments: mirrors hcps access
CREATE POLICY "hcp_tiers_admin_all"
  ON public.hcp_tier_assignments FOR ALL TO authenticated
  USING  (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

CREATE POLICY "hcp_tiers_read"
  ON public.hcp_tier_assignments FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('msr', 'dm', 'pm'));
