-- Rider-only signup (no customer role) + restore verified-rider order visibility

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
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  END IF;

  RETURN NEW;
END;
$$;

-- Align order visibility with verification (supersedes role_security_hardening ready-pool rule)
DROP POLICY IF EXISTS "orders visible to involved parties" ON public.orders;

CREATE POLICY "orders visible to involved parties"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
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

DROP POLICY IF EXISTS "order items follow order" ON public.order_items;

CREATE POLICY "order items follow order"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
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

-- Admin-only rider review (emails sent from edge function after this runs)
CREATE OR REPLACE FUNCTION public.review_rider_application(
  p_rider_id uuid,
  p_decision public.rider_verification_status,
  p_rejection_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  IF NOT EXISTS (SELECT 1 FROM public.rider_profiles WHERE id = p_rider_id) THEN
    RAISE EXCEPTION 'Rider profile not found';
  END IF;

  UPDATE public.rider_profiles
  SET
    verification_status = p_decision,
    rejection_reason = CASE WHEN p_decision = 'rejected' THEN trim(p_rejection_reason) ELSE NULL END,
    verified_at = CASE WHEN p_decision = 'approved' THEN now() ELSE NULL END,
    verified_by = CASE WHEN p_decision = 'approved' THEN auth.uid() ELSE NULL END,
    is_online = false,
    updated_at = now()
  WHERE id = p_rider_id;
END;
$$;

REVOKE ALL ON FUNCTION public.review_rider_application(uuid, public.rider_verification_status, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_rider_application(uuid, public.rider_verification_status, text) TO authenticated;
