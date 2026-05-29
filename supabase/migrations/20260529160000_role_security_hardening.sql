-- Phase 1: Restrict self-service role grants; admin RPCs for vendor + store linking

-- Replace permissive self-insert (any non-admin role) with delivery_agent only
DROP POLICY IF EXISTS "users insert own non-admin role" ON public.user_roles;

CREATE POLICY "users insert own delivery_agent role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'delivery_agent');

-- Admin-only: assign vendor role to a user
CREATE OR REPLACE FUNCTION public.assign_vendor_role(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'vendor')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_vendor_role(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.assign_vendor_role(uuid) TO authenticated;

-- Admin-only: resolve auth user id by email (for store owner linking)
CREATE OR REPLACE FUNCTION public.resolve_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  uid uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
  RETURN uid;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_user_id_by_email(text) TO authenticated;

-- Admin-only: link store owner and ensure vendor role
CREATE OR REPLACE FUNCTION public.link_store_owner(p_store_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin role required';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id) THEN
    RAISE EXCEPTION 'Store not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  PERFORM public.assign_vendor_role(p_user_id);

  UPDATE public.stores
  SET owner_id = p_user_id, updated_at = now()
  WHERE id = p_store_id;
END;
$$;

REVOKE ALL ON FUNCTION public.link_store_owner(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.link_store_owner(uuid, uuid) TO authenticated;

-- Tighten order visibility: riders see only assigned orders or unassigned ready pool
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
      public.has_role(auth.uid(), 'delivery_agent')
      AND rider_id IS NULL
      AND status = 'ready'
    )
  );

-- Match order_items SELECT to tightened orders policy
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
          public.has_role(auth.uid(), 'delivery_agent')
          AND o.rider_id IS NULL
          AND o.status = 'ready'
        )
      )
    )
  );
