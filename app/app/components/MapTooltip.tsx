export type TooltipInfo = {
  x: number;
  y: number;
  items: { label: string; color: string; detail?: string }[];
} | null;

interface MapTooltipProps {
  tooltip: TooltipInfo;
}

export default function MapTooltip({ tooltip }: MapTooltipProps) {
  if (!tooltip) return null;

  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{ left: tooltip.x + 16, top: tooltip.y + 16 }}
    >
      <div className="bg-black/95 backdrop-blur-md border border-[#FFD700]/30 rounded-xl px-5 py-4 text-sm max-w-96 shadow-xl shadow-black/60">
        {tooltip.items.map((item, index) => (
          <div
            key={index}
            className={index > 0 ? "mt-3 pt-3 border-t border-white/10" : ""}
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-block w-3 h-3 rounded-full shrink-0 ring-1 ring-white/20"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-white font-bold text-sm">{item.label}</span>
            </div>
            {item.detail && (
              <div className="text-gray-400 text-xs leading-relaxed ml-6 mt-1">
                {item.detail}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
