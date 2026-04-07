"use client";

import type { LayerVisibility } from "../types";

const LAYER_CONFIG = [
  { key: "corridor" as const, label: "Pipeline Corridor", color: "#FF4500" },
  { key: "environmental" as const, label: "Protected Sites", color: "#22C55E" },
  { key: "visual" as const, label: "Visual Impact", color: "#A855F7" },
  { key: "safety" as const, label: "CO\u2082 Sinks", color: "#DC2626" },
  { key: "schools" as const, label: "Schools", color: "#FBBF24" },
  { key: "property" as const, label: "Property Values", color: "#3B82F6" },
];

interface LayerPanelProps {
  layers: LayerVisibility;
  onToggle: (key: keyof LayerVisibility) => void;
}

export default function LayerPanel({ layers, onToggle }: LayerPanelProps) {
  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-[#FFD700] text-xs font-bold uppercase tracking-wider mb-1">
        Layers
      </h3>
      {LAYER_CONFIG.map(({ key, label, color }) => (
        <button
          key={key}
          onClick={() => onToggle(key)}
          className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all ${
            layers[key]
              ? "bg-white/10 text-white"
              : "bg-transparent text-gray-500 hover:text-gray-300"
          }`}
        >
          <span
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{
              backgroundColor: layers[key] ? color : "transparent",
              border: `2px solid ${color}`,
              opacity: layers[key] ? 1 : 0.4,
            }}
          />
          {label}
        </button>
      ))}
    </div>
  );
}
