# Mobile Responsive Design: Bottom Sheet and Compact Controls

## Problem

On mobile, the postcode search panel and risk card overlay most of the map, making it unusable. The selected postcode is not visible, and the map cannot be interacted with meaningfully.

## Scope

Mobile viewports only (below Tailwind's `md` breakpoint, 768px). Desktop layout remains unchanged.

## Design

### 1. Compact Search Bar (mobile)

Replace the full PostcodeLookup panel (heading + description + input) with a compact version on mobile: just the text input and "Check" button. No heading, no description text.

Position: `absolute top-2 left-2 right-2` over the map. Same `bg-black/85 backdrop-blur-sm border border-[#FFD700]/30` styling.

Desktop: unchanged (keeps heading and description text, positioned top-left with `md:left-64`).

### 2. Bottom Sheet

A slide-up panel anchored to the bottom of the map container. Three states:

**Hidden:** Default state. No postcode searched, no feature clicked. Nothing rendered at the bottom.

**Peek:** A collapsed bar showing a summary row. Appears when a postcode is searched or a map feature is clicked. User taps the header or a visible affordance to expand.

**Expanded:** Panel grows to `max-h-[60vh]` with `overflow-y-auto`. Contains accordion sections, all collapsed by default. A drag handle visual indicator sits at the top of the sheet.

#### Bottom Sheet Content: Postcode Risk Result

Header row (always visible in peek and expanded states):
- Postcode text
- Risk level badge (colored, uppercase)
- Distance from pipeline

Below header (visible when expanded):
- Alert items shown inline, not in accordions (CO2 pooling risk in red, viewshed warning in purple). Only rendered when the data flags are true.
- Accordion: "Nearest AGI" — site name and distance
- Accordion: "Estimated Property Impact" — average price, depreciation table (conservative/central/high), methodology toggle
- Accordion: "Protected Sites" — list of nearby environmental designations
- Accordion: "Nearby Schools" — list of nearby schools

Close button (×) in the header row to dismiss the sheet entirely.

No icons or emojis in accordion labels. Plain text only.

#### Bottom Sheet Content: Clicked Map Feature

Header row:
- Layer color dot + layer name

Below header (visible when expanded):
- Filtered properties list (same key/value pairs as the current clicked feature card)

Close button (×) in header.

#### State Transitions

- Searching a postcode replaces any clicked feature content in the sheet.
- Clicking a map feature replaces any postcode risk content in the sheet.
- Closing the sheet returns it to hidden state.
- This matches existing behavior where `riskResult` and `clickedFeature` are mutually exclusive.

### 3. Layer Panel (mobile)

Replace the current `<details>` collapsible at the bottom of the map with a floating button.

- Position: bottom-left of the map, above the bottom sheet when both are present.
- Tapping opens a popover/dropdown above the button containing the layer toggle switches.
- Tapping the button again or tapping outside the popover closes it.
- Styling consistent with existing dark theme (`bg-black/80 backdrop-blur-sm border border-white/10`).

Desktop: unchanged (layer panel stays as a fixed column top-left).

### 4. Unchanged Elements

- Desktop layout (all panels positioned as side overlays on `md:` and above)
- Map height (`h-[70vh] min-h-[500px]`)
- Action section below the map
- All page content below the fold
- Map disclaimer text (desktop only, already hidden on mobile)

## Implementation Notes

- Use Tailwind responsive classes (`md:hidden`, `hidden md:block`) to switch between mobile and desktop layouts. No separate components needed — conditional rendering within existing components.
- The bottom sheet expand/collapse can use CSS transitions on `max-height` or a state variable controlling a class.
- Accordions: native `<details>`/`<summary>` elements or a simple state-driven toggle. No library needed.
- The PostcodeLookup component needs a `compact` prop (or a responsive approach) to hide heading/description on mobile.
- RiskCard needs restructuring to render as a bottom sheet on mobile vs. a positioned card on desktop. A wrapper component or conditional classes can handle this.
