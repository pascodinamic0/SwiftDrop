
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('customer', 'delivery_agent', 'admin');
CREATE TYPE public.package_size AS ENUM ('small', 'medium', 'large');
CREATE TYPE public.delivery_type AS ENUM ('human', 'drone');
CREATE TYPE public.delivery_status AS ENUM ('pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled');
CREATE TYPE public.vehicle_type AS ENUM ('foot', 'bike', 'car', 'van');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_ratings INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- AGENT PROFILES
CREATE TABLE public.agent_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle vehicle_type NOT NULL DEFAULT 'bike',
  is_online BOOLEAN NOT NULL DEFAULT false,
  current_lat DOUBLE PRECISION,
  current_lng DOUBLE PRECISION,
  total_earnings NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_deliveries INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_profiles ENABLE ROW LEVEL SECURITY;

-- DELIVERIES
CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pickup_address TEXT NOT NULL,
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  dropoff_address TEXT NOT NULL,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  package_size package_size NOT NULL DEFAULT 'small',
  delivery_type delivery_type NOT NULL DEFAULT 'human',
  status delivery_status NOT NULL DEFAULT 'pending',
  distance_km NUMERIC(8,2) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- RATINGS
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE UNIQUE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stars INT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- PRICING CONFIG (single row)
CREATE TABLE public.pricing_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  base_fare NUMERIC(10,2) NOT NULL DEFAULT 1.00,
  per_km NUMERIC(10,2) NOT NULL DEFAULT 0.50,
  size_small NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  size_medium NUMERIC(4,2) NOT NULL DEFAULT 1.5,
  size_large NUMERIC(4,2) NOT NULL DEFAULT 2.0,
  drone_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.8,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.pricing_config ENABLE ROW LEVEL SECURITY;
INSERT INTO public.pricing_config (id) VALUES (1);

-- POLICIES: profiles
CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- POLICIES: user_roles
CREATE POLICY "users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users insert own non-admin role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role <> 'admin');
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- POLICIES: agent_profiles
CREATE POLICY "agent profiles readable" ON public.agent_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent manages own profile" ON public.agent_profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- POLICIES: deliveries
CREATE POLICY "customer reads own deliveries" ON public.deliveries FOR SELECT TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = agent_id OR (status = 'pending' AND public.has_role(auth.uid(), 'delivery_agent')) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "customer creates delivery" ON public.deliveries FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "customer cancels own pending" ON public.deliveries FOR UPDATE TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = agent_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete deliveries" ON public.deliveries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- POLICIES: ratings
CREATE POLICY "ratings readable" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "customer rates own delivery" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);

-- POLICIES: pricing_config
CREATE POLICY "pricing readable" ON public.pricing_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin updates pricing" ON public.pricing_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- TRIGGER: auto-create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- TRIGGER: update agent rating aggregates after rating insert
CREATE OR REPLACE FUNCTION public.update_agent_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET total_ratings = total_ratings + 1,
      avg_rating = (
        SELECT ROUND(AVG(stars)::numeric, 2) FROM public.ratings WHERE agent_id = NEW.agent_id
      ),
      updated_at = now()
  WHERE id = NEW.agent_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_rating_created AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION public.update_agent_rating();

-- TRIGGER: bump earnings on delivered
CREATE OR REPLACE FUNCTION public.handle_delivery_complete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' AND NEW.agent_id IS NOT NULL THEN
    UPDATE public.agent_profiles
    SET total_earnings = total_earnings + NEW.price,
        total_deliveries = total_deliveries + 1,
        updated_at = now()
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_delivery_status_change BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION public.handle_delivery_complete();

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_profiles;
