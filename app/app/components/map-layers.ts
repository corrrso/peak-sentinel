export const ACCENT = "#FDC700";

export type ClickedFeature = {
  layerLabel: string;
  color: string;
  properties: Record<string, unknown>;
  longitude: number;
  latitude: number;
};

export type LayerInfo = {
  label: string;
  color: string;
  detail?: (props: Record<string, unknown>) => string;
};

export const LAYER_INFO: Record<string, LayerInfo> = {
  "corridor-fill": {
    label: "Pipeline Corridor",
    color: "#FF4500",
    detail: () => "Proposed pipeline route scoping boundary",
  },
  "buffer-500m": {
    label: "500m Buffer Zone",
    color: "#FFA500",
  },
  "buffer-1km": {
    label: "1km Buffer Zone",
    color: "#FDC700",
  },
  "buffer-2km": {
    label: "2km Buffer Zone",
    color: "#FDC700",
  },
  "env-fill": {
    label: "Protected Site",
    color: "#22C55E",
    detail: (p) => {
      const name = p.name || p.SSSI_NAME || "";
      const type = String(p.constraint_type || p.designation || "").toUpperCase();
      return name ? `${type}: ${name}` : type || "Environmental designation";
    },
  },
  "viewshed-fill": {
    label: "Visual Impact Zone",
    color: "#A855F7",
    detail: () => "Area with line-of-sight to the 50m Potential Coastal AGI Location vent stack",
  },
  "sinks-fill": {
    label: "CO\u2082 Pooling Risk",
    color: "#DC2626",
    detail: (p) => {
      const depth = p.max_depth_m;
      const area = p.area_ha;
      const parts: string[] = [];
      if (depth) parts.push(`depth: ${depth}m`);
      if (area) parts.push(`area: ${area} ha`);
      return parts.length > 0
        ? `Topographic sink where leaked CO\u2082 would accumulate (${parts.join(", ")})`
        : "Topographic depression where leaked CO\u2082 would accumulate";
    },
  },
  "schools-circles": {
    label: "School",
    color: "#FBBF24",
    detail: (p) => {
      const name = p.name || "";
      const distance = p.distance_m;
      return distance ? `${name} \u2014 ${distance}m from pipeline` : String(name);
    },
  },
  "property-circles": {
    label: "Property Impact",
    color: "#3B82F6",
    detail: (p) => {
      const pc = p.postcode || "";
      const dep = p.depreciation_pct;
      return dep ? `${pc}: estimated ${dep}% depreciation` : String(pc);
    },
  },
  "rupture-4pct-fill": {
    label: "CO₂ Cloud, 4% (dangerous to life)",
    color: "#F97316",
    detail: () =>
      "Peak CO₂ above 4% by volume at head height. Immediately dangerous to life and health.",
  },
  "rupture-7pct-fill": {
    label: "CO₂ Cloud, 7%",
    color: "#EF4444",
    detail: () => "Peak CO₂ above 7% by volume. Loss of consciousness within minutes.",
  },
  "rupture-10pct-fill": {
    label: "CO₂ Cloud, 10%",
    color: "#B91C1C",
    detail: () => "Peak CO₂ above 10% by volume. Rapidly fatal.",
  },
  "agi-circles": {
    label: "Potential AGI Location",
    color: "#FF4500",
    detail: (p: Record<string, unknown>) => {
      const parts: string[] = [];
      if (p.name) parts.push(String(p.name));
      if (p.height_m) parts.push(`${p.height_m}m tower`);
      if (p.footprint) parts.push(String(p.footprint));
      return parts.join(" \u2014 ");
    },
  },
};
