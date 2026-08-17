"use client";

import type { RuptureScenario } from "../types";

interface RupturePickerProps {
  scenarios: RuptureScenario[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

/** Worst affected population first. */
function byImpact(a: RuptureScenario, b: RuptureScenario): number {
  return b.postcodes_in_cloud - a.postcodes_in_cloud;
}

function arrivalLabel(seconds: number | null): string {
  if (seconds === null) return "not reached";
  if (seconds === 0) return "immediate";
  if (seconds < 60) return `${seconds}s`;
  return `${Math.round(seconds / 60)} min`;
}

export default function RupturePicker({
  scenarios,
  selectedId,
  onSelect,
}: RupturePickerProps) {
  const selected = scenarios.find((s) => s.id === selectedId) ?? null;

  // Base cases first, worst affected population at the top, with the
  // pressure sensitivity variants grouped separately below.
  const baseCases = scenarios.filter((s) => !s.variant).toSorted(byImpact);
  const variants = scenarios.filter((s) => s.variant).toSorted(byImpact);

  const renderOption = (s: RuptureScenario) => {
    const isActive = s.id === selectedId;
    const label = s.variant_label
      ? `${s.scenario_label} — ${s.variant_label}`
      : `${s.scenario_label} — ${s.mode_label}`;
    return (
      <button
        key={s.id}
        onClick={() => onSelect(s.id)}
        className={`flex flex-col items-start gap-0.5 px-2 py-1.5 rounded text-xs w-full text-left transition-all ${
          isActive
            ? "bg-white/10 text-white"
            : "bg-transparent text-gray-500 hover:text-gray-300"
        }`}
      >
        <span className="font-medium">{label}</span>
        <span className="text-[10px] text-gray-400">
          {s.weather_label}
        </span>
        <span className="text-[10px] text-gray-400">
          {s.area_4pct_km2.toFixed(2)} km² ·{" "}
          {s.postcodes_in_cloud === 0
            ? "no postcodes affected"
            : `${s.postcodes_in_cloud} postcode${s.postcodes_in_cloud === 1 ? "" : "s"} affected`}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-accent text-xs font-bold uppercase tracking-wider mb-1">
        Rupture scenario
      </h3>

      {baseCases.map((s) => renderOption(s))}

      {variants.length > 0 && (
        <>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-2 px-2">
            Pressure sensitivity
          </p>
          {variants.map((s) => renderOption(s))}
        </>
      )}

      {selected && (
        <div className="mt-2 px-2 py-2 rounded bg-black/30 text-[11px] leading-relaxed text-gray-300">
          <p>
            <span className="text-gray-500">Reaches</span>{" "}
            {(selected.max_extent_m / 1000).toFixed(1)} km downwind
          </p>
          <p>
            <span className="text-gray-500">Released</span>{" "}
            {selected.released_t.toFixed(0)} t at up to{" "}
            {selected.peak_rate_kgs.toFixed(0)} kg/s
          </p>
          <p>
            <span className="text-gray-500">At the receptor</span>{" "}
            {arrivalLabel(selected.receptor_arrival_s)}
            {selected.receptor_max_pct !== null &&
              `, peak ${selected.receptor_max_pct.toFixed(0)}%`}
          </p>
          <p className="mt-1.5 text-gray-500">
            Contours show where CO₂ exceeded 4%, 7% and 10% by volume at 1.5 m
            above ground at any point during the release. 4% is immediately
            dangerous to life.
          </p>
        </div>
      )}
    </div>
  );
}
