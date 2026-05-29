-- Merchant store applications: owners apply, admins approve; only approved stores appear on the shop.

CREATE TYPE public.store_verification_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS verification_status public.store_verification_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS application_notes text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS applied_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.stores.verification_status IS
  'pending = under admin review (hidden from shop); approved = live eligible; rejected = denied';

-- Existing seed/demo stores stay visible on the marketplace
UPDATE public.stores
SET
  verification_status = 'approved',
  mode = 'dashboard',
  verified_at = COALESCE(verified_at, now())
WHERE verification_status = 'pending'
  AND owner_id IS NULL;

UPDATE public.stores
SET verification_status = 'approved', mode = 'dashboard'
WHERE owner_id IS NOT NULL AND verification_status = 'pending';

CREATE OR REPLACE FUNCTION public.is_approved_store(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores s
    WHERE s.id = p_store_id AND s.verification_status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_verified_vendor_store(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'vendor')
    AND EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_id = _user_id AND s.verification_status = 'approved'
    );
$$;

-- Vendor signup via auth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  acct_type text := lower(trim(COALESCE(NEW.raw_user_meta_data->>'account_type', 'customer')));
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );

  IF acct_type = 'rider' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'delivery_agent');
  ELSIF acct_type = 'vendor' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'vendor');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  END IF;

  RETURN NEW;
END;
$$;

-- Catalog visibility: approved stores only (guests + customers)
DROP POLICY IF EXISTS "stores readable by anon" ON public.stores;
CREATE POLICY "stores readable by anon" ON public.stores
  FOR SELECT TO anon
  USING (verification_status = 'approved');

DROP POLICY IF EXISTS "stores readable" ON public.stores;
CREATE POLICY "stores readable" ON public.stores
  FOR SELECT TO authenticated
  USING (
    verification_status = 'approved'
    OR owner_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
  );

DROP POLICY IF EXISTS "owner or admin manages store" ON public.stores;
CREATE POLICY "vendor inserts store application" ON public.stores
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND verification_status = 'pending'
    AND mode = 'dashboard'
    AND is_open = false
    AND NOT EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.owner_id = auth.uid() AND s.verification_status IN ('pending', 'approved')
    )
  );

CREATE POLICY "vendor updates pending application" ON public.stores
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id AND verification_status IN ('pending', 'rejected'))
  WITH CHECK (
    auth.uid() = owner_id
    AND verification_status IN ('pending', 'rejected')
    AND verified_at IS NULL
    AND verified_by IS NULL
  );

CREATE POLICY "vendor updates approved store" ON public.stores
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id AND verification_status = 'approved')
  WITH CHECK (auth.uid() = owner_id AND verification_status = 'approved');

CREATE POLICY "admin manages stores" ON public.stores
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Menu visible on shop only for approved stores
DROP POLICY IF EXISTS "menu cats readable by anon" ON public.menu_categories;
CREATE POLICY "menu cats readable by anon" ON public.menu_categories
  FOR SELECT TO anon
  USING (public.is_approved_store(store_id));

DROP POLICY IF EXISTS "menu cats readable" ON public.menu_categories;
CREATE POLICY "menu cats readable" ON public.menu_categories
  FOR SELECT TO authenticated
  USING (
    public.is_approved_store(store_id)
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND (s.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

DROP POLICY IF EXISTS "menu items readable by anon" ON public.menu_items;
CREATE POLICY "menu items readable by anon" ON public.menu_items
  FOR SELECT TO anon
  USING (
    is_available = true AND public.is_approved_store(store_id)
  );

DROP POLICY IF EXISTS "menu items readable" ON public.menu_items;
CREATE POLICY "menu items readable" ON public.menu_items
  FOR SELECT TO authenticated
  USING (
    (is_available = true AND public.is_approved_store(store_id))
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND (s.owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- Owners can manage menu while pending (prep before go-live)
DROP POLICY IF EXISTS "store owner or admin manages cats" ON public.menu_categories;
CREATE POLICY "store owner or admin manages cats" ON public.menu_categories
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "store owner or admin manages items" ON public.menu_items;
CREATE POLICY "store owner or admin manages items" ON public.menu_items
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION public.review_store_application(
  p_store_id uuid,
  p_decision public.store_verification_status,
  p_rejection_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  IF p_decision = 'rejected' AND (p_rejection_reason IS NULL OR trim(p_rejection_reason) = '') THEN
    RAISE EXCEPTION 'Rejection reason is required';
  END IF;

  SELECT owner_id INTO v_owner FROM public.stores WHERE id = p_store_id;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Store not found or has no owner';
  END IF;

  UPDATE public.stores
  SET
    verification_status = p_decision,
    rejection_reason = CASE WHEN p_decision = 'rejected' THEN trim(p_rejection_reason) ELSE NULL END,
    verified_at = CASE WHEN p_decision = 'approved' THEN now() ELSE NULL END,
    verified_by = CASE WHEN p_decision = 'approved' THEN auth.uid() ELSE NULL END,
    mode = 'dashboard',
    is_open = CASE WHEN p_decision = 'approved' THEN is_open ELSE false END,
    updated_at = now()
  WHERE id = p_store_id;

  IF p_decision = 'approved' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_owner, 'vendor')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_store_application(uuid, public.store_verification_status, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_store_application(uuid, public.store_verification_status, text) TO authenticated;
