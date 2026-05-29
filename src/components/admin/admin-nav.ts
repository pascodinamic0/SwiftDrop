export const ADMIN_PAGE_META: Record<string, { title: string; description: string }> = {
  "/admin": {
    title: "Overview",
    description: "Platform health at a glance",
  },
  "/admin/orders": {
    title: "Orders",
    description: "Track and update delivery status",
  },
  "/admin/stores": {
    title: "Stores",
    description: "Create stores and assign vendors",
  },
  "/admin/users": {
    title: "Users",
    description: "Manage roles and access",
  },
  "/admin/riders": {
    title: "Riders",
    description: "Review applications and fleet status",
  },
  "/admin/settings": {
    title: "Settings",
    description: "Your admin account",
  },
};

export function getAdminPageMeta(pathname: string) {
  if (ADMIN_PAGE_META[pathname]) return ADMIN_PAGE_META[pathname];
  const base = Object.keys(ADMIN_PAGE_META)
    .filter((p) => p !== "/admin")
    .find((p) => pathname.startsWith(p + "/"));
  if (base) return ADMIN_PAGE_META[base];
  return { title: "Admin", description: "SwiftDrop console" };
}
