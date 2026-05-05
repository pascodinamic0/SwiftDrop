import { useEffect, useRef } from "react";
import L from "leaflet";

// Fix default icon paths (Leaflet expects bundled images)
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export interface LatLng { lat: number; lng: number }

export interface DeliveryMapProps {
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  agent?: LatLng | null;
  isDrone?: boolean;
  className?: string;
  onMapClick?: (point: LatLng) => void;
  clickMode?: "pickup" | "dropoff" | null;
  height?: string;
}

const PICKUP_ICON = L.divIcon({
  className: "",
  html: `<div style="background:oklch(0.16 0.01 250);color:oklch(0.88 0.22 130);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.25);font-size:14px;">A</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});
const DROPOFF_ICON = L.divIcon({
  className: "",
  html: `<div style="background:oklch(0.88 0.22 130);color:oklch(0.16 0.01 250);width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.25);font-size:14px;">B</div>`,
  iconSize: [32, 32], iconAnchor: [16, 16],
});
const agentIcon = (drone: boolean) => L.divIcon({
  className: "",
  html: `<div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;inset:0;border-radius:50%;background:oklch(0.88 0.22 130);opacity:0.3;animation:pulse-ring 1.6s ease-out infinite;"></div>
    <div style="position:relative;width:28px;height:28px;border-radius:50%;background:white;border:3px solid oklch(0.16 0.01 250);display:flex;align-items:center;justify-content:center;font-size:14px;">${drone ? "🚁" : "🛵"}</div>
  </div>`,
  iconSize: [40, 40], iconAnchor: [20, 20],
});

export function DeliveryMap({
  pickup, dropoff, agent, isDrone, className = "", onMapClick, clickMode, height = "100%",
}: DeliveryMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.Layer[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: true, attributionControl: true })
      .setView([40.7128, -74.006], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Click handler
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: L.LeafletMouseEvent) => {
      if (onMapClick && clickMode) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [onMapClick, clickMode]);

  // Markers + route
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    const bounds: L.LatLngExpression[] = [];
    if (pickup) {
      const m = L.marker([pickup.lat, pickup.lng], { icon: PICKUP_ICON }).addTo(map);
      layersRef.current.push(m);
      bounds.push([pickup.lat, pickup.lng]);
    }
    if (dropoff) {
      const m = L.marker([dropoff.lat, dropoff.lng], { icon: DROPOFF_ICON }).addTo(map);
      layersRef.current.push(m);
      bounds.push([dropoff.lat, dropoff.lng]);
    }
    if (pickup && dropoff) {
      const line = L.polyline([[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]], {
        color: isDrone ? "#84cc16" : "#0a0a0a",
        weight: 4, opacity: 0.85,
        dashArray: isDrone ? "6,8" : undefined,
      }).addTo(map);
      layersRef.current.push(line);
    }
    if (agent) {
      const m = L.marker([agent.lat, agent.lng], { icon: agentIcon(!!isDrone) }).addTo(map);
      layersRef.current.push(m);
      bounds.push([agent.lat, agent.lng]);
    }
    if (bounds.length >= 2) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [50, 50], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0] as L.LatLngExpression, 14);
    }
  }, [pickup, dropoff, agent, isDrone]);

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-border ${className}`} style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />
      {clickMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-secondary text-secondary-foreground px-4 py-2 rounded-full text-xs font-semibold shadow-card">
          Tap on the map to set {clickMode === "pickup" ? "pickup (A)" : "drop-off (B)"}
        </div>
      )}
    </div>
  );
}
