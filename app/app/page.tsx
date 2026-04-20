"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import LayerPanel from "./components/LayerPanel";
import PostcodeLookup from "./components/PostcodeLookup";
import RiskCard from "./components/RiskCard";
import ObjectionGenerator from "./components/ObjectionGenerator";
import StreetViewModal from "./components/StreetViewModal";
import type { ClickedFeature } from "./components/Map";
import type { LayerVisibility, PostcodeData } from "./types";
import { usePostcodeIndex } from "./hooks/usePostcodeIndex";
import { useStreetViewHotspots } from "./hooks/useStreetViewHotspots";
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
  });

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

  const selectedPostcode = riskResult?.postcode || urlPostcode || null;

  return (
    <div className="flex flex-col flex-1">
      {/* ── Map section: 60vh ──────────────────────────────────── */}
      <div className="relative h-[70vh] min-h-[500px]">
        <div className="absolute inset-0">
          <Map
            layers={layers}
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
        <div className="absolute top-2 left-2 right-14 md:top-3 md:left-64 md:right-auto md:w-96 z-20">
          <div className="bg-black/85 backdrop-blur-sm border border-[#FFD700]/30 rounded-lg p-3 md:p-5 shadow-lg shadow-black/50">
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

        {/* Mobile: floating layer button */}
        <div className="md:hidden">
          <MobileLayerButton layers={layers} onToggle={toggleLayer} />
        </div>
      </div>

      {/* ── Action section: below map ──────────────────────────── */}
      <div className="bg-black border-t border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-16">
          {/* Objection Generator */}
          <section>
            <h2 className="text-3xl font-bold text-[#FFD700] mb-2">
              Take Action
            </h2>
            {selectedPostcode ? (
              <>
                <p className="text-gray-300 mb-8">
                  Generate a personalised objection letter based on the risks to
                  your postcode. Edit freely before sending.
                </p>
                <ObjectionGenerator initialPostcode={selectedPostcode} />
              </>
            ) : (
              <div className="bg-white/8 border border-white/10 rounded-lg p-8 text-center">
                <p className="text-gray-300 text-lg">
                  Search your postcode on the map above to generate a
                  personalised objection letter.
                </p>
              </div>
            )}
          </section>

          {/* Evidence CTA */}
          <section>
            <h2 className="text-2xl font-bold text-[#FFD700] mb-6">
              Why Should You Care?
            </h2>
            <div className="bg-white/8 border border-white/10 rounded-lg p-6 space-y-4 text-gray-300">
              <p>
                CO&#8322; pipelines are not like natural gas pipelines. The
                physics, the track record, and the developer&apos;s own
                admissions tell a troubling story.
              </p>
              <a
                href="/evidence"
                className="inline-block bg-[#FFD700] text-black font-bold px-6 py-2.5 rounded-lg hover:bg-yellow-400 transition-colors"
              >
                See the Evidence &rarr;
              </a>
            </div>
          </section>


          {/* Get Involved */}
          <section>
            <h2 className="text-2xl font-bold text-[#FFD700] mb-6">
              Get Involved
            </h2>
            <div className="bg-white/8 border border-white/10 rounded-lg p-6 space-y-4 text-gray-300">
              <p>
                <strong className="text-white">Action Against CCS</strong> is a
                community group opposing the Peak Cluster pipeline. They need
                volunteers, expertise, and voices.
              </p>
              <div className="space-y-2">
                <div>
                  Website:{" "}
                  <a
                    href="https://actionagainstccs.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    actionagainstccs.com
                  </a>
                </div>
                <div>
                  Email:{" "}
                  <a
                    href="mailto:volunteer@actionagainstccs.com"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    volunteer@actionagainstccs.com
                  </a>
                </div>
              </div>
              <p className="text-gray-500 text-sm pt-2">
                Action Against CCS &mdash; Company Limited by Guarantee
                #17120749
                <br />
                Chair: Laura Beveridge
              </p>
            </div>
          </section>
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
