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
import { Bike, ShieldCheck, Clock } from "lucide-react";

const SearchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
});

export const Route = createFileRoute("/auth/rider")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({ meta: [{ title: "Rider sign in — SwiftDrop" }] }),
  component: RiderAuthPage,
});

const credSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(6).max(72),
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
});

function RiderAuthPage() {
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
    if (roles.includes("delivery_agent")) {
      navigate({ to: "/rider" });
    } else {
      navigate({ to: "/become-rider" });
    }
  }, [user, roles, loading, navigate]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed = credSchema.safeParse({
      email,
      password,
      fullName: mode === "signup" ? fullName : undefined,
      phone: mode === "signup" ? phone : undefined,
    });
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
            emailRedirectTo: `${window.location.origin}/become-rider`,
            data: {
              full_name: fullName,
              phone,
              account_type: "rider",
            },
          },
        });
        if (error) throw error;
        toast.success(t("auth.riderAccountCreated"));
        navigate({ to: "/become-rider" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.riderWelcomeBack"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.somethingWrong"));
    } finally {
      setSubmitting(false);
    }
  };

  const riderBullets = [
    { icon: ShieldCheck, text: t("auth.riderBullet2") },
    { icon: Clock, text: t("auth.riderBullet3") },
    { icon: Bike, text: t("auth.riderBullet4") },
  ];

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex flex-col p-6 md:p-12 min-h-screen md:min-h-0">
        <Logo />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <div className="inline-flex h-12 w-12 rounded-xl bg-primary items-center justify-center mb-4">
              <Bike className="h-6 w-6 text-primary-foreground" />
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              {mode === "login" ? t("auth.riderLogin") : t("auth.riderCreate")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {mode === "login" ? t("auth.riderLoginSubtitle") : t("auth.riderSignupSubtitle")}
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("auth.fullLegalName")}</Label>
                    <Input
                      id="name"
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
                  minLength={6}
                />
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                {submitting
                  ? t("common.submitting")
                  : mode === "login"
                    ? t("auth.signIn")
                    : t("auth.createRiderAccount")}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground text-center">
              {mode === "login" ? t("auth.riderNoAccount") : t("auth.riderHasAccount")}{" "}
              <button
                type="button"
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary font-semibold hover:underline"
              >
                {mode === "login" ? t("auth.signUp") : t("auth.signIn")}
              </button>
            </p>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              <Link to="/auth" className="text-primary font-semibold hover:underline">
                {t("auth.customerSignIn")}
              </Link>
            </p>
            <p className="mt-2 text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
                {t("common.backHome")}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden md:flex relative bg-secondary text-secondary-foreground p-12 flex-col flex-1 min-h-0">
        <h2 className="font-display text-3xl font-bold leading-tight">{t("auth.riderTagline")}</h2>
        <p className="mt-3 text-secondary-foreground/80 max-w-md">{t("auth.riderBullet1")}</p>
        <ul className="mt-10 space-y-5">
          {riderBullets.map(({ icon: Icon, text }) => (
            <li key={text} className="flex gap-3 items-start">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-secondary-foreground/90 pt-1">{text}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
