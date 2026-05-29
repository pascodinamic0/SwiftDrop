import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge, ORDER_STATUSES } from "@/components/OrderStatusBadge";
import {
  AdminEmptyState,
  AdminPage,
  AdminPageHeader,
  AdminToolbar,
} from "@/components/admin/AdminPage";
import { Package, RefreshCw, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type OrderStatus =
  | "pending_confirmation"
  | "awaiting_payment"
  | "preparing"
  | "ready"
  | "picked_up"
  | "delivered"
  | "cancelled"
  | "rejected"
  | "failed";

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

interface Row {
  id: string;
  status: OrderStatus;
  total: number;
  customer_name: string;
  delivery_address: string;
  created_at: string;
  store_id: string;
}

function AdminOrders() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const load = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id,status,total,customer_name,delivery_address,created_at,store_id")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data ?? []) as Row[]);
  };
  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      (q === "" ||
        r.customer_name.toLowerCase().includes(q.toLowerCase()) ||
        r.delivery_address.toLowerCase().includes(q.toLowerCase()) ||
        r.id.includes(q)),
  );

  const setStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Set to ${status}`);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete order?")) return;
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <AdminPage className="space-y-6">
      <AdminPageHeader
        title="Orders"
        description="Search deliveries, update status, and resolve issues."
        badge={
          <Badge variant="secondary" className="font-normal">
            {filtered.length} shown
          </Badge>
        }
        actions={
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <AdminToolbar>
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 border-0 bg-muted/50 pl-9 shadow-none focus-visible:ring-1"
            placeholder="Customer, address, or order ID…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-10 w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </AdminToolbar>

      <Card className="overflow-hidden border-border/80 bg-card/95 shadow-card">
        {filtered.length === 0 ? (
          <div className="p-6">
            <AdminEmptyState
              icon={Package}
              title="No orders"
              description="Orders will appear here as customers check out."
            />
          </div>
        ) : (
          <div className="max-h-[calc(100vh-16rem)] divide-y divide-border/60 overflow-auto">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:gap-4 sm:p-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={r.status} />
                    <span className="font-mono text-xs text-muted-foreground">
                      #{r.id.slice(0, 8)}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-medium">{r.customer_name}</p>
                  <p className="truncate text-sm text-muted-foreground">{r.delivery_address}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <div className="font-display text-xl font-bold sm:w-24 sm:text-right">
                    ${Number(r.total).toFixed(2)}
                  </div>
                  <Select value={r.status} onValueChange={(v) => setStatus(r.id, v as OrderStatus)}>
                    <SelectTrigger className="h-9 w-full min-w-[140px] sm:w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => remove(r.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminPage>
  );
}
