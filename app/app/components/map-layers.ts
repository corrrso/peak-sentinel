export const ACCENT = "#FDC700";

/** Geometry, provenance and internal keys, all covered by the layer label or
 *  its description, so showing them raw only adds noise. */
export const HIDDEN_FEATURE_KEYS = new Set([
  "lat", "lon", "easting", "northing", "geometry", "area_km2",
  "target", "observer_height_m", "analysis_radius_km",
  "constraint_type", "visible_cells", "section",
  "kind", "threshold_pct",
]);

export type ClickedFeature = {
  layerLabel: string;
  color: string;
  detail?: string;
  properties: Record<string, unknown>;
  longitude: number;
  latitude: number;
};

export type LayerInfo = {
  label: string;
  color: string;
  detail?: (props: Record<string, unknown>) => string;
};

/** Layers that are nested by construction, so a point inside the innermost one
 *  also falls inside every outer one. Listing them worst-first lets a hit on
 *  several collapse to the single most severe, which is the only one a reader
 *  needs. */
const EXCLUSIVE_GROUPS: string[][] = [
  ["rupture-10pct-fill", "rupture-7pct-fill", "rupture-4pct-fill"],
];

/**
 * Drops layers that are superseded by a more severe one at the same point.
 * Preserves the incoming order of everything else.
 */
export function collapseNestedLayers(layerIds: string[]): string[] {
  const present = new Set(layerIds);
  const suppressed = new Set<string>();
  for (const group of EXCLUSIVE_GROUPS) {
    const winner = group.find((id) => present.has(id));
    if (!winner) continue;
    for (const id of group) {
      if (id !== winner) suppressed.add(id);
    }
  }
  return layerIds.filter((id) => !suppressed.has(id));
}

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
    label: "CO₂ Cloud, 4% (dangerous)",
    color: "#F97316",
    detail: () =>
      "Peak CO₂ reached 4% by volume at head height. This is the NIOSH threshold " +
      "for immediate danger to life and health: laboured breathing, headache, " +
      "confusion and impaired judgement within minutes. People here would " +
      "struggle to understand what is happening or to decide where to go.",
  },
  "rupture-7pct-fill": {
    label: "CO₂ Cloud, 7% (life-threatening)",
    color: "#EF4444",
    detail: () =>
      "Peak CO₂ reached 7% by volume. Dizziness, visual disturbance and loss of " +
      "consciousness within a few minutes. Anyone who collapses here cannot " +
      "escape, and because CO₂ is denser than air it is thickest at ground level.",
  },
  "rupture-10pct-fill": {
    label: "CO₂ Cloud, 10% (potentially fatal)",
    color: "#B91C1C",
    detail: () =>
      "Peak CO₂ reached 10% by volume. Convulsions and rapid unconsciousness, " +
      "fatal without immediate rescue. Petrol and diesel engines also stall in " +
      "air this deprived of oxygen, which at Satartia in 2020 left residents " +
      "unable to drive out and delayed emergency vehicles reaching them.",
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
