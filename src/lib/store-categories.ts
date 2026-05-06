import type { LucideIcon } from "lucide-react";
import {
  Coffee,
  Croissant,
  Dog,
  Flower2,
  LayoutGrid,
  Pill,
  ShoppingBasket,
  Sparkles,
  Store,
  UtensilsCrossed,
} from "lucide-react";

/** Values must match `public.store_category` in Postgres (order here = browse order on /shop). */
export type StoreCategoryId =
  | "food"
  | "coffee"
  | "bakery"
  | "grocery"
  | "convenience"
  | "pharmacy"
  | "flowers"
  | "pets"
  | "other";

export const STORE_CATEGORY_ORDER: readonly StoreCategoryId[] = [
  "food",
  "coffee",
  "bakery",
  "grocery",
  "convenience",
  "pharmacy",
  "flowers",
  "pets",
  "other",
] as const;

export const STORE_CATEGORY_META: Record<
  StoreCategoryId,
  { label: string; shortLabel: string; description: string; Icon: LucideIcon }
> = {
  food: {
    label: "Restaurants",
    shortLabel: "Food",
    description: "Meals, takeout & dining",
    Icon: UtensilsCrossed,
  },
  coffee: {
    label: "Coffee & tea",
    shortLabel: "Cafés",
    description: "Coffee, tea & cafés",
    Icon: Coffee,
  },
  bakery: {
    label: "Bakery & sweets",
    shortLabel: "Bakery",
    description: "Pastries, bread & desserts",
    Icon: Croissant,
  },
  grocery: {
    label: "Grocery",
    shortLabel: "Grocery",
    description: "Produce & pantry staples",
    Icon: ShoppingBasket,
  },
  convenience: {
    label: "Convenience",
    shortLabel: "Corner",
    description: "Quick essentials",
    Icon: Store,
  },
  pharmacy: {
    label: "Pharmacy",
    shortLabel: "Rx",
    description: "Health & wellness",
    Icon: Pill,
  },
  flowers: {
    label: "Flowers & gifts",
    shortLabel: "Gifts",
    description: "Bouquets & gifting",
    Icon: Flower2,
  },
  pets: {
    label: "Pet supplies",
    shortLabel: "Pets",
    description: "Food & supplies for pets",
    Icon: Dog,
  },
  other: {
    label: "More",
    shortLabel: "Other",
    description: "Specialty & local finds",
    Icon: Sparkles,
  },
};

export function isStoreCategoryId(v: string): v is StoreCategoryId {
  return v in STORE_CATEGORY_META;
}

export function getStoreCategoryLabel(category: string): string {
  if (isStoreCategoryId(category)) return STORE_CATEGORY_META[category].label;
  return category.replace(/_/g, " ");
}
