interface SilhouetteProps {
  height: number;
  x: number;
  baseY: number;
}

interface AgiComplexProps extends SilhouetteProps {
  facilityWidthPx: number;
}

export function HumanFigure({ height, x, baseY }: SilhouetteProps) {
  const headR = height * 0.18;
  const bodyH = height * 0.38;
  const legH = height * 0.3;
  const neckY = baseY - legH - bodyH;
  return (
    <g>
      <circle cx={x} cy={neckY - headR} r={headR} fill="rgba(255,255,255,0.5)" />
      <rect x={x - height * 0.12} y={neckY} width={height * 0.24} height={bodyH} fill="rgba(255,255,255,0.35)" rx={1} />
      <rect x={x - height * 0.1} y={baseY - legH} width={height * 0.08} height={legH} fill="rgba(255,255,255,0.3)" />
      <rect x={x + height * 0.02} y={baseY - legH} width={height * 0.08} height={legH} fill="rgba(255,255,255,0.3)" />
    </g>
  );
}

export function TerracedHouses({ height, x, baseY }: SilhouetteProps) {
  const houseW = height * 0.7;
  const roofH = height * 0.35;
  const wallH = height * 0.65;
  const gap = 1;
  const totalW = houseW * 3 + gap * 2;
  const startX = x - totalW / 2;
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const hx = startX + i * (houseW + gap);
        return (
          <g key={i}>
            <polygon points={`${hx},${baseY - wallH} ${hx + houseW / 2},${baseY - wallH - roofH} ${hx + houseW},${baseY - wallH}`} fill="#5a4030" />
            <rect x={hx} y={baseY - wallH} width={houseW} height={wallH} fill="#4a3525" />
            <rect x={hx + houseW * 0.2} y={baseY - wallH + wallH * 0.15} width={houseW * 0.25} height={houseW * 0.25} fill="rgba(255,200,80,0.25)" />
            <rect x={hx + houseW * 0.55} y={baseY - wallH + wallH * 0.15} width={houseW * 0.25} height={houseW * 0.25} fill="rgba(255,200,80,0.18)" />
          </g>
        );
      })}
    </g>
  );
}

export function Lighthouse({ height, x, baseY }: SilhouetteProps) {
  const lampH = height * 0.04;
  const galleryH = height * 0.02;
  const upperH = height * 0.28;
  const bandH = height * 0.02;
  const lowerH = height * 0.56;
  const baseH = height * 0.04;
  const topW = height * 0.08;
  const bottomW = height * 0.12;
  let y = baseY;
  const baseTop = y - baseH; y = baseTop;
  const lowerTop = y - lowerH; y = lowerTop;
  const bandTop = y - bandH; y = bandTop;
  const upperTop = y - upperH; y = upperTop;
  const galleryTop = y - galleryH; y = galleryTop;
  const lampTop = y - lampH;
  return (
    <g>
      <rect x={x - topW * 0.7} y={lampTop} width={topW * 1.4} height={lampH} fill="rgba(255,240,180,0.8)" rx={2} />
      <rect x={x - topW * 0.9} y={galleryTop} width={topW * 1.8} height={galleryH} fill="#777" />
      <rect x={x - topW / 2} y={upperTop} width={topW} height={upperH} fill="url(#lighthouseGrad)" />
      <rect x={x - (topW + bottomW) / 4} y={bandTop} width={(topW + bottomW) / 2} height={bandH} fill="#a09070" />
      <polygon points={`${x - topW / 2},${lowerTop} ${x + topW / 2},${lowerTop} ${x + bottomW / 2},${baseTop} ${x - bottomW / 2},${baseTop}`} fill="url(#lighthouseGrad)" />
      <rect x={x - bottomW * 0.6} y={baseTop} width={bottomW * 1.2} height={baseH} fill="#8a7a60" rx={1} />
    </g>
  );
}

export function Church({ height, x, baseY }: SilhouetteProps) {
  const spireH = height * 0.35;
  const towerH = height * 0.35;
  const bodyH = height * 0.3;
  const towerW = height * 0.12;
  const bodyW = height * 0.3;
  const bodyTop = baseY - bodyH;
  const towerTop = bodyTop - towerH;
  const spireTop = towerTop - spireH;
  return (
    <g>
      <polygon points={`${x},${spireTop} ${x - towerW / 2},${towerTop} ${x + towerW / 2},${towerTop}`} fill="#555" />
      <rect x={x - towerW / 2} y={towerTop} width={towerW} height={towerH} fill="#4a4a4a" />
      <rect x={x - towerW * 0.15} y={towerTop + towerH * 0.2} width={towerW * 0.3} height={towerH * 0.2} fill="rgba(255,200,80,0.15)" rx={1} />
      <rect x={x - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} fill="#3d3d3d" />
      <polygon points={`${x - bodyW / 2 - 2},${bodyTop} ${x},${bodyTop - bodyH * 0.3} ${x + bodyW / 2 + 2},${bodyTop}`} fill="#4a4a4a" />
    </g>
  );
}

