# Mobile Responsive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the map page mobile-friendly by replacing overlay panels with a compact search bar, a bottom sheet with accordions, and a floating layer button.

**Architecture:** Mobile-only changes behind Tailwind's `md:` breakpoint. Two new components (`MobileBottomSheet`, `MobileLayerButton`), one modified component (`PostcodeLookup`), and layout changes in `page.tsx`. Desktop layout stays unchanged.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS v4, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-09-mobile-responsive-design.md`

---

### Task 1: Make PostcodeLookup compact on mobile

**Files:**
- Modify: `app/app/components/PostcodeLookup.tsx:40-45`
- Modify: `app/app/page.tsx:117-125`

- [ ] **Step 1: Hide heading and description on mobile in PostcodeLookup**

In `app/app/components/PostcodeLookup.tsx`, add `hidden md:block` to the heading and description so they only show on desktop. Also remove the `mt-1` from the input row since on mobile there's no text above it (use `md:mt-1` instead):

```tsx
// Replace lines 40-46 with:
    <div className="flex flex-col gap-2">
      <h3 className="hidden md:block text-[#FFD700] text-lg font-bold">
        Is your home at risk?
      </h3>
      <p className="hidden md:block text-gray-400 text-sm">
        Enter your postcode to see how the Peak Cluster pipeline affects you
      </p>
      <div className="flex gap-2 md:mt-1">
```

- [ ] **Step 2: Update PostcodeLookup wrapper positioning in page.tsx**

In `app/app/page.tsx`, replace the postcode search wrapper (lines 117-125) so it spans full width on mobile and stays positioned on desktop:

```tsx
        {/* Postcode search — full-width on mobile, positioned on desktop */}
        <div className="absolute top-2 left-2 right-2 md:top-3 md:left-64 md:right-auto md:w-96 z-20">
          <div className="bg-black/85 backdrop-blur-sm border border-[#FFD700]/30 rounded-lg p-3 md:p-5 shadow-lg shadow-black/50">
            <PostcodeLookup
              onResult={handlePostcodeResult}
              onFlyTo={handleFlyTo}
              initialPostcode={urlPostcode}
            />
          </div>
        </div>
```

- [ ] **Step 3: Verify the build compiles**

Run: `cd /Users/lcorsini/dev/peak-cluster/app && yarn build 2>&1 | tail -20`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/lcorsini/dev/peak-cluster
git add app/app/components/PostcodeLookup.tsx app/app/page.tsx
git commit -m "Make PostcodeLookup compact on mobile

Hide heading and description below md breakpoint. Search bar spans
full width on mobile, keeps existing desktop positioning."
```

---

### Task 2: Create MobileBottomSheet component

**Files:**
- Create: `app/app/components/MobileBottomSheet.tsx`

- [ ] **Step 1: Create the MobileBottomSheet component**

Create `app/app/components/MobileBottomSheet.tsx` with the full content below. This component handles both postcode risk results and clicked map features, rendering content in a bottom sheet with accordion sections.

```tsx
"use client";

import { useState, useEffect } from "react";
import type { PostcodeData } from "../types";
import type { ClickedFeature } from "./map-layers";

const RISK_COLORS: Record<string, string> = {
  critical: "bg-red-900",
  high: "bg-red-600",
  medium: "bg-amber-500",
  low: "bg-green-500",
};

const HIDDEN_FEATURE_KEYS = new Set([
  "lat", "lon", "easting", "northing", "geometry", "area_km2",
  "target", "observer_height_m", "analysis_radius_km",
  "constraint_type", "visible_cells", "section",
]);

function formatGBP(n: number) {
  return "\u00A3" + n.toLocaleString("en-GB");
}

/* ── Sub-components ─────────────────────────────────────────── */

