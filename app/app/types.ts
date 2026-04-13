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
};

export type StreetViewHotspot = {
  agiName: string;
  towerHeight: number;
  towerLabel: string;
  facility: { width: number; depth: number };
  landmark: {
    name: string;
    height: number;
    silhouette: "lighthouse" | "church" | "house" | "tree";
  };
  humanScale: boolean;
  showTerracedHouses: boolean;
  description: string;
  illustrationSrc?: string;
};
