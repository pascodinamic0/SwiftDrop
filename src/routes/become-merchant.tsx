import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/i18n";
import type { TFunction } from "@/i18n/translate";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { useVendorStore } from "@/lib/useVendorStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Store, ShieldCheck, LayoutDashboard, Sparkles } from "lucide-react";
import { z } from "zod";
import type { StoreCategoryId } from "@/lib/store-categories";
import { STORE_CATEGORY_ORDER } from "@/lib/store-categories";
import { getStoreCategoryMeta } from "@/lib/store-categories-i18n";
import { isVerifiedVendorStore } from "@/lib/roles";

export const Route = createFileRoute("/become-merchant")({
  head: () => ({ meta: [{ title: "Become a merchant — SwiftDrop" }] }),
  component: BecomeMerchant,
});

function applicationSchema(t: TFunction) {
  return z.object({
    storeName: z.string().trim().min(2, t("merchant.validation.storeName")).max(120),
    address: z.string().trim().min(5, t("merchant.validation.address")).max(200),
    phone: z.string().trim().min(7, t("merchant.validation.phone")).max(20),
    deliveryFee: z.coerce.number().min(0, t("merchant.validation.fee")),
    description: z.string().trim().max(500).optional(),
    applicationNotes: z.string().trim().max(500).optional(),
    termsAccepted: z.literal(true, {
      errorMap: () => ({ message: t("merchant.validation.terms") }),
    }),
  });
}

