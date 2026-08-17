"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import LayerPanel from "./components/LayerPanel";
import PostcodeLookup from "./components/PostcodeLookup";
import RiskCard from "./components/RiskCard";
import StreetViewModal from "./components/StreetViewModal";
import type { ClickedFeature } from "./components/Map";
import type { LayerVisibility, PostcodeData } from "./types";
import { usePostcodeIndex } from "./hooks/usePostcodeIndex";
import { useStreetViewHotspots } from "./hooks/useStreetViewHotspots";
import { useRuptureScenarios } from "./hooks/useRuptureScenarios";
import RupturePicker from "./components/RupturePicker";
import MobileBottomSheet from "./components/MobileBottomSheet";
import MobileLayerButton from "./components/MobileLayerButton";

const Map = dynamic(() => import("./components/Map"), { ssr: false });

function HomeContent() {
  const searchParams = useSearchParams();
  const urlPostcode = searchParams.get("postcode");
  const { lookup } = usePostcodeIndex();
  const { getHotspot } = useStreetViewHotspots();

  const [layers, setLayers] = useState<LayerVisibility>({
    corridor: true,
    environmental: true,
    visual: true,
    safety: true,
    schools: true,
    property: true,
    // Off by default: the cloud is a large filled area and would obscure
    // the other layers on first load.
    rupture: false,
  });

  const { scenarios: ruptureScenarios, defaultId: defaultRuptureId } =
    useRuptureScenarios();
  const [ruptureId, setRuptureId] = useState<string | null>(null);
  const activeRuptureId = ruptureId ?? defaultRuptureId;

  const [flyToTarget, setFlyToTarget] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);

  const [riskResult, setRiskResult] = useState<{
    postcode: string;
    data: PostcodeData;
  } | null>(null);

  const [clickedFeature, setClickedFeature] = useState<ClickedFeature | null>(
    null,
  );
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const [selectedAgi, setSelectedAgi] = useState<string | null>(null);

  const toggleLayer = useCallback((key: keyof LayerVisibility) => {
    setLayers((previous) => ({ ...previous, [key]: !previous[key] }));
  }, []);

  const handlePostcodeResult = useCallback(
    (postcode: string, data: PostcodeData) => {
      setRiskResult({ postcode, data });
      setClickedFeature(null);
      setSheetExpanded(true);
    },
    [],
  );

  const handleFlyTo = useCallback(
    (coords: { longitude: number; latitude: number }) => {
      setFlyToTarget(coords);
      setTimeout(() => setFlyToTarget(null), 100);
    },
    [],
  );

  const handleFeatureClick = useCallback((feature: ClickedFeature | null) => {
    setClickedFeature(feature);
    setSheetExpanded(true);
  }, []);

  const handlePostcodeClick = useCallback(
    (postcode: string, coords: { longitude: number; latitude: number }) => {
      const result = lookup(postcode);
      if (result) {
        setRiskResult({ postcode: result.postcode, data: result.data });
        setClickedFeature(null);
        setFlyToTarget({
          longitude: coords.longitude,
          latitude: coords.latitude,
        });
        setTimeout(() => setFlyToTarget(null), 100);
      }
    },
    [lookup],
  );

  const handleAgiClick = useCallback(
    (agiName: string): boolean => {
      if (getHotspot(agiName)) {
        setSelectedAgi(agiName);
        setClickedFeature(null);
        return true; // consumed — open modal
      }
      return false; // not consumed — fall through to generic feature handler
    },
    [getHotspot],
  );


  return (
    <div className="flex flex-col flex-1">
      <div className="relative flex-1">
        <div className="absolute inset-0">
          <Map
            layers={layers}
            ruptureScenarioId={layers.rupture ? activeRuptureId : null}
            flyToTarget={flyToTarget}
            highlightLocation={
              riskResult
                ? {
                    longitude: riskResult.data.lon,
                    latitude: riskResult.data.lat,
                    label: riskResult.postcode,
                  }
                : null
            }
            onFeatureClick={handleFeatureClick}
            onPostcodeClick={handlePostcodeClick}
            onAgiClick={handleAgiClick}
          />
        </div>

        {/* Postcode search — full-width on mobile, positioned on desktop */}
        <div className="absolute top-2 left-2 right-2 md:top-3 md:left-1/2 md:-translate-x-1/2 md:w-[28rem] z-20">
          <div className="bg-black/85 backdrop-blur-sm border border-accent/30 rounded-lg p-3 md:p-5 shadow-lg shadow-black/50">
            <PostcodeLookup
              onResult={handlePostcodeResult}
              onFlyTo={handleFlyTo}
              initialPostcode={urlPostcode}
            />
          </div>
        </div>

        {/* Desktop: layers top-left */}
        <div className="hidden md:flex absolute top-3 left-3 z-10 w-56 flex-col gap-3">
          <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-3">
            <LayerPanel layers={layers} onToggle={toggleLayer} />
          </div>
          {layers.rupture && ruptureScenarios.length > 0 && (
            <div className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg p-3 max-h-[60vh] overflow-y-auto">
              <RupturePicker
                scenarios={ruptureScenarios}
                selectedId={activeRuptureId}
                onSelect={setRuptureId}
              />
            </div>
          )}
        </div>

        {riskResult && (
          <div className="hidden md:block absolute z-10 top-20 right-3 w-96">
            <RiskCard
              postcode={riskResult.postcode}
              data={riskResult.data}
              onClose={() => setRiskResult(null)}
            />
          </div>
        )}

        {!riskResult && clickedFeature && (
          <div className="hidden md:block absolute z-10 top-20 right-3 w-80">
            <div className="bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-4 shadow-lg shadow-black/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: clickedFeature.color }}
                  />
                  <span className="text-white font-bold text-sm">
                    {clickedFeature.layerLabel}
                  </span>
                </div>
                <button
                  onClick={() => setClickedFeature(null)}
                  className="text-gray-500 hover:text-white text-sm"
                >
                  &times;
                </button>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                {Object.entries(clickedFeature.properties)
                  .filter(
                    ([k]) =>
                      ![
                        "lat",
                        "lon",
                        "easting",
                        "northing",
                        "geometry",
                        "area_km2",
                        "target",
                        "observer_height_m",
                        "analysis_radius_km",
                        "constraint_type",
                        "visible_cells",
                        "section",
                      ].includes(k),
                  )
                  .slice(0, 8)
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="text-gray-500 capitalize">
                        {key.replaceAll("_", " ")}
                      </span>
                      <span className="text-white text-right">
                        {String(value)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile: bottom sheet for risk/feature info */}
        <div className="md:hidden">
          <MobileBottomSheet
            riskResult={riskResult}
            clickedFeature={clickedFeature}
            expanded={sheetExpanded}
            onToggleExpand={() => setSheetExpanded(!sheetExpanded)}
            onCloseRisk={() => setRiskResult(null)}
            onCloseFeature={() => setClickedFeature(null)}
          />
        </div>

      </div>

      {selectedAgi && (() => {
        const hotspot = getHotspot(selectedAgi);
        return hotspot ? (
          <StreetViewModal
            hotspot={hotspot}
            onClose={() => setSelectedAgi(null)}
          />
        ) : null;
      })()}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
