-- ============================================================
-- Slice 1: profiles table + RLS baseline
-- Run in Supabase dashboard: SQL Editor
-- ============================================================

-- 1. Application role enum
CREATE TYPE public.user_role AS ENUM ('admin', 'dm', 'pm', 'msr');

-- 2. Profiles table (1-to-1 with auth.users)
CREATE TABLE public.profiles (
  id         UUID        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role       user_role   NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. updated_at auto-stamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. SECURITY DEFINER helper — queries profiles bypassing RLS so policies
--    can call it without triggering recursion.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 5. Enable RLS (default-deny for unauthenticated is automatic once enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 6. Policies
--    Any authenticated user can read their own row.
CREATE POLICY "own_profile_select"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

--    Admins can read every profile.
CREATE POLICY "admin_all_select"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.get_my_role() = 'admin');

--    Admins can insert, update, and delete any profile (user provisioning).
CREATE POLICY "admin_all_modify"
  ON public.profiles FOR ALL TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');