function BecomeMerchant() {
  const { t } = useTranslation();
  const schema = useMemo(() => applicationSchema(t), [t]);
  const { user, roles, refreshRoles } = useAuth();
  const { store, loading: storeLoading, refresh: refreshStore } = useVendorStore(user?.id);
  const navigate = useNavigate();

  const [storeName, setStoreName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState<StoreCategoryId>("food");
  const [deliveryFee, setDeliveryFee] = useState("2.50");
  const [contactPhone, setContactPhone] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [applicationNotes, setApplicationNotes] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isVendor = roles.includes("vendor");
  const verified = isVerifiedVendorStore(store);
  const canReapply = store?.verification_status === "rejected";

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.phone) setContactPhone(data.phone);
    })();
  }, [user]);

  useEffect(() => {
    if (!store) return;
    setStoreName(store.name);
    setDescription(store.description ?? "");
    setAddress(store.address);
    if (store.category && STORE_CATEGORY_ORDER.includes(store.category as StoreCategoryId)) {
      setCategory(store.category as StoreCategoryId);
    }
    setDeliveryFee(String(store.delivery_fee));
    setContactPhone(store.contact_phone ?? "");
    setImageUrl(store.image_url ?? "");
    setApplicationNotes(store.application_notes ?? "");
  }, [store]);

  const submitApplication = async () => {
    if (!user) {
      navigate({ to: "/auth/vendor", search: { mode: "signup" } });
      return;
    }

    const parsed = schema.safeParse({
      storeName,
      address,
      phone: contactPhone,
      deliveryFee,
      description: description || undefined,
      applicationNotes: applicationNotes || undefined,
      termsAccepted: termsAccepted ? true : undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      await supabase
        .from("profiles")
        .update({ phone: contactPhone })
        .eq("id", user.id);

      if (!isVendor) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: user.id, role: "vendor" });
        if (roleError && !roleError.message.includes("duplicate")) throw roleError;
      }

      const payload = {
        name: storeName.trim(),
        description: description.trim() || null,
        address: address.trim(),
        category,
        delivery_fee: parsed.data.deliveryFee,
        contact_phone: contactPhone.trim(),
        image_url: imageUrl.trim() || null,
        application_notes: applicationNotes.trim() || null,
        owner_id: user.id,
        mode: "dashboard" as const,
        is_open: false,
        verification_status: "pending" as const,
        rejection_reason: null,
        verified_at: null,
        verified_by: null,
        applied_at: new Date().toISOString(),
      };

      if (store && canReapply) {
        const { error } = await supabase.from("stores").update(payload).eq("id", store.id);
        if (error) throw error;
      } else if (!store) {
        const { error } = await supabase.from("stores").insert(payload);
        if (error) throw error;
      } else {
        toast.error(t("merchant.submitFailed"));
        return;
      }

      await refreshRoles();
      await refreshStore();
      toast.success(t("merchant.applicationSubmitted"));
      navigate({ to: "/vendor" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("merchant.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const showForm = !store || canReapply;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary items-center justify-center mb-4">
            <Store className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
            {t("merchant.joinTitle")}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">{t("merchant.joinSubtitle")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-10">
          {[
            { i: LayoutDashboard, title: t("merchant.benefit1Title"), d: t("merchant.benefit1Desc") },
            { i: ShieldCheck, title: t("merchant.benefit2Title"), d: t("merchant.benefit2Desc") },
            { i: Sparkles, title: t("merchant.benefit3Title"), d: t("merchant.benefit3Desc") },
          ].map((f) => (
            <Card key={f.title} className="p-5">
              <f.i className="h-5 w-5 text-primary" />
              <h3 className="font-semibold mt-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6 mt-8 max-w-2xl mx-auto">
          {storeLoading ? (
            <p className="text-center text-muted-foreground">{t("common.loadingShort")}</p>
          ) : store && verified ? (
            <>
              <h2 className="font-display text-2xl font-bold">{t("merchant.verifiedTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t("merchant.verifiedDesc")}</p>
              <Button variant="hero" size="lg" className="w-full mt-4" onClick={() => navigate({ to: "/vendor" })}>
                {t("merchant.openDashboard")}
              </Button>
            </>
          ) : store?.verification_status === "pending" ? (
            <>
              <h2 className="font-display text-2xl font-bold">{t("merchant.submittedTitle")}</h2>
              <p className="text-sm text-muted-foreground mt-2">{t("merchant.submittedDesc")}</p>
              <Button variant="hero" size="lg" className="w-full mt-4" onClick={() => navigate({ to: "/vendor" })}>
                {t("merchant.viewStatus")}
              </Button>
            </>
          ) : showForm ? (
            <>
              <h2 className="font-display text-2xl font-bold">
                {canReapply ? t("merchant.updateApplication") : t("merchant.applicationTitle")}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">{t("merchant.formIntro")}</p>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="storeName">{t("merchant.storeName")}</Label>
                  <Input id="storeName" value={storeName} onChange={(e) => setStoreName(e.target.value)} required />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">{t("admin.address")}</Label>
                  <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t("merchant.contactPhone")}</Label>
                  <Input id="phone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee">{t("merchant.deliveryFee")}</Label>
                  <Input
                    id="fee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.category")}</Label>
                  <Select value={category} onValueChange={(v) => setCategory(v as StoreCategoryId)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STORE_CATEGORY_ORDER.map((id) => (
                        <SelectItem key={id} value={id}>
                          {getStoreCategoryMeta(id, t).label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">{t("admin.imageUrl")}</Label>
                  <Input id="image" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="desc">{t("admin.description")}</Label>
                  <Textarea id="desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="notes">{t("rider.additionalNotes")}</Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    value={applicationNotes}
                    onChange={(e) => setApplicationNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(v) => setTermsAccepted(v === true)}
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed font-normal">
                  {t("merchant.termsCheckbox")}
                </Label>
              </div>

              <Button
                variant="hero"
                size="lg"
                className="w-full mt-5"
                onClick={submitApplication}
                disabled={submitting}
              >
                {submitting ? t("common.submittingDots") : t("merchant.submitApplication")}
              </Button>
              {!user && (
                <p className="text-center text-sm text-muted-foreground mt-3">
                  {t("merchant.alreadyMerchant")}{" "}
                  <Link to="/auth/vendor" className="text-primary font-semibold hover:underline">
                    {t("auth.signIn")}
                  </Link>
                </p>
              )}
            </>
          ) : null}
        </Card>
      </div>
      <SiteFooter />
    </div>
  );
}
