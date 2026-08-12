# Satartia, Mississippi: the real-world reference case

**Source:** PHMSA Office of Pipeline Safety, Accident Investigation Division,
*Failure Investigation Report - Denbury Gulf Coast Pipelines, LLC - Pipeline
Rupture / Natural Force Damage*, 26 May 2022. Principal investigator Wesley
Mathews. Incident 22 February 2020, Satartia, Yazoo County, MS. WMS activity
ID 20-176125, milepost 6.6.

Retrieved from the Illinois Commerce Commission docket copy (P2023-0161,
filed as Sangamon County Exhibit 1.3), which carries a text layer. The PHMSA
site returns 403 to automated fetches. The North Dakota PSC copy (case
22-0391) is a 47 page scan comprising the same 15 page body plus appendices;
it was OCRed at 300 dpi with tesseract 5.5.3 to check the appendices for
crater dimensions. Appendices are: A map, B two National Response Center
reports, C the PHMSA form 7000.1 final report, D the Mears Group root cause
and metallurgical analysis.

## Measured facts

| Quantity | Value |
|---|---|
| Pipe | 24 in OD (610 mm), 0.469 in wall (11.9 mm), API 5L X80 |
| Bore | 586 mm |
| Pressure at failure | 1,400 psig = 96.5 barg |
| Phase | Supercritical (above the 1,070 psig needed to stay supercritical) |
| Valve spacing | 9.55 miles = 15.4 km between Tinsley and Satartia MLBVs |
| Released | 31,405 barrels = 4,993 m3, roughly 4,000 to 5,000 t |
| Cause | Landslide after heavy rain, axial strain, full circumferential girth weld failure |
| Crater depth | 40 ft (12.2 m) downstream side, about 4 ft (1.2 m) upstream |
| Isolation | Ruptured 7:06 pm, shut down by 7:15 pm, 9 minutes (540 s) |
| Release fully secured | 23:08, about 4 hours after rupture |
| Release duration | 4 hours (stated on the NRC report) |
| Leak verified on site | 20:46, 100 minutes after the 19:07 pressure drop |
| Cloud reach | About 1 mile (1.6 km) to Satartia, over a hill crest |
| Evacuation radius | 0.25 miles (400 m), 200 people |
| Consequences | 45 sent to hospital, 2 still admitted two days later, no fatalities |
| Cost | $3,947,009 |

PHMSA notes the reported release volume "likely exceeded this amount due to a
valve operation error", so 4,000 to 5,000 t is a floor. The NRC report filed
during the response gives the lower interim figure of 21,873 barrels; 31,405
barrels is the final November 2020 number.

**Crater width and plan area are not stated anywhere in the report, including
all four appendices.** Only depth is given. The Mears appendix is metallurgy
and root cause only, with no site geometry. Do not infer a diameter from the
depth figures.

## Why it is not a like-for-like comparison

Satartia was a **dense phase** line at 96.5 barg. Peak Cluster's onshore
pipeline is stated to be **gas phase** (Scoping Report 3.2.67), which this
project models at 35 barg. Dense-phase CO2 is roughly ten times denser than
our 92 kg/m3, so Satartia released four to five times more mass from a
*smaller* bore. Absolute footprints do not transfer.

## What does transfer

1. **The pipeline self-excavates a crater.** The report is explicit: "The
   pipeline self-excavated due to the discharge of CO2." Crater formation is
   an observed fact, not a modelling convenience.
2. **The crater is deep and asymmetric**, 12.2 m against 1.2 m. Our source
   term is a flat 20 m patch, which matches neither the depth nor the
   asymmetry.
3. **The gas pooled in the crater first**, then overtopped the hill crest and
   drained into the valley. This is exactly the dense-gas behaviour TWODEE
   models well, and it supports the terrain-drainage results.
4. **Terrain dominated the outcome.** "Atmospheric conditions and unique
   topographical features of the accident site significantly delayed
   dissipation." Also relevant: winds were light, the worst case for dense gas,
   consistent with this project's F2 case being the more severe.
5. **Release continues long after valve closure.** Isolation took 9 minutes but
   venting ran for several hours. Our 930 s valve closure assumption governs
   only the feed, not the tail of the blowdown.
6. **Harm occurred at about 1.6 km** with 45 hospitalisations from a village of
   roughly 50 residents plus passing motorists. Our Greasby runs put the 4%
   contour well beyond that distance into far denser population.

## Our blowdown timescale looks far too fast

Satartia gives a measured release duration, which is a direct check on the
one part of our source term that carries no validation.

| | Satartia (measured) | Our model (35 barg gas) |
|---|---|---|
| Valve isolation | 540 s | 930 s (assumed) |
| Release fully secured | about 14,400 s (4 h) | 99% vented by 396 s (6.6 min) |

Our exponential decay has tau = 86 s, so it empties the 16 km segment in
under seven minutes. Satartia vented for four hours, roughly 27 times longer
than its own isolation time.

Some of that gap is phase: dense-phase CO2 holds far more mass and boils off
slowly, so a gas-phase line should genuinely drain faster. But the ratio is
large enough to question the model rather than explain it away. `blowdown.py`
states the omission directly: "Friction-limited late-time flow is not
modelled; the sensitivity study varies tau instead." A real 16 km segment has
substantial pipe friction, and flow late in a blowdown is friction limited
rather than choked at the orifice.

Why this matters for the footprint: too short a release concentrates the whole
inventory into a few minutes, which inflates the peak rate driving the source.
That peak rate is exactly what is pushing TWODEE outside its shallow-layer
regime (see `rupture-simulation-status.md`). The two problems may share a
root: a source term that releases too much, too fast, through too small an
area.

Worth putting to the expert alongside the crater question: is a
friction-limited blowdown needed, and what release duration should a 16 km
gas-phase segment give?

## The finding that matters most for consultation

Denbury's own dispersion model "did not contemplate a release that could
affect the Village of Satartia." The operator underestimated the affected
area, and PHMSA cited it as a contributing factor. That is a direct precedent
for challenging Peak Cluster's hazard modelling, and it does not depend on any
number this project computes.

## Open question this does not answer

Crater plan dimensions, the input needed to size the TWODEE source patch (see
the source-term issue in `rupture-simulation-status.md`). Depth alone does not
constrain it, and the figure is absent from the report and all four
appendices, which have been checked by OCR.

Remaining routes, in rough order of cost:

- Photogrammetry from the published aerial drone photograph (Figure 2), scaled
  against the known width of HWY 433. Gives an approximate plan extent from a
  primary source.
- The Mississippi Emergency Management Agency, credited for the drone imagery,
  may hold unpublished site survey data.
- The NTSB was notified (appendix B) but no NTSB investigation is referenced.
- Peer-reviewed reconstructions of Satartia have been published since 2022 and
  may have derived crater geometry independently. Not yet searched.
