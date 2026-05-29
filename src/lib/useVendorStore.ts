import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { VendorStore } from "@/lib/roles";

export function useVendorStore(userId: string | undefined) {
  const [store, setStore] = useState<VendorStore | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setStore(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("stores")
      .select("*")
      .eq("owner_id", userId)
      .order("applied_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setStore((data as VendorStore | null) ?? null);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { store, loading, refresh };
}
