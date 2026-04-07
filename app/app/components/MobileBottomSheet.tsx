"use client";

import { useState } from "react";
import type { PostcodeData } from "../types";
import type { ClickedFeature } from "./map-layers";

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-900",
  high: "bg-red-600",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

const HIDDEN_FEATURE_KEYS = new Set([
  "lat", "lon", "easting", "northing", "geometry", "area_km2",
  "target", "observer_height_m", "analysis_radius_km",
  "constraint_type", "visible_cells", "section",
]);

function formatGBP(n: number) {
  return "\u00A3" + n.toLocaleString("en-GB");
}

/* ── Sub-components ─────────────────────────────────────────── */

function RiskAccordions({
  data,
  postcode,
}: {
  data: PostcodeData;
  postcode: string;
}) {
  const [showMethodology, setShowMethodology] = useState(false);
  const lowPct = data.est_depreciation_pct_low ?? data.est_depreciation_pct;
  const highPct = data.est_depreciation_pct_high ?? data.est_depreciation_pct;

  return (
    <div className="text-sm">
      {/* Alerts — always visible, not in accordions */}
      {data.in_topo_sink && (
        <div className="text-red-400 text-xs pb-2">
          In topographic sink (depth: {data.sink_depth_m}m) &mdash; CO&#8322;
          pooling risk in case of pipeline failure
        </div>
      )}
      {data.in_viewshed && (
        <div className="text-purple-400 text-xs pb-2">
          In viewshed of proposed Coastal AGI (50m vent stack)
        </div>
      )}

      {/* Nearest AGI */}
      <details className="border-t border-white/10">
        <summary className="py-2.5 text-gray-300 cursor-pointer">
          Nearest AGI
        </summary>
        <div className="pb-3 text-gray-300 text-xs">
          {data.nearest_agi} ({data.nearest_agi_distance_m}m)
        </div>
      </details>

      {/* Property Impact */}
      <details className="border-t border-white/10">
        <summary className="py-2.5 text-gray-300 cursor-pointer">
          Estimated Property Impact
        </summary>
        <div className="pb-3 space-y-2">
          <div className="text-gray-300 text-xs">
            Avg. price ({postcode.split(" ")[0]} area):{" "}
            <span className="text-white font-semibold">
              {formatGBP(data.avg_property_price)}
            </span>
          </div>
          <div className="text-gray-500 text-[10px]">
            Source: HM Land Registry Price Paid Data (2023&ndash;2025 median)
          </div>
          <div className="bg-white/8 rounded-lg p-2.5 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">Conservative</span>
              <span className="text-amber-400 font-semibold">{lowPct}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Central</span>
              <span className="text-red-400 font-bold">
                {data.est_depreciation_pct}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">High</span>
              <span className="text-red-600 font-semibold">{highPct}%</span>
            </div>
          </div>
          <button
            onClick={() => setShowMethodology(!showMethodology)}
            className="text-[#FFD700]/70 hover:text-[#FFD700] text-[10px] underline"
          >
            {showMethodology ? "Hide methodology" : "How we estimated this"}
          </button>
          {showMethodology && (
            <div className="text-[10px] text-gray-400 space-y-1.5 bg-white/8 rounded-lg p-2.5">
              <p>
                <strong className="text-gray-300">Important: </strong>No
                peer-reviewed study exists for CO&#8322; pipeline proximity
                effects on property values. These estimates are based on studies
                of natural gas and fuel pipelines:
              </p>
              <ul className="space-y-1 list-disc pl-3">
                <li>
                  <strong>Conservative:</strong> Herrnstadt &amp; Sweeney
                  (2024), ~2% post-explosion effect. <em>Land Economics</em>{" "}
                  100(4).{" "}
                  <a
                    href="https://doi.org/10.3368/le.100.4.040220-0047r1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    DOI
                  </a>
                </li>
                <li>
                  <strong>Central:</strong> Cheng et al. (2024), 8.2% within 1km
                  post-incident, persisting ~8 years.{" "}
                  <em>J. Env. Econ. &amp; Management</em> 127.{" "}
                  <a
                    href="https://doi.org/10.1016/j.jeem.2024.103041"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    DOI
                  </a>
                </li>
                <li>
                  <strong>High:</strong> Boslett &amp; Hill (2019), ~9% within
                  3km from pipeline announcement alone.{" "}
                  <em>Resource &amp; Energy Economics</em> 57.{" "}
                  <a
                    href="https://doi.org/10.1016/j.reseneeco.2019.02.001"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 underline"
                  >
                    DOI
                  </a>
                </li>
              </ul>
              <p>
                Property prices are HM Land Registry medians per outcode
                district.
              </p>
            </div>
          )}
        </div>
      </details>

      {/* Protected Sites */}
      {data.nearby_env.length > 0 && (
        <details className="border-t border-white/10">
          <summary className="py-2.5 text-gray-300 cursor-pointer">
            Protected Sites
          </summary>
          <ul className="pb-3 space-y-1">
            {data.nearby_env.map((site) => (
              <li key={site} className="text-green-400 text-xs">
                {site}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Nearby Schools */}
      {data.nearby_schools.length > 0 && (
        <details className="border-t border-white/10">
          <summary className="py-2.5 text-gray-300 cursor-pointer">
            Nearby Schools
          </summary>
          <ul className="pb-3 space-y-1">
            {data.nearby_schools.map((s) => (
              <li key={s} className="text-yellow-400 text-xs">
                {s}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function FeatureProperties({ feature }: { feature: ClickedFeature }) {
  return (
    <div className="text-sm text-gray-300 space-y-1">
      {Object.entries(feature.properties)
        .filter(([k]) => !HIDDEN_FEATURE_KEYS.has(k))
        .slice(0, 8)
        .map(([key, value]) => (
          <div key={key} className="flex justify-between gap-2">
            <span className="text-gray-500 capitalize">
              {key.replaceAll("_", " ")}
            </span>
            <span className="text-white text-right">{String(value)}</span>
          </div>
        ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

interface MobileBottomSheetProps {
  riskResult: { postcode: string; data: PostcodeData } | null;
  clickedFeature: ClickedFeature | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onCloseRisk: () => void;
  onCloseFeature: () => void;
}

export default function MobileBottomSheet({
  riskResult,
  clickedFeature,
  expanded,
  onToggleExpand,
  onCloseRisk,
  onCloseFeature,
}: MobileBottomSheetProps) {

  if (!riskResult && !clickedFeature) return null;

  const onClose = riskResult ? onCloseRisk : onCloseFeature;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/92 backdrop-blur-sm border-t border-[#FFD700]/30 rounded-t-2xl">
      {/* Drag handle */}
      <button
        className="w-full flex justify-center pt-2 pb-1"
        onClick={onToggleExpand}
        aria-label={expanded ? "Collapse panel" : "Expand panel"}
      >
        <div className="w-9 h-1 bg-white/30 rounded-full" />
      </button>

      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 pb-2 cursor-pointer"
        onClick={onToggleExpand}
      >
        {riskResult && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#FFD700] font-bold text-base truncate">
              {riskResult.postcode}
            </span>
            <span
              className={`shrink-0 px-2 py-0.5 rounded text-white text-[10px] font-bold uppercase ${
                RISK_COLORS[riskResult.data.risk_level] || "bg-gray-500"
              }`}
            >
              {riskResult.data.risk_level}
            </span>
            <span className="shrink-0 text-white text-sm font-semibold">
              {riskResult.data.distance_m}m
            </span>
          </div>
        )}

        {!riskResult && clickedFeature && (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: clickedFeature.color }}
            />
            <span className="text-white font-bold text-sm">
              {clickedFeature.layerLabel}
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-gray-500 hover:text-white text-xl leading-none ml-2 shrink-0"
        >
          &times;
        </button>
      </div>

      {/* Expandable content */}
      {expanded && (
        <div className="overflow-y-auto max-h-[50vh] px-4 pb-4">
          {riskResult && (
            <RiskAccordions
              data={riskResult.data}
              postcode={riskResult.postcode}
            />
          )}
          {!riskResult && clickedFeature && (
            <FeatureProperties feature={clickedFeature} />
          )}
        </div>
      )}
    </div>
  );
}
