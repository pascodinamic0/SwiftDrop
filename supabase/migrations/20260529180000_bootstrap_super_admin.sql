-- Grant admin role to the bootstrap super-admin account (created in Supabase Auth).
-- Safe to re-run: ON CONFLICT DO NOTHING.

DO $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT id INTO _user_id
  FROM auth.users
  WHERE lower(email) = lower('pascodinamic00@gmail.com')
  LIMIT 1;

  IF _user_id IS NULL THEN
    RAISE NOTICE 'Bootstrap admin user not found (pascodinamic00@gmail.com). Create the user in Supabase Auth, then re-apply this migration.';
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.profiles (id, full_name)
  VALUES (_user_id, 'Super Admin')
  ON CONFLICT (id) DO NOTHING;
END $$;
