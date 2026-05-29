import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";
import { z } from "zod";
import { Store, ShieldCheck, LayoutDashboard } from "lucide-react";

const SearchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
});

export const Route = createFileRoute("/auth/vendor")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({ meta: [{ title: "Merchant sign in — SwiftDrop" }] }),
  component: VendorAuthPage,
});

const credSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
});

function VendorAuthPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, roles, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (roles.includes("vendor")) {
      navigate({ to: "/vendor" });
    } else {
      navigate({ to: "/become-merchant" });
    }
  }, [user, roles, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed =
      mode === "signup"
        ? credSchema.safeParse({ email, password, fullName, phone })
        : credSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              account_type: "vendor",
              full_name: fullName,
              phone,
            },
          },
        });
        if (error) throw error;
        toast.success(t("auth.accountCreated"));
        navigate({ to: "/become-merchant" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.welcomeBackToast"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 lg:px-12">
        <Link to="/" className="mb-8 inline-flex">
          <Logo />
        </Link>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          {mode === "login" ? t("auth.welcomeBack") : t("merchant.applicationTitle")}
        </h1>
        <p className="mt-2 text-muted-foreground text-sm max-w-md">
          {mode === "login"
            ? t("merchant.verifiedDesc")
            : t("merchant.joinSubtitle")}
        </p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 max-w-md">
          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">{t("auth.fullName")}</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("auth.placeholderName")}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("auth.phone")}</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t("auth.placeholderPhone")}
                  required
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("auth.placeholderEmail")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("auth.placeholderPassword")}
              required
            />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
            {submitting
              ? t("common.submitting")
              : mode === "login"
                ? t("auth.signIn")
                : t("auth.createAccountBtn")}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
          <button
            type="button"
            className="text-primary font-semibold hover:underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login" ? t("auth.signUp") : t("auth.signIn")}
          </button>
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          <Link to="/auth" className="text-primary font-semibold hover:underline">
            {t("auth.customerSignIn")}
          </Link>
        </p>
        <Link to="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground">
          {t("common.backHome")}
        </Link>
      </div>
      <div className="hidden lg:flex flex-col justify-center bg-muted/40 p-12 border-l border-border">
        <Store className="h-10 w-10 text-primary mb-4" />
        <h2 className="font-display text-2xl font-bold">{t("merchant.joinTitle")}</h2>
        <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            {t("merchant.benefit2Desc")}
          </li>
          <li className="flex gap-2">
            <LayoutDashboard className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            {t("merchant.benefit1Desc")}
          </li>
        </ul>
      </div>
    </div>
  );
}
