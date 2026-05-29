import type { RiderVerificationStatus } from "./roles";
import type { TFunction } from "@/i18n/translate";

export function getRiderStatusLabel(status: RiderVerificationStatus, t: TFunction): string {
  return t(`rider.status.${status}`);
}
