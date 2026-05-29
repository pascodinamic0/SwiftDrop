-- Demo catalog for local / fresh projects (idempotent: run once on empty DB)
-- Run after migrations: `supabase db reset` applies this automatically.
-- Stores use manual mode until an admin links a vendor and switches to dashboard mode.

INSERT INTO public.stores (name, description, category, address, lat, lng, delivery_fee, is_open, mode)
SELECT * FROM (VALUES
  ('Green Bowl Kitchen', 'Fresh salads, grain bowls, and smoothies.', 'food'::public.store_category, '12 Market St, Downtown', 40.7128::double precision, -74.0060::double precision, 2.50, true, 'manual'::public.store_mode),
  ('Sunrise Coffee Co.', 'Specialty coffee, pastries, and light bites.', 'coffee', '88 Bean Ave', 40.7142, -74.0045, 1.99, true, 'manual'),
  ('Corner Mart 24/7', 'Snacks, drinks, and everyday essentials.', 'convenience', '400 Main Rd', 40.7105, -74.0082, 3.00, true, 'manual'),
  ('Bloom & Petal', 'Same-day flower delivery.', 'flowers', '5 Garden Ln', 40.7160, -74.0020, 4.50, true, 'manual'),
  ('City Pharmacy Plus', 'OTC wellness and personal care.', 'pharmacy', '77 Health Blvd', 40.7090, -74.0100, 2.00, true, 'manual')
) AS v(name, description, category, address, lat, lng, delivery_fee, is_open, mode)
WHERE NOT EXISTS (SELECT 1 FROM public.stores LIMIT 1);
