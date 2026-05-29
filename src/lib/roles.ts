import type { AppRole } from "@/lib/auth";

export type RiderVerificationStatus = "pending" | "approved" | "rejected";

export interface RiderProfile {
  id: string;
  vehicle: "foot" | "bike" | "motorbike" | "car";
  is_online: boolean;
  verification_status: RiderVerificationStatus;
  date_of_birth: string | null;
  home_address: string | null;
  city: string | null;
  government_id: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  license_plate: string | null;
  application_notes: string | null;
  rejection_reason: string | null;
  applied_at: string | null;
  verified_at: string | null;
  total_earnings: number;
  total_deliveries: number;
  cash_collected: number;
}

export function isDeliveryAgent(roles: AppRole[]) {
  return roles.includes("delivery_agent");
}

export function isRiderOnly(roles: AppRole[]) {
  return isDeliveryAgent(roles) && !roles.includes("admin") && !roles.includes("vendor");
}

export function dashboardFor(roles: AppRole[]): string {
  if (roles.includes("admin")) return "/admin";
  if (roles.includes("vendor")) return "/vendor";
  if (roles.includes("delivery_agent")) return "/rider";
  return "/shop";
}

export function customerHomeFor(roles: AppRole[]): string {
  if (isRiderOnly(roles)) return "/rider";
  return dashboardFor(roles);
}

export function isVerifiedRider(profile: Pick<RiderProfile, "verification_status"> | null | undefined) {
  return profile?.verification_status === "approved";
}

export function riderStatusLabel(status: RiderVerificationStatus) {
  switch (status) {
    case "pending":
      return "Under review";
    case "approved":
      return "Verified";
    case "rejected":
      return "Not approved";
  }
}
