-- ============================================================
-- Slice 5: routes + route_stops + RLS
-- ============================================================

-- 1. Route status enum
CREATE TYPE public.route_status AS ENUM ('suggested', 'approved', 'completed');

-- 2. Routes
CREATE TABLE public.routes (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  msr_id        UUID         NOT NULL REFERENCES auth.users (id),
  date          DATE         NOT NULL,
  status        route_status NOT NULL DEFAULT 'suggested',
  supersedes_id UUID         REFERENCES public.routes (id),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (msr_id, date, status)
);

CREATE TRIGGER routes_updated_at
  BEFORE UPDATE ON public.routes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Route stops
CREATE TABLE public.route_stops (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id          UUID        NOT NULL REFERENCES public.routes (id) ON DELETE CASCADE,
  hcp_id            TEXT        NOT NULL REFERENCES public.hcps (hcp_id),
  position          SMALLINT    NOT NULL,
  estimated_arrival TIME,
  UNIQUE (route_id, position)
);

-- 4. Enable RLS
ALTER TABLE public.routes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_stops ENABLE ROW LEVEL SECURITY;

-- 5. Routes: MSR manages their own; DM can read all
CREATE POLICY "routes_msr_all"
  ON public.routes FOR ALL TO authenticated
  USING  (public.get_my_role() = 'msr' AND msr_id = auth.uid())
  WITH CHECK (public.get_my_role() = 'msr' AND msr_id = auth.uid());

CREATE POLICY "routes_dm_select"
  ON public.routes FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('dm', 'admin'));

-- 6. Route stops: follow parent route access
CREATE POLICY "route_stops_msr_all"
  ON public.route_stops FOR ALL TO authenticated
  USING (
    public.get_my_role() = 'msr' AND
    EXISTS (SELECT 1 FROM public.routes WHERE id = route_id AND msr_id = auth.uid())
  )
  WITH CHECK (
    public.get_my_role() = 'msr' AND
    EXISTS (SELECT 1 FROM public.routes WHERE id = route_id AND msr_id = auth.uid())
  );

CREATE POLICY "route_stops_dm_select"
  ON public.route_stops FOR SELECT TO authenticated
  USING (public.get_my_role() IN ('dm', 'admin'));
