import type { StoreVerificationStatus } from "@/lib/roles";
import type { TFunction } from "@/i18n/translate";

export function getStoreStatusLabel(status: StoreVerificationStatus, t: TFunction): string {
  return t(`merchant.status.${status}`);
}
