import { Marker } from "react-map-gl/maplibre";

interface HighlightMarkerProps {
  longitude: number;
  latitude: number;
}

export default function HighlightMarker({ longitude, latitude }: HighlightMarkerProps) {
  return (
    <Marker longitude={longitude} latitude={latitude} anchor="center">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-12 h-12 rounded-full bg-[#FFD700]/30 animate-ping" />
        <div className="absolute w-10 h-10 rounded-full bg-[#FFD700]/20" />
        <div className="w-5 h-5 rounded-full bg-[#FFD700] border-2 border-white shadow-lg shadow-[#FFD700]/50" />
      </div>
    </Marker>
  );
}
