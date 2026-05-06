-- ============= CLEAN SLATE: drop old parcel-delivery model =============
DROP TABLE IF EXISTS public.ratings CASCADE;
DROP TABLE IF EXISTS public.deliveries CASCADE;
DROP TABLE IF EXISTS public.agent_profiles CASCADE;
DROP TABLE IF EXISTS public.pricing_config CASCADE;
DROP TYPE IF EXISTS public.delivery_status CASCADE;
DROP TYPE IF EXISTS public.delivery_type CASCADE;
DROP TYPE IF EXISTS public.package_size CASCADE;
DROP TYPE IF EXISTS public.vehicle_type CASCADE;

-- ============= ROLES =============
-- Add 'vendor' to app_role enum (keep customer/delivery_agent/admin)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor';

-- ============= ENUMS =============
CREATE TYPE public.store_category AS ENUM ('food', 'grocery', 'pharmacy', 'other');
CREATE TYPE public.store_mode AS ENUM ('manual', 'dashboard');
CREATE TYPE public.order_status AS ENUM (
  'pending_confirmation',
  'awaiting_payment',
  'preparing',
  'ready',
  'picked_up',
  'delivered',
  'cancelled',
  'rejected',
  'failed'
);
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'paid', 'refunded');
CREATE TYPE public.vehicle_type AS ENUM ('foot', 'bike', 'motorbike', 'car');
CREATE TYPE public.offer_status AS ENUM ('offered', 'accepted', 'declined', 'expired', 'taken');

-- ============= STORES =============
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  category store_category NOT NULL DEFAULT 'food',
  image_url text,
  address text NOT NULL,
  lat double precision,
  lng double precision,
  mode store_mode NOT NULL DEFAULT 'manual',
  is_open boolean NOT NULL DEFAULT true,
  delivery_fee numeric NOT NULL DEFAULT 2.00,
  contact_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stores readable" ON public.stores
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner or admin manages store" ON public.stores
  FOR ALL TO authenticated
  USING (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = owner_id OR has_role(auth.uid(), 'admin'));

-- ============= MENU CATEGORIES =============
CREATE TABLE public.menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu cats readable" ON public.menu_categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "store owner or admin manages cats" ON public.menu_categories
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
  );

-- ============= MENU ITEMS =============
CREATE TABLE public.menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu items readable" ON public.menu_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "store owner or admin manages items" ON public.menu_items
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
  );

-- ============= RIDER PROFILES =============
CREATE TABLE public.rider_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle vehicle_type NOT NULL DEFAULT 'bike',
  is_online boolean NOT NULL DEFAULT false,
  current_lat double precision,
  current_lng double precision,
  total_earnings numeric NOT NULL DEFAULT 0,
  total_deliveries int NOT NULL DEFAULT 0,
  cash_collected numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rider profiles readable" ON public.rider_profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "rider manages own profile" ON public.rider_profiles
  FOR ALL TO authenticated
  USING (auth.uid() = id OR has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = id OR has_role(auth.uid(), 'admin'));

-- ============= ORDERS =============
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  rider_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending_confirmation',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_fee numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  cash_collected numeric NOT NULL DEFAULT 0,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  delivery_address text NOT NULL,
  delivery_lat double precision,
  delivery_lng double precision,
  notes text,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  paid_at timestamptz,
  ready_at timestamptz,
  picked_up_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders visible to involved parties" ON public.orders
  FOR SELECT TO authenticated USING (
    auth.uid() = customer_id
    OR auth.uid() = rider_id
    OR has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
    OR (status = 'ready' AND rider_id IS NULL AND has_role(auth.uid(), 'delivery_agent'))
  );

CREATE POLICY "customer creates own order" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "involved parties update order" ON public.orders
  FOR UPDATE TO authenticated USING (
    auth.uid() = customer_id
    OR auth.uid() = rider_id
    OR has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
    OR (status = 'ready' AND rider_id IS NULL AND has_role(auth.uid(), 'delivery_agent'))
  ) WITH CHECK (
    auth.uid() = customer_id
    OR auth.uid() = rider_id
    OR has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid())
    OR has_role(auth.uid(), 'delivery_agent')
  );

CREATE POLICY "admins delete orders" ON public.orders
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'));

-- ============= ORDER ITEMS =============
CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id uuid REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name text NOT NULL,
  unit_price numeric NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  line_total numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order items follow order" ON public.order_items
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (
        o.customer_id = auth.uid()
        OR o.rider_id = auth.uid()
        OR has_role(auth.uid(), 'admin')
        OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = o.store_id AND s.owner_id = auth.uid())
        OR (o.status = 'ready' AND o.rider_id IS NULL AND has_role(auth.uid(), 'delivery_agent'))
      )
    )
  );

CREATE POLICY "customer inserts own order items" ON public.order_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
  );

-- ============= DELIVERY OFFERS =============
CREATE TABLE public.delivery_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status offer_status NOT NULL DEFAULT 'offered',
  created_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE (order_id, rider_id)
);
ALTER TABLE public.delivery_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rider sees own offers" ON public.delivery_offers
  FOR SELECT TO authenticated USING (
    auth.uid() = rider_id OR has_role(auth.uid(), 'admin')
  );
CREATE POLICY "rider responds to own offer" ON public.delivery_offers
  FOR UPDATE TO authenticated USING (auth.uid() = rider_id OR has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = rider_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "system inserts offers" ON public.delivery_offers
  FOR INSERT TO authenticated WITH CHECK (
    has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.orders o JOIN public.stores s ON s.id = o.store_id
               WHERE o.id = order_id AND s.owner_id = auth.uid())
  );

-- ============= TRIGGERS =============
-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER stores_touch BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER menu_items_touch BEFORE UPDATE ON public.menu_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER rider_profiles_touch BEFORE UPDATE ON public.rider_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Update rider stats on delivery
CREATE OR REPLACE FUNCTION public.handle_order_delivered()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' AND NEW.rider_id IS NOT NULL THEN
    UPDATE public.rider_profiles
    SET total_deliveries = total_deliveries + 1,
        total_earnings = total_earnings + NEW.delivery_fee,
        cash_collected = cash_collected + NEW.cash_collected,
        updated_at = now()
    WHERE id = NEW.rider_id;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER orders_delivered_stats AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_order_delivered();

-- ============= REALTIME =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_offers;

-- ============= INDEXES =============
CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_store ON public.orders(store_id);
CREATE INDEX idx_orders_rider ON public.orders(rider_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_menu_items_store ON public.menu_items(store_id);
CREATE INDEX idx_offers_rider ON public.delivery_offers(rider_id);