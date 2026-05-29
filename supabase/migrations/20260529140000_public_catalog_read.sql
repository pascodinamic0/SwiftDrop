-- Allow guests to browse the marketplace catalog before signing in
CREATE POLICY "stores readable by anon" ON public.stores
  FOR SELECT TO anon USING (true);

CREATE POLICY "menu cats readable by anon" ON public.menu_categories
  FOR SELECT TO anon USING (true);

CREATE POLICY "menu items readable by anon" ON public.menu_items
  FOR SELECT TO anon USING (is_available = true);
