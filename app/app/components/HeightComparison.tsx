import type { StreetViewHotspot } from "../types";
import {
  HumanFigure,
  TerracedHouses,
  Lighthouse,
  Church,
  AgiComplex,
  HeightMarker,
  SvgDefs,
} from "./LandmarkSilhouettes";

const SILHOUETTE_COMPONENTS = {
  lighthouse: Lighthouse,
  church: Church,
  house: TerracedHouses,
  tree: TerracedHouses,
} as const;

const SVG_WIDTH = 800;
const SVG_HEIGHT = 480;
const GROUND_Y = 400;
const MAX_STRUCTURE_HEIGHT = 360;
const LABEL_COLOR_LANDMARK = "#FFD700";
const LABEL_COLOR_AGI = "#FF4500";

export default function HeightComparison({ hotspot }: { hotspot: StreetViewHotspot }) {
  const maxHeight = Math.max(hotspot.towerHeight, hotspot.landmark.height);
  const scale = MAX_STRUCTURE_HEIGHT / maxHeight;
  const facilityWidthPx = Math.min(hotspot.facility.width * scale * 0.5, SVG_WIDTH * 0.5);
  const agiCenterX = SVG_WIDTH - facilityWidthPx / 2 - 20;
  const leftAvailable = agiCenterX - facilityWidthPx / 2 - 40;
  let nextX = 30;
  const humanH = hotspot.humanScale ? 1.7 * scale : 0;
  const humanX = nextX;
  if (hotspot.humanScale) nextX += 30;
  const housesH = hotspot.showTerracedHouses ? 8 * scale : 0;
  const housesX = nextX + 20;
  if (hotspot.showTerracedHouses) nextX += 70;
  const landmarkH = hotspot.landmark.height * scale;
  const landmarkX = Math.min(nextX + 40, leftAvailable - 20);
  const towerH = hotspot.towerHeight * scale;
  const LandmarkComponent = SILHOUETTE_COMPONENTS[hotspot.landmark.silhouette];

  return (
    <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-auto" role="img" aria-label={hotspot.description}>
      <SvgDefs />
      <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#skyGrad)" />
      {[[95, 25], [390, 45], [600, 18], [240, 55], [480, 12], [720, 38]].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={1} fill="#fff" opacity={0.2 + (i % 3) * 0.1} />
      ))}
      <line x1={0} y1={GROUND_Y} x2={SVG_WIDTH} y2={GROUND_Y} stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      {hotspot.humanScale && (
        <>
          <HumanFigure height={humanH} x={humanX} baseY={GROUND_Y} />
          <text x={humanX} y={GROUND_Y - humanH - 4} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={8}>1.7m</text>
        </>
      )}
      {hotspot.showTerracedHouses && (
        <>
          <TerracedHouses height={housesH} x={housesX} baseY={GROUND_Y} />
          <text x={housesX} y={GROUND_Y - housesH - 4} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={8}>~8m</text>
        </>
      )}
      <LandmarkComponent height={landmarkH} x={landmarkX} baseY={GROUND_Y} />
      <HeightMarker label={`${hotspot.landmark.height}m`} x={landmarkX} topY={GROUND_Y - landmarkH} color={LABEL_COLOR_LANDMARK} />
      <text x={landmarkX} y={GROUND_Y + 16} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={10}>{hotspot.landmark.name}</text>
      <AgiComplex height={towerH} x={agiCenterX} baseY={GROUND_Y} facilityWidthPx={facilityWidthPx} />
      <HeightMarker label={`${hotspot.towerHeight}m`} x={agiCenterX - facilityWidthPx / 2 + facilityWidthPx * 0.3} topY={GROUND_Y - towerH} color={LABEL_COLOR_AGI} />
      <text x={agiCenterX} y={GROUND_Y + 16} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={11}>{hotspot.agiName}</text>
      {hotspot.facility.width > 100 && (
        <g>
          <line x1={agiCenterX - facilityWidthPx / 2} y1={GROUND_Y + 30} x2={agiCenterX - facilityWidthPx * 0.15} y2={GROUND_Y + 30} stroke="rgba(255,69,0,0.3)" strokeWidth={1} />
          <text x={agiCenterX} y={GROUND_Y + 34} textAnchor="middle" fill="rgba(255,69,0,0.7)" fontSize={10}>~{hotspot.facility.width}m wide</text>
          <line x1={agiCenterX + facilityWidthPx * 0.15} y1={GROUND_Y + 30} x2={agiCenterX + facilityWidthPx / 2} y2={GROUND_Y + 30} stroke="rgba(255,69,0,0.3)" strokeWidth={1} />
        </g>
      )}
      <text x={SVG_WIDTH / 2} y={SVG_HEIGHT - 16} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize={11} fontStyle="italic">{hotspot.description}</text>
    </svg>
  );
}
