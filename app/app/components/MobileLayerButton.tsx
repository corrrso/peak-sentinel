"use client";

import { useState, useRef, useEffect } from "react";
import type { LayerVisibility } from "../types";
import LayerPanel from "./LayerPanel";

interface MobileLayerButtonProps {
  layers: LayerVisibility;
  onToggle: (key: keyof LayerVisibility) => void;
}

export default function MobileLayerButton({
  layers,
  onToggle,
}: MobileLayerButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div
      ref={ref}
      className="absolute left-3 top-[5.5rem] z-30"
    >
      {open && (
        <div className="absolute top-full mt-2 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-3 w-48">
          <LayerPanel layers={layers} onToggle={onToggle} />
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg px-3 py-2 text-[#FFD700] text-xs font-bold uppercase tracking-wider"
      >
        Layers
      </button>
    </div>
  );
}
