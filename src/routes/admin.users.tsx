import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type AppRole = "customer" | "delivery_agent" | "admin" | "vendor";
const ALL_ROLES: AppRole[] = ["customer", "delivery_agent", "vendor", "admin"];

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

interface P { id: string; full_name: string | null; phone: string | null; }

function AdminUsers() {
  const [users, setUsers] = useState<P[]>([]);
  const [roles, setRoles] = useState<Record<string, AppRole[]>>({});

  const load = async () => {
    const { data: ps } = await supabase.from("profiles").select("id,full_name,phone").order("full_name");
    const list = (ps ?? []) as P[]; setUsers(list);
    const { data: rs } = await supabase.from("user_roles").select("user_id,role");
    const m: Record<string, AppRole[]> = {};
    ((rs ?? []) as { user_id: string; role: AppRole }[]).forEach((r) => { (m[r.user_id] ||= []).push(r.role); });
    setRoles(m);
  };
  useEffect(() => { load(); }, []);

  const toggleRole = async (uid: string, role: AppRole) => {
    const has = (roles[uid] ?? []).includes(role);
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Updated"); load();
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="font-display text-3xl font-bold">Users ({users.length})</h1>
      <div className="space-y-2">
        {users.map((u) => (
          <Card key={u.id} className="p-4 flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{u.full_name || "—"}</p>
              <p className="text-xs text-muted-foreground font-mono">{u.id.slice(0, 8)} · {u.phone}</p>
            </div>
            <div className="flex gap-1 flex-wrap">
              {(roles[u.id] ?? []).map((r) => <Badge key={r} variant="secondary">{r}</Badge>)}
            </div>
            <div className="flex gap-1">
              {ALL_ROLES.map((r) => (
                <Button key={r} variant={(roles[u.id] ?? []).includes(r) ? "default" : "outline"} size="sm" onClick={() => toggleRole(u.id, r)}>{r}</Button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
