import { useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import type { TFunction } from "@/i18n/translate";

function changePasswordSchema(t: TFunction) {
  return z
    .object({
      currentPassword: z.string().min(1, t("password.currentRequired")),
      newPassword: z.string().min(6, t("password.newMin")).max(72),
      confirmPassword: z.string().min(1, t("password.confirmRequired")),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t("password.mismatch"),
      path: ["confirmPassword"],
    });
}

export function ChangePasswordForm() {
  const { t } = useTranslation();
  const schema = useMemo(() => changePasswordSchema(t), [t]);
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.email) {
      toast.error(t("password.mustSignIn"));
      return;
    }

    const parsed = schema.safeParse({
      currentPassword,
      newPassword,
      confirmPassword,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: parsed.data.currentPassword,
      });
      if (verifyError) {
        toast.error(t("password.incorrect"));
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: parsed.data.newPassword,
      });
      if (error) throw error;

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success(t("password.updated"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("password.updateFailed");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="current-password">{t("password.current")}</Label>
        <Input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">{t("password.new")}</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
        />
        <p className="text-xs text-muted-foreground">{t("password.hint")}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">{t("password.confirm")}</Label>
        <Input
          id="confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      <Button type="submit" variant="hero" disabled={submitting}>
        {submitting ? t("common.updating") : t("password.updateBtn")}
      </Button>
    </form>
  );
}
