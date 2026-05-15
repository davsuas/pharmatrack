-- ============================================================
-- Slice 4: campaigns + promotional_grids + RLS
-- ============================================================

-- 1. Campaign status enum
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'closed');

-- 2. Campaigns
CREATE TABLE public.campaigns (
  id         UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id   UUID             NOT NULL REFERENCES public.cycles (id) ON DELETE CASCADE,
  pm_id      UUID             NOT NULL REFERENCES auth.users (id),
  status     campaign_status  NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TRIGGER campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Only one active campaign per cycle
CREATE UNIQUE INDEX one_active_campaign_per_cycle
  ON public.campaigns (cycle_id)
  WHERE status = 'active';

-- 3. Promotional grids
CREATE TABLE public.promotional_grids (
  id                       UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id              UUID     NOT NULL REFERENCES public.campaigns (id) ON DELETE CASCADE,
  product_line_id          UUID     NOT NULL REFERENCES public.product_lines (id),
  tier                     SMALLINT NOT NULL CHECK (tier IN (1, 2, 3)),
  calls_per_cycle          INT      NOT NULL,
  min_visit_duration_minutes INT    NOT NULL,
  position_1_product       TEXT     NOT NULL,
  position_2_product       TEXT,
  message                  TEXT,
  UNIQUE (campaign_id, product_line_id, tier)
);

-- 4. Enable RLS
ALTER TABLE public.campaigns        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_grids ENABLE ROW LEVEL SECURITY;

-- 5. campaigns policies
--    PM can create and manage their own campaigns
CREATE POLICY "campaigns_pm_insert"
  ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (public.get_my_role() = 'pm');

CREATE POLICY "campaigns_pm_update"
  ON public.campaigns FOR UPDATE TO authenticated
  USING  (public.get_my_role() = 'pm' AND pm_id = auth.uid())
  WITH CHECK (public.get_my_role() = 'pm');

--    All roles can read campaigns
CREATE POLICY "campaigns_select"
  ON public.campaigns FOR SELECT TO authenticated
  USING (true);

-- 6. promotional_grids policies
--    PM can manage grids for their own campaigns
CREATE POLICY "grids_pm_all"
  ON public.promotional_grids FOR ALL TO authenticated
  USING (
    public.get_my_role() = 'pm' AND
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND pm_id = auth.uid()
    )
  )
  WITH CHECK (
    public.get_my_role() = 'pm' AND
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE id = campaign_id AND pm_id = auth.uid()
    )
  );

--    All roles can read grids
CREATE POLICY "grids_select"
  ON public.promotional_grids FOR SELECT TO authenticated
  USING (true);
