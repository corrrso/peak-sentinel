"use client";

import { useEffect, useCallback, useRef } from "react";
import type { StreetViewHotspot } from "../types";
import HeightComparison from "./HeightComparison";

interface StreetViewModalProps {
  hotspot: StreetViewHotspot;
  onClose: () => void;
}

export default function StreetViewModal({ hotspot, onClose }: StreetViewModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center animate-[fadeIn_200ms_ease-out]"
      role="dialog"
      aria-modal="true"
      aria-label={`${hotspot.agiName} height comparison`}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/80" />
      <div
        ref={contentRef}
        tabIndex={-1}
        className="
          relative z-10 outline-none
          w-full h-full animate-[slideUp_300ms_ease-out]
          md:w-auto md:h-auto md:max-w-[800px] md:max-h-[90vh]
          md:rounded-xl md:animate-[scaleIn_200ms_ease-out]
          bg-[#0a0a0a] overflow-auto
        "
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[#0a0a0a]/90 backdrop-blur-sm border-b border-white/10">
          <h2 className="text-white text-lg font-bold">{hotspot.agiName}</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-2xl leading-none p-1"
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        <div className="p-4 md:p-6">
          {hotspot.illustrationSrc && (
            <div className="mb-4">
              <img
                src={hotspot.illustrationSrc}
                alt={`Visual impact of ${hotspot.agiName}`}
                className="w-full rounded-lg"
              />
            </div>
          )}
          <HeightComparison hotspot={hotspot} />
        </div>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-white/50 text-sm text-center">{hotspot.description}</p>
        </div>
      </div>
    </div>
  );
}