function RiskAccordions({
  data,
  postcode,
}: {
  data: PostcodeData;
  postcode: string;
}) {
  const [showMethodology, setShowMethodology] = useState(false);
  const lowPct = data.est_depreciation_pct_low ?? data.est_depreciation_pct;
  const highPct = data.est_depreciation_pct_high ?? data.est_depreciation_pct;

  return (
    <div className="text-sm">
      {/* Alerts — always visible, not in accordions */}
      {data.in_topo_sink && (
        <div className="text-red-400 text-xs pb-2">
          In topographic sink (depth: {data.sink_depth_m}m) &mdash; CO&#8322;
          pooling risk in case of pipeline failure
        </div>
      )}
      {data.in_viewshed && (
        <div className="text-purple-400 text-xs pb-2">
          In viewshed of proposed Coastal AGI (50m vent stack)
        </div>
      )}

      {/* Nearest AGI */}
      <details className="border-t border-white/10">
        <summary className="py-2.5 text-gray-300 cursor-pointer">
          Nearest AGI
        </summary>
        <div className="pb-3 text-gray-300 text-xs">
          {data.nearest_agi} ({data.nearest_agi_distance_m}m)
        </div>
      </details>

      {/* Property Impact */}
      <details className="border-t border-white/10">
        <summary className="py-2.5 text-gray-300 cursor-pointer">
          Estimated Property Impact
        </summary>
        <div className="pb-3 space-y-2">
          <div className="text-gray-300 text-xs">
            Avg. price ({postcode.split(" ")[0]} area):{" "}
            <span className="text-white font-semibold">
              {formatGBP(data.avg_property_price)}
            </span>
          </div>
          <div className="text-gray-500 text-[10px]">
            Source: HM Land Registry Price Paid Data (2023&ndash;2025 median)
          </div>
          <div className="bg-white/8 rounded-lg p-2.5 space-y-1.5 text-xs">
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
            className="text-[#FFD700]/70 hover:text-[#FFD700] text-[10px] underline"
          >
            {showMethodology ? "Hide methodology" : "How we estimated this"}
          </button>
          {showMethodology && (
            <div className="text-[10px] text-gray-400 space-y-1.5 bg-white/8 rounded-lg p-2.5">
              <p>
                <strong className="text-gray-300">Important: </strong>No
                peer-reviewed study exists for CO&#8322; pipeline proximity
                effects on property values. These estimates are based on studies
                of natural gas and fuel pipelines:
              </p>
              <ul className="space-y-1 list-disc pl-3">
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
      </details>

      {/* Protected Sites */}
      {data.nearby_env.length > 0 && (
        <details className="border-t border-white/10">
          <summary className="py-2.5 text-gray-300 cursor-pointer">
            Protected Sites
          </summary>
          <ul className="pb-3 space-y-1">
            {data.nearby_env.map((site) => (
              <li key={site} className="text-green-400 text-xs">
                {site}
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Nearby Schools */}
      {data.nearby_schools.length > 0 && (
        <details className="border-t border-white/10">
          <summary className="py-2.5 text-gray-300 cursor-pointer">
            Nearby Schools
          </summary>
          <ul className="pb-3 space-y-1">
            {data.nearby_schools.map((s) => (
              <li key={s} className="text-yellow-400 text-xs">
                {s}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function FeatureProperties({ feature }: { feature: ClickedFeature }) {
  return (
    <div className="text-sm text-gray-300 space-y-1">
      {Object.entries(feature.properties)
        .filter(([k]) => !HIDDEN_FEATURE_KEYS.has(k))
        .slice(0, 8)
        .map(([key, value]) => (
          <div key={key} className="flex justify-between gap-2">
            <span className="text-gray-500 capitalize">
              {key.replaceAll("_", " ")}
            </span>
            <span className="text-white text-right">{String(value)}</span>
          </div>
        ))}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────── */

interface MobileBottomSheetProps {
  riskResult: { postcode: string; data: PostcodeData } | null;
  clickedFeature: ClickedFeature | null;
  onCloseRisk: () => void;
  onCloseFeature: () => void;
}

export default function MobileBottomSheet({
  riskResult,
  clickedFeature,
  onCloseRisk,
  onCloseFeature,
}: MobileBottomSheetProps) {
  const [expanded, setExpanded] = useState(false);

  // Collapse when content changes
  useEffect(() => {
    setExpanded(false);
  }, [riskResult?.postcode, clickedFeature]);

  if (!riskResult && !clickedFeature) return null;

  const onClose = riskResult ? onCloseRisk : onCloseFeature;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/92 backdrop-blur-sm border-t border-[#FFD700]/30 rounded-t-2xl">
      {/* Drag handle */}
      <button
        className="w-full flex justify-center pt-2 pb-1"
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? "Collapse panel" : "Expand panel"}
      >
        <div className="w-9 h-1 bg-white/30 rounded-full" />
      </button>

      {/* Header row */}
      <div
        className="flex items-center justify-between px-4 pb-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {riskResult && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#FFD700] font-bold text-base truncate">
              {riskResult.postcode}
            </span>
            <span
              className={`shrink-0 px-2 py-0.5 rounded text-white text-[10px] font-bold uppercase ${
                RISK_COLORS[riskResult.data.risk_level] || "bg-gray-500"
              }`}
            >
              {riskResult.data.risk_level}
            </span>
            <span className="shrink-0 text-white text-sm font-semibold">
              {riskResult.data.distance_m}m
            </span>
          </div>
        )}

        {!riskResult && clickedFeature && (
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: clickedFeature.color }}
            />
            <span className="text-white font-bold text-sm">
              {clickedFeature.layerLabel}
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-gray-500 hover:text-white text-xl leading-none ml-2 shrink-0"
        >
          &times;
        </button>
      </div>

      {/* Expandable content */}
      {expanded && (
        <div className="overflow-y-auto max-h-[50vh] px-4 pb-4">
          {riskResult && (
            <RiskAccordions
              data={riskResult.data}
              postcode={riskResult.postcode}
            />
          )}
          {!riskResult && clickedFeature && (
            <FeatureProperties feature={clickedFeature} />
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/lcorsini/dev/peak-cluster/app && yarn build 2>&1 | tail -20`
Expected: Build succeeds (component is created but not yet imported).

- [ ] **Step 3: Commit**

```bash
cd /Users/lcorsini/dev/peak-cluster
git add app/app/components/MobileBottomSheet.tsx
git commit -m "Add MobileBottomSheet component

Bottom sheet with peek/expand states for mobile. Renders postcode
risk data as accordions or clicked feature properties."
```

---

### Task 3: Create MobileLayerButton component

**Files:**
- Create: `app/app/components/MobileLayerButton.tsx`

- [ ] **Step 1: Create the MobileLayerButton component**

Create `app/app/components/MobileLayerButton.tsx`:

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import type { LayerVisibility } from "../types";
import LayerPanel from "./LayerPanel";

interface MobileLayerButtonProps {
  layers: LayerVisibility;
  onToggle: (key: keyof LayerVisibility) => void;
  sheetVisible: boolean;
}

export default function MobileLayerButton({
  layers,
  onToggle,
  sheetVisible,
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
      className={`absolute left-3 z-30 transition-[bottom] duration-200 ${
        sheetVisible ? "bottom-20" : "bottom-3"
      }`}
    >
      {open && (
        <div className="absolute bottom-full mb-2 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-3 w-48">
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
```

- [ ] **Step 2: Verify the build compiles**

Run: `cd /Users/lcorsini/dev/peak-cluster/app && yarn build 2>&1 | tail -20`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/lcorsini/dev/peak-cluster
git add app/app/components/MobileLayerButton.tsx
git commit -m "Add MobileLayerButton component

Floating button with popover for layer toggles on mobile.
Click outside to close."
```

---

### Task 4: Wire mobile components into page.tsx

**Files:**
- Modify: `app/app/page.tsx`

This task replaces the mobile layout in the map section. Desktop rendering stays exactly as-is, gated behind `hidden md:block` or `hidden md:flex`.

- [ ] **Step 1: Add imports for new components**

In `app/app/page.tsx`, add imports after the existing import block (after line 12):

```tsx
import MobileBottomSheet from "./components/MobileBottomSheet";
import MobileLayerButton from "./components/MobileLayerButton";
```

- [ ] **Step 2: Hide the desktop RiskCard on mobile**

Replace the RiskCard wrapper (lines 134-142):

```tsx
        {riskResult && (
          <div className="hidden md:block absolute z-10 top-20 right-3 w-96">
            <RiskCard
              postcode={riskResult.postcode}
              data={riskResult.data}
              onClose={() => setRiskResult(null)}
            />
          </div>
        )}
```

Key change: `hidden md:block` added, and simplified to just `w-96` (no mobile `w-80` needed since it's desktop-only now).

- [ ] **Step 3: Hide the desktop clicked feature card on mobile**

Replace the clicked feature wrapper (lines 144-175):

```tsx
        {!riskResult && clickedFeature && (
          <div className="hidden md:block absolute z-10 top-20 right-3 w-80">
            <div className="bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-4 shadow-lg shadow-black/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full"
                    style={{ backgroundColor: clickedFeature.color }}
                  />
                  <span className="text-white font-bold text-sm">{clickedFeature.layerLabel}</span>
                </div>
                <button
                  onClick={() => setClickedFeature(null)}
                  className="text-gray-500 hover:text-white text-sm"
                >
                  &times;
                </button>
              </div>
              <div className="text-sm text-gray-300 space-y-1">
                {Object.entries(clickedFeature.properties)
                  .filter(([k]) => !["lat", "lon", "easting", "northing", "geometry", "area_km2", "target", "observer_height_m", "analysis_radius_km", "constraint_type", "visible_cells", "section"].includes(k))
                  .slice(0, 8)
                  .map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <span className="text-gray-500 capitalize">{key.replaceAll('_', " ")}</span>
                      <span className="text-white text-right">{String(value)}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
```

Key change: `hidden md:block` added to the outer wrapper.

- [ ] **Step 4: Replace mobile layer panel with MobileLayerButton**

Remove the mobile `<details>` layer panel (lines 184-193):

```tsx
        {/* DELETE THIS ENTIRE BLOCK: */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 z-10">
          <details className="bg-black/90 backdrop-blur-sm border-t border-white/10 p-3 text-xs">
            <summary className="text-[#FFD700] cursor-pointer font-bold uppercase tracking-wider">
              Layers
            </summary>
            <div className="mt-2">
              <LayerPanel layers={layers} onToggle={toggleLayer} />
            </div>
          </details>
        </div>
```

Replace it with the two new mobile components, placed just before the closing `</div>` of the map section:

```tsx
        {/* Mobile: bottom sheet for risk/feature info */}
        <div className="md:hidden">
          <MobileBottomSheet
            riskResult={riskResult}
            clickedFeature={clickedFeature}
            onCloseRisk={() => setRiskResult(null)}
            onCloseFeature={() => setClickedFeature(null)}
          />
        </div>

        {/* Mobile: floating layer button */}
        <div className="md:hidden">
          <MobileLayerButton
            layers={layers}
            onToggle={toggleLayer}
            sheetVisible={!!(riskResult || clickedFeature)}
          />
        </div>
```

- [ ] **Step 5: Verify the build compiles**

Run: `cd /Users/lcorsini/dev/peak-cluster/app && yarn build 2>&1 | tail -20`
Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/lcorsini/dev/peak-cluster
git add app/app/page.tsx
git commit -m "Wire mobile bottom sheet and layer button into page

Desktop panels hidden on mobile via md: breakpoint. Mobile gets
bottom sheet for risk/feature info and floating layer button.
Desktop layout unchanged."
```

---

### Task 5: Visual verification

- [ ] **Step 1: Start dev server and test mobile layout**

Run: `cd /Users/lcorsini/dev/peak-cluster/app && yarn dev`

Open in browser, use Chrome DevTools device toolbar (Cmd+Shift+M) to test at mobile widths (375px, 390px, 414px).

Verify:
1. Search bar spans full width at top with small margins, no heading/description text
2. No panels overlay the map when nothing is searched
3. Layer button floats at bottom-left
4. Layer button opens popover with toggles, closes on outside click
5. After searching a postcode: bottom sheet appears in peek state with postcode, risk badge, distance
6. Tapping the sheet header expands it, showing accordion sections
7. Accordions open/close individually, no icons in labels
8. Scrolling works within expanded sheet when content exceeds 50vh
9. Close button dismisses the sheet
10. Clicking a map feature shows feature info in the bottom sheet instead
11. Layer button shifts up when bottom sheet is visible

Then verify desktop (resize wider than 768px):
12. PostcodeLookup shows heading and description, positioned at left-64
13. RiskCard appears on the right side as before
14. Layer panel shows as column top-left
15. No bottom sheet or floating layer button visible

- [ ] **Step 2: Fix any issues found during verification**

Address any layout or interaction issues discovered in Step 1. Common things to check:
- z-index stacking (search bar z-20, bottom sheet z-20, layer button z-30)
- Bottom sheet not overlapping the search bar
- Touch targets large enough on mobile (minimum 44px)

- [ ] **Step 3: Final commit if fixes were needed**

```bash
cd /Users/lcorsini/dev/peak-cluster
git add -A
git commit -m "Fix mobile layout issues found during verification"
```
