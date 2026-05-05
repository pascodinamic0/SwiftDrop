export type PackageSize = "small" | "medium" | "large";
export type DeliveryType = "human" | "drone";

export interface PricingConfig {
  base_fare: number;
  per_km: number;
  size_small: number;
  size_medium: number;
  size_large: number;
  drone_multiplier: number;
}

export const DEFAULT_PRICING: PricingConfig = {
  base_fare: 1,
  per_km: 0.5,
  size_small: 1,
  size_medium: 1.5,
  size_large: 2,
  drone_multiplier: 1.8,
};

// Haversine distance in km
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function sizeMultiplier(size: PackageSize, c: PricingConfig): number {
  return size === "small" ? c.size_small : size === "medium" ? c.size_medium : c.size_large;
}

export function calculatePrice(
  distance: number,
  size: PackageSize,
  type: DeliveryType,
  c: PricingConfig = DEFAULT_PRICING
): number {
  const droneMult = type === "drone" ? c.drone_multiplier : 1;
  const price = (c.base_fare + distance * c.per_km) * sizeMultiplier(size, c) * droneMult;
  return Math.round(price * 100) / 100;
}

export function estimateMinutes(distance: number, type: DeliveryType): number {
  const speedKmh = type === "drone" ? 60 : 22;
  return Math.max(5, Math.round((distance / speedKmh) * 60) + 4);
}
