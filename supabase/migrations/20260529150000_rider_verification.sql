-- Rider verification / probation: detailed applications, admin approval before taking jobs

CREATE TYPE public.rider_verification_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.rider_profiles
  ADD COLUMN IF NOT EXISTS verification_status public.rider_verification_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS home_address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS government_id text,
  ADD COLUMN IF NOT EXISTS emergency_contact_name text,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone text,
  ADD COLUMN IF NOT EXISTS license_plate text,
  ADD COLUMN IF NOT EXISTS application_notes text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS applied_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.rider_profiles.verification_status IS
  'pending = probation (cannot take jobs); approved = verified rider; rejected = denied';

-- Verified riders only may go online
CREATE OR REPLACE FUNCTION public.enforce_rider_online_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_online = true AND NEW.verification_status IS DISTINCT FROM 'approved' THEN
    RAISE EXCEPTION 'You must be verified before going online';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rider_profiles_online_check ON public.rider_profiles;
CREATE TRIGGER rider_profiles_online_check
  BEFORE INSERT OR UPDATE OF is_online ON public.rider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_rider_online_verified();

CREATE OR REPLACE FUNCTION public.is_verified_rider(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'delivery_agent')
    AND EXISTS (
      SELECT 1
      FROM public.rider_profiles rp
      WHERE rp.id = _user_id
        AND rp.verification_status = 'approved'
    );
$$;

-- Orders: only verified riders see / claim available jobs
DROP POLICY IF EXISTS "orders visible to involved parties" ON public.orders;
CREATE POLICY "orders visible to involved parties" ON public.orders
  FOR SELECT TO authenticated USING (
    auth.uid() = customer_id
    OR auth.uid() = rider_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
    OR (
      status = 'ready'
      AND rider_id IS NULL
      AND public.is_verified_rider(auth.uid())
    )
  );

DROP POLICY IF EXISTS "involved parties update order" ON public.orders;
CREATE POLICY "involved parties update order" ON public.orders
  FOR UPDATE TO authenticated USING (
    auth.uid() = customer_id
    OR auth.uid() = rider_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
    OR (
      status = 'ready'
      AND rider_id IS NULL
      AND public.is_verified_rider(auth.uid())
    )
  ) WITH CHECK (
    auth.uid() = customer_id
    OR auth.uid() = rider_id
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
    OR public.is_verified_rider(auth.uid())
  );

DROP POLICY IF EXISTS "order items follow order" ON public.order_items;
CREATE POLICY "order items follow order" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (
        o.customer_id = auth.uid()
        OR o.rider_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
        OR EXISTS (
          SELECT 1 FROM public.stores s
          WHERE s.id = o.store_id AND s.owner_id = auth.uid()
        )
        OR (
          o.status = 'ready'
          AND o.rider_id IS NULL
          AND public.is_verified_rider(auth.uid())
        )
      )
    )
  );

-- Riders cannot self-approve; admins can update any rider profile field
DROP POLICY IF EXISTS "rider manages own profile" ON public.rider_profiles;
CREATE POLICY "rider manages own profile" ON public.rider_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "rider updates own application" ON public.rider_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND verification_status IN ('pending', 'rejected')
    AND verified_at IS NULL
    AND verified_by IS NULL
  );

CREATE POLICY "verified rider updates operational fields" ON public.rider_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id AND verification_status = 'approved')
  WITH CHECK (auth.uid() = id AND verification_status = 'approved');

CREATE POLICY "admin manages rider profiles" ON public.rider_profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
