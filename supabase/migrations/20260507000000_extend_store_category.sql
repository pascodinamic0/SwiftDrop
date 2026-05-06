-- More store types for /shop filters (browse UX)
ALTER TYPE public.store_category ADD VALUE IF NOT EXISTS 'coffee';
ALTER TYPE public.store_category ADD VALUE IF NOT EXISTS 'bakery';
ALTER TYPE public.store_category ADD VALUE IF NOT EXISTS 'convenience';
ALTER TYPE public.store_category ADD VALUE IF NOT EXISTS 'flowers';
ALTER TYPE public.store_category ADD VALUE IF NOT EXISTS 'pets';