export function AgiComplex({ height, x, baseY, facilityWidthPx }: AgiComplexProps) {
  const stackH = height;
  const stackW = height * 0.04;
  const buildingH = height * 0.35;
  const buildingW = facilityWidthPx * 0.3;
  const tankH = height * 0.22;
  const tankW = facilityWidthPx * 0.12;
  const coolingH = height * 0.3;
  const coolingW = facilityWidthPx * 0.1;
  const secondaryStackH = height * 0.38;
  const pipeRackH = height * 0.18;
  const pipeRackW = facilityWidthPx * 0.07;
  const leftEdge = x - facilityWidthPx / 2;
  return (
    <g>
      <rect x={leftEdge} y={baseY - coolingH} width={coolingW} height={coolingH} fill="url(#steelGrad)" rx={2} />
      <rect x={leftEdge + coolingW * 0.35} y={baseY - coolingH - height * 0.08} width={coolingW * 0.3} height={height * 0.08} fill="#666" />
      <rect x={leftEdge + facilityWidthPx * 0.15 - stackW * 0.4} y={baseY - secondaryStackH} width={stackW * 0.8} height={secondaryStackH - buildingH} fill="url(#steelGrad)" />
      <rect x={leftEdge + facilityWidthPx * 0.12} y={baseY - buildingH} width={facilityWidthPx * 0.08} height={buildingH} fill="#4a4a4a" />
      <circle cx={leftEdge + facilityWidthPx * 0.3} cy={baseY - stackH - 3} r={2.5} fill="#ff3333" />
      <circle cx={leftEdge + facilityWidthPx * 0.3} cy={baseY - stackH - 3} r={6} fill="rgba(255,50,50,0.2)" />
      <rect x={leftEdge + facilityWidthPx * 0.3 - stackW} y={baseY - stackH} width={stackW * 2} height={3} fill="#888" rx={1} />
      <rect x={leftEdge + facilityWidthPx * 0.3 - stackW / 2} y={baseY - stackH + 3} width={stackW} height={stackH - 3} fill="url(#steelGrad)" />
      <rect x={leftEdge + facilityWidthPx * 0.3 - stackW} y={baseY - buildingH} width={stackW * 2} height={2} fill="#777" />
      <rect x={leftEdge + facilityWidthPx * 0.35} y={baseY - buildingH} width={buildingW} height={buildingH} fill="url(#buildingGrad)" />
      {[0.38, 0.42, 0.46].map((pct, i) => (
        <rect key={i} x={leftEdge + facilityWidthPx * pct} y={baseY - buildingH - [6, 9, 5][i]} width={2} height={[6, 9, 5][i]} fill="#555" />
      ))}
      {[0.15, 0.35, 0.55].map((pct, i) => (
        <line key={i} x1={leftEdge + facilityWidthPx * 0.36} y1={baseY - buildingH + buildingH * pct} x2={leftEdge + facilityWidthPx * 0.35 + buildingW - 4} y2={baseY - buildingH + buildingH * pct} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      <rect x={leftEdge + facilityWidthPx * 0.35 + buildingW - buildingW * 0.25} y={baseY - buildingH * 0.3} width={buildingW * 0.2} height={buildingH * 0.3} fill="rgba(255,200,50,0.06)" stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
      <rect x={leftEdge + facilityWidthPx * 0.7} y={baseY - tankH} width={tankW} height={tankH} fill="url(#steelGrad)" rx={3} />
      <rect x={leftEdge + facilityWidthPx * 0.7 + tankW * 0.35} y={baseY - tankH - height * 0.06} width={tankW * 0.3} height={height * 0.06} fill="#666" />
      <rect x={leftEdge + facilityWidthPx * 0.85} y={baseY - pipeRackH} width={1.5} height={pipeRackH} fill="#444" />
      <rect x={leftEdge + facilityWidthPx * 0.85 + pipeRackW} y={baseY - pipeRackH} width={1.5} height={pipeRackH} fill="#444" />
      {[0.25, 0.5, 0.75].map((pct, i) => (
        <line key={i} x1={leftEdge + facilityWidthPx * 0.85} y1={baseY - pipeRackH * pct} x2={leftEdge + facilityWidthPx * 0.85 + pipeRackW} y2={baseY - pipeRackH * pct} stroke="#555" strokeWidth={1} />
      ))}
      <line x1={leftEdge - 4} y1={baseY + 2} x2={leftEdge + facilityWidthPx + 4} y2={baseY + 2} stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4 3" />
    </g>
  );
}

export function HeightMarker({ label, x, topY, color }: { label: string; x: number; topY: number; color: string }) {
  return (
    <g>
      <text x={x} y={topY - 10} textAnchor="middle" fill={color} fontSize={13} fontWeight="bold">{label}</text>
      <line x1={x} y1={topY - 6} x2={x} y2={topY} stroke={color} strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />
    </g>
  );
}

export function SvgDefs() {
  return (
    <defs>
      <linearGradient id="lighthouseGrad" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stopColor="#b0a080" />
        <stop offset="50%" stopColor="#d4c8a8" />
        <stop offset="100%" stopColor="#b0a080" />
      </linearGradient>
      <linearGradient id="steelGrad" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stopColor="#555" />
        <stop offset="50%" stopColor="#888" />
        <stop offset="100%" stopColor="#555" />
      </linearGradient>
      <linearGradient id="buildingGrad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#3a3a3a" />
        <stop offset="100%" stopColor="#2a2a2a" />
      </linearGradient>
      <linearGradient id="skyGrad" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stopColor="#060d1a" />
        <stop offset="40%" stopColor="#0f1d3a" />
        <stop offset="65%" stopColor="#1a2744" />
        <stop offset="84%" stopColor="#2a1f0a" />
        <stop offset="85%" stopColor="#1a1a1a" />
        <stop offset="100%" stopColor="#141414" />
      </linearGradient>
    </defs>
  );
}
