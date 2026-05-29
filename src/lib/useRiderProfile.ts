import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { RiderProfile } from "@/lib/roles";

export function useRiderProfile() {
  const { user, roles } = useAuth();
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user || !roles.includes("delivery_agent")) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from("rider_profiles").select("*").eq("id", user.id).maybeSingle();
    setProfile((data as RiderProfile | null) ?? null);
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, [user?.id, roles.join(",")]);

  return { profile, loading, refresh };
}
