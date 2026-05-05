import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Shield, ShieldOff } from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users — Admin" }] }),
  component: AdminUsers,
});

type Role = "customer" | "delivery_agent" | "admin";
interface URow {
  id: string; full_name: string | null; phone: string | null;
  avg_rating: number | null; total_ratings: number | null; created_at: string;
  roles: Role[];
}

function AdminUsers() {
  const [rows, setRows] = useState<URow[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,phone,avg_rating,total_ratings,created_at").order("created_at", { ascending: false }).limit(200),
      supabase.from("user_roles").select("user_id,role"),
    ]);
    const map = new Map<string, Role[]>();
    (roles ?? []).forEach((r) => {
      const list = map.get(r.user_id) ?? [];
      list.push(r.role as Role);
      map.set(r.user_id, list);
    });
    setRows((profiles ?? []).map((p) => ({ ...p, roles: map.get(p.id) ?? [] })) as URow[]);
  };
  useEffect(() => { load(); }, []);

  const toggleRole = async (userId: string, role: Role, has: boolean) => {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
    }
    toast.success("Roles updated");
    load();
  };

  const filtered = rows.filter((u) =>
    q === "" ||
    (u.full_name ?? "").toLowerCase().includes(q.toLowerCase()) ||
    (u.phone ?? "").includes(q) ||
    u.id.includes(q)
  );

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Users</h1>
        <p className="text-muted-foreground text-sm">{filtered.length} of {rows.length} shown</p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search name, phone or id…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        <div className="divide-y divide-border max-h-[70vh] overflow-auto">
          {filtered.map((u) => (
            <div key={u.id} className="flex flex-col md:flex-row md:items-center gap-3 p-4 hover:bg-muted/30">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{u.full_name || "Unnamed"} {u.phone && <span className="text-muted-foreground">· {u.phone}</span>}</p>
                <p className="text-xs text-muted-foreground font-mono">{u.id}</p>
                <div className="flex gap-1 mt-1">
                  {u.roles.map((r) => <Badge key={r} variant="secondary" className="text-xs">{r}</Badge>)}
                  {u.roles.length === 0 && <span className="text-xs text-muted-foreground">no roles</span>}
                </div>
              </div>
              <div className="text-xs text-right">⭐ {Number(u.avg_rating ?? 0).toFixed(1)} <span className="text-muted-foreground">({u.total_ratings ?? 0})</span></div>
              <div className="flex flex-wrap gap-2">
                {(["customer", "delivery_agent", "admin"] as Role[]).map((role) => {
                  const has = u.roles.includes(role);
                  return (
                    <Button
                      key={role}
                      size="sm"
                      variant={has ? "default" : "outline"}
                      onClick={() => toggleRole(u.id, role, has)}
                    >
                      {has ? <Shield className="h-3 w-3" /> : <ShieldOff className="h-3 w-3" />}
                      {role}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No users</p>}
        </div>
      </Card>
    </div>
  );
}
