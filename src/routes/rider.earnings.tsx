import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/i18n";
import { Card } from "@/components/ui/card";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { DollarSign, Package, Wallet } from "lucide-react";

export const Route = createFileRoute("/rider/earnings")({
  component: Earnings,
});

interface Profile {
  total_earnings: number;
  total_deliveries: number;
  cash_collected: number;
}
interface Done {
  id: string;
  delivery_fee: number;
  delivered_at: string | null;
  status: string;
}

function Earnings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [history, setHistory] = useState<Done[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, o] = await Promise.all([
        supabase
          .from("rider_profiles")
          .select("total_earnings,total_deliveries,cash_collected")
          .eq("id", user.id)
          .single(),
        supabase
          .from("orders")
          .select("id,delivery_fee,delivered_at,status")
          .eq("rider_id", user.id)
          .eq("status", "delivered")
          .order("delivered_at", { ascending: false })
          .limit(50),
      ]);
      setProfile(p.data as Profile | null);
      setHistory((o.data ?? []) as Done[]);
    })();
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <h1 className="font-display text-2xl font-bold">{t("rider.earnings")}</h1>
      <div className="grid grid-cols-3 gap-3 mt-4">
        <Card className="p-4">
          <DollarSign className="h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground mt-1">{t("rider.totalEarned")}</p>
          <p className="font-display text-2xl font-bold">
            ${Number(profile?.total_earnings ?? 0).toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <Wallet className="h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground mt-1">{t("rider.cashCollected")}</p>
          <p className="font-display text-2xl font-bold">
            ${Number(profile?.cash_collected ?? 0).toFixed(2)}
          </p>
        </Card>
        <Card className="p-4">
          <Package className="h-4 w-4 text-primary" />
          <p className="text-xs text-muted-foreground mt-1">{t("rider.deliveries")}</p>
          <p className="font-display text-2xl font-bold">{profile?.total_deliveries ?? 0}</p>
        </Card>
      </div>

      <h2 className="font-display text-xl font-bold mt-8">{t("rider.recentDeliveries")}</h2>
      <div className="mt-3 space-y-2">
        {history.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground text-sm">
            {t("rider.noCompleted")}
          </Card>
        ) : (
          history.map((h) => (
            <Card key={h.id} className="p-3 flex items-center justify-between">
              <div>
                <OrderStatusBadge status={h.status} />
                <span className="ml-2 text-xs text-muted-foreground font-mono">
                  #{h.id.slice(0, 8)}
                </span>
                <p className="text-xs text-muted-foreground mt-1">
                  {h.delivered_at ? new Date(h.delivered_at).toLocaleString() : ""}
                </p>
              </div>
              <div className="font-display text-lg font-bold">
                +${Number(h.delivery_fee).toFixed(2)}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
