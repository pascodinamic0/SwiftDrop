-- Keep profiles.updated_at in sync with other public tables using touch_updated_at
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
