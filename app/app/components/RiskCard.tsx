"use client";

import { useState } from "react";
import type { PostcodeData } from "../types";

interface RiskCardProps {
  postcode: string;
  data: PostcodeData;
  onClose: () => void;
}

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-900",
  high: "bg-red-600",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

function formatGBP(n: number) {
  return "\u00A3" + n.toLocaleString("en-GB");
}

export default function RiskCard({ postcode, data, onClose }: RiskCardProps) {
  const [showMethodology, setShowMethodology] = useState(false);

  const lowPct = data.est_depreciation_pct_low ?? data.est_depreciation_pct;
  const highPct = data.est_depreciation_pct_high ?? data.est_depreciation_pct;

  return (
    <div className="bg-black/90 backdrop-blur-sm border border-[#FFD700]/30 rounded-lg p-5 text-sm space-y-4 max-h-[70vh] overflow-y-auto shadow-xl shadow-black/50">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-[#FFD700] font-bold text-lg">{postcode}</h3>
          <span
            className={`inline-block mt-1 px-2.5 py-1 rounded text-white text-xs font-bold uppercase ${
              RISK_COLORS[data.risk_level] || "bg-gray-500"
            }`}
          >
            {data.risk_level} risk
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-white text-xl leading-none"
        >
          &times;
        </button>
      </div>

      <div className="space-y-3 text-gray-300">
        <div className="text-base">
          <span className="text-white font-bold">
            {data.distance_m}m from pipeline
          </span>
        </div>

        <div>
          <span className="text-white font-semibold">Nearest AGI:</span>{" "}
          {data.nearest_agi} ({data.nearest_agi_distance_m}m)
        </div>

        {data.in_topo_sink && (
          <div className="text-red-400">
            In topographic sink (depth: {data.sink_depth_m}m) &mdash; CO&#8322;
            pooling risk in case of pipeline failure
          </div>
        )}

        {data.in_viewshed && (
          <div className="text-purple-400">
            In viewshed of proposed Coastal AGI (50m vent stack)
          </div>
        )}

        <div className="border-t border-white/10 pt-3">
          <span className="text-white font-bold text-base">
            Estimated Property Impact
          </span>
          <div className="mt-2">
            Avg. price ({postcode.split(" ")[0]} area):{" "}
            <span className="text-white font-semibold">
              {formatGBP(data.avg_property_price)}
            </span>
          </div>
          <div className="mt-1 text-gray-500 text-xs">
            Source: HM Land Registry Price Paid Data (2023&ndash;2025 median)
          </div>

          <div className="mt-3 bg-white/8 rounded-lg p-3 space-y-2">
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
            className="text-[#FFD700]/70 hover:text-[#FFD700] text-xs mt-2 underline"
          >
            {showMethodology ? "Hide methodology" : "How we estimated this"}
          </button>

          {showMethodology && (
            <div className="mt-2 text-xs text-gray-400 space-y-2 bg-white/8 rounded-lg p-3">
              <p>
                <strong className="text-gray-300">Important: </strong> No
                peer-reviewed study exists for CO&#8322; pipeline proximity
                effects on property values. These estimates are based on studies
                of natural gas and fuel pipelines:
              </p>
              <ul className="space-y-1.5 list-disc pl-3">
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

        {data.nearby_env.length > 0 && (
          <div className="border-t border-white/10 pt-3">
            <span className="text-white font-bold">Nearby Protected Sites</span>
            <ul className="mt-2 space-y-1">
              {data.nearby_env.map((site) => (
                <li key={site} className="text-green-400">
                  {site}
                </li>
              ))}
            </ul>
          </div>
        )}

        {data.nearby_schools.length > 0 && (
          <div className="border-t border-white/10 pt-3">
            <span className="text-white font-bold">Nearby Schools</span>
            <ul className="mt-2 space-y-1">
              {data.nearby_schools.map((s) => (
                <li key={s} className="text-yellow-400">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
