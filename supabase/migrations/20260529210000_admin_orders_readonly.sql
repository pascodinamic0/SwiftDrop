-- Admins may view all orders but cannot change or delete them; stores and riders manage fulfillment.

DROP POLICY IF EXISTS "involved parties update order" ON public.orders;

CREATE POLICY "involved parties update order" ON public.orders
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = customer_id
    OR auth.uid() = rider_id
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
    OR (
      status = 'ready'
      AND rider_id IS NULL
      AND public.is_verified_rider(auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() = customer_id
    OR auth.uid() = rider_id
    OR EXISTS (
      SELECT 1 FROM public.stores s
      WHERE s.id = store_id AND s.owner_id = auth.uid()
    )
    OR public.is_verified_rider(auth.uid())
  );

DROP POLICY IF EXISTS "admins delete orders" ON public.orders;
