"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import MapGL, {
  Source,
  Layer,
  Marker,
  NavigationControl,
  MapRef,
} from "react-map-gl/maplibre";
import type { GeoJSON } from "geojson";
import type { LayerVisibility } from "../types";
import MapTooltip from "./MapTooltip";
import HighlightMarker from "./HighlightMarker";
import { type ClickedFeature } from "./map-layers";
import useMapInteractions from "../hooks/useMapInteractions";

const BASEMAP =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const INITIAL_VIEW = {
  longitude: -2.45,
  latitude: 53.24,
  zoom: 9,
};

interface MapProps {
  layers: LayerVisibility;
  onFlyTo?: (coords: { longitude: number; latitude: number }) => void;
  flyToTarget?: { longitude: number; latitude: number } | null;
  highlightLocation?: {
    longitude: number;
    latitude: number;
    label: string;
  } | null;
  onFeatureClick?: (feature: ClickedFeature | null) => void;
  onPostcodeClick?: (
    postcode: string,
    coords: { longitude: number; latitude: number },
  ) => void;
}

export default function Map({
  layers,
  flyToTarget,
  highlightLocation,
  onFeatureClick,
  onPostcodeClick,
}: MapProps) {
  const mapRef = useRef<MapRef>(null);
  const [data, setData] = useState<Record<string, GeoJSON>>({});

  const hasData = Object.keys(data).length > 0;
  const { tooltip, clickLocation } = useMapInteractions(
    mapRef,
    hasData,
    onFeatureClick,
    onPostcodeClick,
  );

  const onMapLoad = useCallback(async () => {
    const files = [
      "corridor",
      "corridor_buffered",
      "agi_sites",
      "route_sections",
      "env_constraints",
      "topo_sinks",
      "schools",
      "property_impact",
      "viewshed_wirral",
    ];
    const loaded: Record<string, GeoJSON> = {};
    await Promise.all(
      files.map(async (f) => {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/data/${f}.geojson`,
        );
        loaded[f] = await response.json();
      }),
    );
    setData(loaded);
  }, []);

  useEffect(() => {
    if (flyToTarget && mapRef.current) {
      mapRef.current.flyTo({
        center: [flyToTarget.longitude, flyToTarget.latitude],
        zoom: 14,
        duration: 2000,
      });
    }
  }, [flyToTarget]);

  return (
    <div className="relative w-full h-full">
      <MapGL
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        style={{ width: "100%", height: "100%" }}
        mapStyle={BASEMAP}
        onLoad={onMapLoad}
      >
        <NavigationControl position="top-right" />

        {hasData && (
          <>
            {/* Layer 1: Pipeline Corridor (always visible) */}
            {data.corridor_buffered && (
              <Source
                id="corridor-buffered"
                type="geojson"
                data={data.corridor_buffered}
              >
                <Layer
                  id="buffer-1km"
                  type="fill"
                  paint={{ "fill-color": "#FFD700", "fill-opacity": 0.05 }}
                  filter={["==", ["get", "buffer"], "1km"]}
                />
                <Layer
                  id="buffer-1km-line"
                  type="line"
                  paint={{
                    "line-color": "#FFD700",
                    "line-opacity": 0.3,
                    "line-dasharray": [4, 4],
                  }}
                  filter={["==", ["get", "buffer"], "1km"]}
                />
                <Layer
                  id="buffer-500m"
                  type="fill"
                  paint={{ "fill-color": "#FFA500", "fill-opacity": 0.08 }}
                  filter={["==", ["get", "buffer"], "500m"]}
                />
                <Layer
                  id="buffer-500m-line"
                  type="line"
                  paint={{
                    "line-color": "#FFA500",
                    "line-opacity": 0.4,
                    "line-dasharray": [2, 2],
                  }}
                  filter={["==", ["get", "buffer"], "500m"]}
                />
              </Source>
            )}
            {data.corridor && (
              <Source id="corridor" type="geojson" data={data.corridor}>
                <Layer
                  id="corridor-fill"
                  type="fill"
                  paint={{ "fill-color": "#FF4500", "fill-opacity": 0.3 }}
                />
                <Layer
                  id="corridor-line"
                  type="line"
                  paint={{
                    "line-color": "#FF4500",
                    "line-opacity": 0.8,
                    "line-width": 2,
                  }}
                />
              </Source>
            )}
            {data.route_sections && (
              <Source id="sections" type="geojson" data={data.route_sections}>
                <Layer
                  id="sections-line"
                  type="line"
                  paint={{
                    "line-color": "#FFD700",
                    "line-opacity": 0.6,
                    "line-width": 1,
                  }}
                />
                <Layer
                  id="sections-label"
                  type="symbol"
                  minzoom={10}
                  layout={{
                    "text-field": ["get", "name"],
                    "text-size": 11,
                    "symbol-placement": "line",
                    "text-allow-overlap": false,
                  }}
                  paint={{
                    "text-color": "#FFD700",
                    "text-halo-color": "#000",
                    "text-halo-width": 1,
                  }}
                />
              </Source>
            )}
            {/* Layer 2: Environmental */}
            {layers.environmental && data.env_constraints && (
              <Source id="env" type="geojson" data={data.env_constraints}>
                <Layer
                  id="env-fill"
                  type="fill"
                  paint={{
                    "fill-color": "#22C55E",
                    "fill-opacity": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      10,
                      0.06,
                      13,
                      0.2,
                    ],
                  }}
                />
                <Layer
                  id="env-line"
                  type="line"
                  paint={{
                    "line-color": "#22C55E",
                    "line-opacity": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      10,
                      0.3,
                      13,
                      0.7,
                    ],
                    "line-width": 1,
                  }}
                />
                <Layer
                  id="env-label"
                  type="symbol"
                  minzoom={11}
                  layout={{
                    "text-field": ["get", "name"],
                    "text-size": 10,
                    "text-allow-overlap": false,
                  }}
                  paint={{
                    "text-color": "#22C55E",
                    "text-halo-color": "#000",
                    "text-halo-width": 1,
                  }}
                />
              </Source>
            )}

            {/* Layer 3: Visual Impact */}
            {layers.visual && data.viewshed_wirral && (
              <Source id="viewshed" type="geojson" data={data.viewshed_wirral}>
                <Layer
                  id="viewshed-fill"
                  type="fill"
                  paint={{
                    "fill-color": "#A855F7",
                    "fill-opacity": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      10,
                      0.05,
                      13,
                      0.15,
                    ],
                  }}
                />
                <Layer
                  id="viewshed-line"
                  type="line"
                  paint={{
                    "line-color": "#A855F7",
                    "line-opacity": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      10,
                      0.2,
                      13,
                      0.5,
                    ],
                    "line-width": 1,
                    "line-dasharray": [3, 2],
                  }}
                />
              </Source>
            )}

            {/* Layer 4: CO2 Sinks */}
            {layers.safety && data.topo_sinks && (
              <Source id="sinks" type="geojson" data={data.topo_sinks}>
                <Layer
                  id="sinks-fill"
                  type="fill"
                  paint={{
                    "fill-color": "#DC2626",
                    "fill-opacity": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      10,
                      0.04,
                      12,
                      0.15,
                      14,
                      0.3,
                    ],
                  }}
                />
                <Layer
                  id="sinks-line"
                  type="line"
                  minzoom={12}
                  paint={{
                    "line-color": "#DC2626",
                    "line-opacity": 0.5,
                    "line-width": 1,
                  }}
                />
              </Source>
            )}

            {/* Layer 5: Schools */}
            {layers.schools && data.schools && (
              <Source id="schools" type="geojson" data={data.schools}>
                <Layer
                  id="schools-circles"
                  type="circle"
                  paint={{
                    "circle-radius": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      10,
                      3,
                      13,
                      6,
                    ],
                    "circle-color": "#FBBF24",
                    "circle-stroke-color": "#000",
                    "circle-stroke-width": 1,
                  }}
                />
                <Layer
                  id="schools-labels"
                  type="symbol"
                  minzoom={11}
                  layout={{
                    "text-field": ["get", "name"],
                    "text-size": 9,
                    "text-offset": [0, 1.3],
                  }}
                  paint={{
                    "text-color": "#FBBF24",
                    "text-halo-color": "#000",
                    "text-halo-width": 1,
                  }}
                />
              </Source>
            )}

            {/* Layer 6: Property Values */}
            {layers.property && data.property_impact && (
              <Source id="property" type="geojson" data={data.property_impact}>
                <Layer
                  id="property-circles"
                  type="circle"
                  paint={{
                    "circle-radius": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      10,
                      4,
                      13,
                      7,
                    ],
                    "circle-color": [
                      "interpolate",
                      ["linear"],
                      ["get", "depreciation_pct"],
                      -15,
                      "#991B1B",
                      -10,
                      "#EF4444",
                      -5,
                      "#F59E0B",
                      0,
                      "#3B82F6",
                    ],
                    "circle-stroke-color": "#FFF",
                    "circle-stroke-width": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      10,
                      0.5,
                      13,
                      1,
                    ],
                    "circle-opacity": 0.8,
                  }}
                  filter={[
                    "<=",
                    ["get", "distance_m"],
                    ["step", ["zoom"], 200, 11, 500, 12, 1000, 13, 2000],
                  ]}
                />
                <Layer
                  id="property-labels"
                  type="symbol"
                  minzoom={13}
                  layout={{
                    "text-field": [
                      "concat",
                      ["get", "postcode"],
                      "\n",
                      ["to-string", ["get", "depreciation_pct"]],
                      "%",
                    ],
                    "text-size": 9,
                    "text-offset": [0, 1.8],
                  }}
                  paint={{
                    "text-color": "#FFF",
                    "text-halo-color": "#000",
                    "text-halo-width": 1,
                  }}
                />
              </Source>
            )}

            {/* AGI Sites — rendered last so they're always on top */}
            {data.agi_sites && (
              <Source id="agis" type="geojson" data={data.agi_sites}>
                <Layer
                  id="agi-circles"
                  type="circle"
                  paint={{
                    "circle-radius": [
                      "interpolate",
                      ["linear"],
                      ["zoom"],
                      9,
                      8,
                      12,
                      14,
                    ],
                    "circle-color": [
                      "case",
                      ["==", ["get", "type"], "coastal"],
                      "#FF0000",
                      ["==", ["get", "type"], "capture"],
                      "#FF6600",
                      "#FFD700",
                    ],
                    "circle-stroke-color": "#FFF",
                    "circle-stroke-width": 3,
                  }}
                />
                <Layer
                  id="agi-labels"
                  type="symbol"
                  layout={{
                    "text-field": ["get", "name"],
                    "text-size": 12,
                    "text-offset": [0, 1.8],
                    "text-allow-overlap": true,
                    "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
                  }}
                  paint={{
                    "text-color": "#FFF",
                    "text-halo-color": "#000",
                    "text-halo-width": 2,
                  }}
                />
              </Source>
            )}
          </>
        )}

        {highlightLocation && (
          <HighlightMarker
            longitude={highlightLocation.longitude}
            latitude={highlightLocation.latitude}
          />
        )}

        {clickLocation && !highlightLocation && (
          <Marker
            longitude={clickLocation.longitude}
            latitude={clickLocation.latitude}
            anchor="center"
          >
            <div className="w-4 h-4 rounded-full border-2 border-white shadow-lg bg-white/20" />
          </Marker>
        )}
      </MapGL>

      <MapTooltip tooltip={tooltip} />
    </div>
  );
}

export { type ClickedFeature } from "./map-layers";
