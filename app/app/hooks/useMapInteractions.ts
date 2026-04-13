import { useRef, useState, useEffect } from "react";
import type { MapRef } from "react-map-gl/maplibre";
import type { TooltipInfo } from "../components/MapTooltip";
import { LAYER_INFO, type ClickedFeature } from "../components/map-layers";

const KNOWN_LAYER_IDS = new Set(Object.keys(LAYER_INFO));

export default function useMapInteractions(
  mapRef: React.RefObject<MapRef | null>,
  dataLoaded: boolean,
  onFeatureClick?: (feature: ClickedFeature | null) => void,
  onPostcodeClick?: (postcode: string, coords: { longitude: number; latitude: number }) => void,
  onAgiClick?: (agiName: string) => boolean,
) {
  const [tooltip, setTooltip] = useState<TooltipInfo>(null);
  const [clickLocation, setClickLocation] = useState<{
    longitude: number;
    latitude: number;
  } | null>(null);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFeatureClickRef = useRef(onFeatureClick);
  const onPostcodeClickRef = useRef(onPostcodeClick);
  const onAgiClickRef = useRef(onAgiClick);

  useEffect(() => {
    onFeatureClickRef.current = onFeatureClick;
  }, [onFeatureClick]);

  useEffect(() => {
    onPostcodeClickRef.current = onPostcodeClick;
  }, [onPostcodeClick]);

  useEffect(() => {
    onAgiClickRef.current = onAgiClick;
  }, [onAgiClick]);

  useEffect(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;

    const onMove = (event: maplibregl.MapMouseEvent) => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setTooltip(null);

      const features = map.queryRenderedFeatures(event.point);
      if (!features || features.length === 0) return;

      const matched = features.filter((f) => KNOWN_LAYER_IDS.has(f.layer.id));
      if (matched.length === 0) return;

      const px = event.point.x;
      const py = event.point.y;

      hoverTimerRef.current = setTimeout(() => {
        const seen = new Set<string>();
        const items: { label: string; color: string; detail?: string }[] = [];
        for (const f of matched) {
          const layerId = f.layer.id;
          const info = LAYER_INFO[layerId];
          if (!info || seen.has(layerId)) continue;
          seen.add(layerId);
          const detail = info.detail
            ? info.detail((f.properties || {}) as Record<string, unknown>)
            : undefined;
          items.push({ label: info.label, color: info.color, detail });
        }
        if (items.length > 0) {
          setTooltip({ x: px, y: py, items });
        }
      }, 1000);
    };

    const onLeave = () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
      setTooltip(null);
    };

    const onClick = (event: maplibregl.MapMouseEvent) => {
      setTooltip(null);
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }

      const CLICK_RADIUS = 25;
      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [event.point.x - CLICK_RADIUS, event.point.y - CLICK_RADIUS],
        [event.point.x + CLICK_RADIUS, event.point.y + CLICK_RADIUS],
      ];

      // AGI-layer priority: notify callback, but only skip generic handling
      // if the callback returns true (hotspot found and modal opened)
      const hasAgiLayer = !!map.getLayer("agi-circles");
      const agiFeatures = hasAgiLayer
        ? map.queryRenderedFeatures(event.point, { layers: ["agi-circles"] })
        : [];
      if (agiFeatures.length > 0 && agiFeatures[0].properties?.name) {
        const name = String(agiFeatures[0].properties.name);
        if (onAgiClickRef.current) {
          const consumed = onAgiClickRef.current(name);
          if (consumed) return;
        }
      }

      const hasPropertyLayer = !!map.getLayer("property-circles");
      const propertyFeatures = hasPropertyLayer
        ? map.queryRenderedFeatures(bbox, { layers: ["property-circles"] })
        : [];
      if (propertyFeatures && propertyFeatures.length > 0) {
        let closest = propertyFeatures[0];
        let closestDistance = Infinity;
        for (const f of propertyFeatures) {
          const props = f.properties as Record<string, unknown>;
          const fLon = Number(props.lon);
          const fLat = Number(props.lat);
          if (!Number.isNaN(fLon) && !Number.isNaN(fLat)) {
            const projected = map.project([fLon, fLat]);
            const dx = projected.x - event.point.x;
            const dy = projected.y - event.point.y;
            const distance = dx * dx + dy * dy;
            if (distance < closestDistance) {
              closestDistance = distance;
              closest = f;
            }
          }
        }
        const props = closest.properties as Record<string, unknown>;
        const postcode = String(props.postcode || "");
        const lon = Number(props.lon);
        const lat = Number(props.lat);
        if (postcode && !Number.isNaN(lon) && !Number.isNaN(lat)) {
          setClickLocation(null);
          onPostcodeClickRef.current?.(postcode, { longitude: lon, latitude: lat });
          return;
        }
      }

      const features = map.queryRenderedFeatures(event.point);
      const matched = features?.filter((f) => KNOWN_LAYER_IDS.has(f.layer.id));

      if (matched && matched.length > 0) {
        const f = matched[0];
        const info = LAYER_INFO[f.layer.id];
        if (info) {
          setClickLocation({ longitude: event.lngLat.lng, latitude: event.lngLat.lat });
          onFeatureClickRef.current?.({
            layerLabel: info.label,
            color: info.color,
            properties: (f.properties || {}) as Record<string, unknown>,
            longitude: event.lngLat.lng,
            latitude: event.lngLat.lat,
          });
        }
      } else {
        setClickLocation(null);
        onFeatureClickRef.current?.(null);
      }
    };

    map.on("mousemove", onMove);
    map.on("mouseout", onLeave);
    map.on("click", onClick);

    return () => {
      map.off("mousemove", onMove);
      map.off("mouseout", onLeave);
      map.off("click", onClick);
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    };
  }, [dataLoaded]);

  return { tooltip, clickLocation };
}
