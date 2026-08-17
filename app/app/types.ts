export type PostcodeData = {
  lat: number;
  lon: number;
  distance_m: number;
  in_topo_sink: boolean;
  sink_depth_m: number | null;
  in_viewshed: boolean;
  nearest_agi: string;
  nearest_agi_distance_m: number;
  avg_property_price: number;
  est_depreciation_pct: number;
  est_depreciation_pct_low: number;
  est_depreciation_pct_high: number;
  est_loss_gbp: number;
  est_loss_low: number;
  est_loss_high: number;
  nearby_env: string[];
  nearby_schools: string[];
  risk_level: string;
  section: number;
  scoping_refs: string[];
};

export type PostcodeIndex = Record<string, PostcodeData>;

export type LayerVisibility = {
  corridor: boolean;
  environmental: boolean;
  visual: boolean;
  safety: boolean;
  schools: boolean;
  property: boolean;
  rupture: boolean;
};

export type RuptureScenario = {
  id: string;
  scenario: string;
  scenario_label: string;
  mode: string;
  mode_label: string;
  weather: string;
  weather_label: string;
  variant: string | null;
  variant_label: string | null;
  area_4pct_km2: number;
  area_7pct_km2: number;
  area_10pct_km2: number;
  max_extent_m: number;
  receptor_arrival_s: number | null;
  receptor_max_pct: number | null;
  pressure_barg: number | null;
  source_model: string;
  peak_rate_kgs: number;
  released_t: number;
  mass_released_fraction: number | null;
  postcodes_in_cloud: number;
};

export type StreetViewHotspot = {
  agiName: string;
  towerHeight: number;
  towerLabel: string;
  facility: { width: number; depth: number };
  landmark: {
    name: string;
    height: number;
    silhouette: "lighthouse" | "church" | "house" | "tree" | "dome";
  };
  humanScale: boolean;
  showTerracedHouses: boolean;
  description: string;
  illustrationSrc?: string;
};
