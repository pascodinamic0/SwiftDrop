import type { StoreCategoryId } from "./store-categories";
import type { TFunction } from "@/i18n/translate";

export function getStoreCategoryMeta(
  category: StoreCategoryId,
  t: TFunction,
): { label: string; shortLabel: string; description: string } {
  return {
    label: t(`storeCategory.${category}.label`),
    shortLabel: t(`storeCategory.${category}.shortLabel`),
    description: t(`storeCategory.${category}.description`),
  };
}

export function getStoreCategoryLabel(category: string, t: TFunction): string {
  const key = `storeCategory.${category}.label`;
  const translated = t(key);
  if (translated !== key) return translated;
  return category.replace(/_/g, " ");
}
