import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/i18n";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/vendor/settings")({
  component: VendorSettings,
});

interface S {
  id: string;
  name: string;
  description: string | null;
  address: string;
  delivery_fee: number;
  is_open: boolean;
  contact_phone: string | null;
  image_url: string | null;
}

function VendorSettings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [s, setS] = useState<S | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("stores")
      .select("*")
      .eq("owner_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setS(data as S);
      });
  }, [user]);

  const save = async () => {
    if (!s) return;
    const { error } = await supabase
      .from("stores")
      .update({
        name: s.name,
        description: s.description,
        address: s.address,
        delivery_fee: s.delivery_fee,
        is_open: s.is_open,
        contact_phone: s.contact_phone,
        image_url: s.image_url,
      })
      .eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success(t("vendor.saved"));
  };

  if (!s)
    return <div className="p-12 text-center text-muted-foreground">{t("common.loading")}</div>;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="font-display text-2xl font-bold">{t("vendor.storeSettings")}</h1>
      <Card className="p-5 mt-4 space-y-3">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
          <div>
            <p className="font-semibold">{t("vendor.openForOrders")}</p>
            <p className="text-xs text-muted-foreground">
              {s.is_open ? t("vendor.customersCanOrder") : t("vendor.hiddenClosed")}
            </p>
          </div>
          <Switch checked={s.is_open} onCheckedChange={(v) => setS({ ...s, is_open: v })} />
        </div>
        <div>
          <Label>{t("vendor.name")}</Label>
          <Input value={s.name} onChange={(e) => setS({ ...s, name: e.target.value })} />
        </div>
        <div>
          <Label>{t("vendor.description")}</Label>
          <Textarea
            value={s.description ?? ""}
            onChange={(e) => setS({ ...s, description: e.target.value })}
          />
        </div>
        <div>
          <Label>{t("admin.address")}</Label>
          <Input value={s.address} onChange={(e) => setS({ ...s, address: e.target.value })} />
        </div>
        <div>
          <Label>{t("vendor.contactPhone")}</Label>
          <Input
            value={s.contact_phone ?? ""}
            onChange={(e) => setS({ ...s, contact_phone: e.target.value })}
          />
        </div>
        <div>
          <Label>{t("vendor.deliveryFee")}</Label>
          <Input
            type="number"
            step="0.01"
            value={s.delivery_fee}
            onChange={(e) => setS({ ...s, delivery_fee: Number(e.target.value) })}
          />
        </div>
        <div>
          <Label>{t("vendor.imageUrl")}</Label>
          <Input
            value={s.image_url ?? ""}
            onChange={(e) => setS({ ...s, image_url: e.target.value })}
          />
        </div>
        <Button variant="hero" onClick={save}>
          {t("vendor.saveChanges")}
        </Button>
      </Card>
    </div>
  );
}
