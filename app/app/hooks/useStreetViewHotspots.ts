import { useMemo } from "react";
import type { StreetViewHotspot } from "../types";

const HOTSPOTS: StreetViewHotspot[] = [
  {
    agiName: "Coastal AGI",
    towerHeight: 50,
    towerLabel: "Coastal AGI Vent Stack",
    facility: { width: 300, depth: 180 },
    landmark: {
      name: "Leasowe Lighthouse",
      height: 30,
      silhouette: "lighthouse",
    },
    humanScale: true,
    showTerracedHouses: true,
    description:
      "The Coastal AGI facility would span 300m × 180m with a 50m vent stack — dwarfing the Leasowe Lighthouse and surrounding homes.",
  },
  {
    agiName: "Hope AGI",
    towerHeight: 15,
    towerLabel: "Hope AGI Processing Facility",
    facility: { width: 100, depth: 100 },
    landmark: {
      name: "St Peter's Church, Hope",
      height: 12,
      silhouette: "church",
    },
    humanScale: true,
    showTerracedHouses: true,
    description:
      "The Hope AGI would sit next to Breedon Hope cement works, adding a 15m industrial facility to the village skyline.",
  },
  {
    agiName: "Tunstead AGI",
    towerHeight: 15,
    towerLabel: "Tunstead AGI Processing Facility",
    facility: { width: 100, depth: 100 },
    landmark: {
      name: "Residential houses",
      height: 8,
      silhouette: "house",
    },
    humanScale: true,
    showTerracedHouses: false,
    description:
      "The Tunstead AGI would add a 15m processing facility adjacent to the existing Tunstead quarry, near homes in Great Rocks Dale.",
  },
];

export function useStreetViewHotspots() {
  const hotspotMap = useMemo(() => {
    const map = new Map<string, StreetViewHotspot>();
    for (const h of HOTSPOTS) {
      map.set(h.agiName, h);
    }
    return map;
  }, []);

  return {
    getHotspot: (name: string) => hotspotMap.get(name) ?? null,
    hotspots: HOTSPOTS,
  };
}
