import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { dashboardFor } from "@/lib/roles";
import { useTranslation } from "@/i18n";
import type { TFunction } from "@/i18n/translate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import heroImg from "@/assets/hero.jpg";
import { toast } from "sonner";
import { z } from "zod";

const SearchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
  intent: z.enum(["rider"]).optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: (s) => SearchSchema.parse(s),
  head: () => ({ meta: [{ title: "Sign in — SwiftDrop" }] }),
  component: AuthPage,
});

function loginSchema(t: TFunction) {
  return z.object({
    email: z.string().email().max(255),
    password: z.string().min(1, t("auth.passwordRequired")).max(72),
  });
}

function signupSchema(t: TFunction) {
  return z.object({
    email: z.string().email().max(255),
    password: z.string().min(6).max(72),
    fullName: z.string().trim().min(1).max(100),
  });
}

function AuthPage() {
  const { t } = useTranslation();
  const loginZod = useMemo(() => loginSchema(t), [t]);
  const signupZod = useMemo(() => signupSchema(t), [t]);
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { user, roles, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    if (search.intent === "rider") {
      navigate({ to: "/auth/rider" });
      return;
    }
    navigate({ to: dashboardFor(roles) });
  }, [user, roles, loading, navigate, search.intent]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsed =
      mode === "signup"
        ? signupZod.safeParse({ email, password, fullName })
        : loginZod.safeParse({ email, password });
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
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success(t("auth.accountCreated"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.welcomeBackToast"));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.somethingWrong");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const bullets = [t("auth.bullet1"), t("auth.bullet2"), t("auth.bullet3")];

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="flex flex-col p-6 md:p-12 min-h-screen md:min-h-0">
        <Logo />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-4xl font-bold tracking-tight">
              {mode === "login" ? t("auth.welcomeBack") : t("auth.createAccount")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {mode === "login" ? t("auth.loginSubtitle") : t("auth.signupSubtitle")}
            </p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">{t("auth.fullName")}</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("auth.placeholderName")}
                    required
                  />
                </div>
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
                  minLength={mode === "signup" ? 6 : 1}
                />
              </div>
              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting
                  ? t("common.submitting")
                  : mode === "login"
                    ? t("auth.signIn")
                    : t("auth.createAccountBtn")}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground text-center">
              {mode === "login" ? t("auth.noAccount") : t("auth.hasAccount")}{" "}
              <button
                onClick={() => setMode(mode === "login" ? "signup" : "login")}
                className="text-primary font-semibold hover:underline"
              >
                {mode === "login" ? t("auth.signUp") : t("auth.signIn")}
              </button>
            </p>
            <p className="mt-2 text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
                {t("common.backHome")}
              </Link>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-8 text-xs text-muted-foreground border-t border-border/60 mt-auto">
          <Link to="/terms" className="hover:text-foreground">
            {t("nav.terms")}
          </Link>
          <Link to="/privacy" className="hover:text-foreground">
            {t("nav.privacy")}
          </Link>
          <Link to="/why-us" className="hover:text-foreground">
            {t("nav.whyBuyFromUs")}
          </Link>
        </div>
      </div>
      <div className="hidden md:flex relative bg-secondary text-secondary-foreground p-12 flex-col flex-1 min-h-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-10" />
        <div className="relative flex-shrink-0">
          <div className="text-xs uppercase tracking-widest text-primary font-semibold">
            {t("auth.trustedBy")}
          </div>
          <h2 className="mt-4 font-display text-4xl font-bold leading-tight">{t("auth.tagline")}</h2>
        </div>
        <div className="relative flex-1 flex items-center justify-center min-h-0 py-8">
          <div className="relative w-full max-w-lg">
            <div className="absolute -inset-3 gradient-hero rounded-3xl blur-2xl opacity-25" />
            <div className="relative rounded-3xl overflow-hidden shadow-card border border-white/10 bg-card">
              <img
                src={heroImg}
                alt={t("home.heroAlt")}
                width={1536}
                height={1152}
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
        <div className="relative flex-shrink-0 space-y-4">
          {bullets.map((s, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                {i + 1}
              </div>
              <p className="text-secondary-foreground/80 pt-0.5">{s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
