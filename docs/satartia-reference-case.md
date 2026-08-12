# Satartia, Mississippi: the real-world reference case

**Source:** PHMSA Office of Pipeline Safety, Accident Investigation Division,
*Failure Investigation Report - Denbury Gulf Coast Pipelines, LLC - Pipeline
Rupture / Natural Force Damage*, 26 May 2022. Principal investigator Wesley
Mathews. Incident 22 February 2020, Satartia, Yazoo County, MS. WMS activity
ID 20-176125, milepost 6.6.

Retrieved from the Illinois Commerce Commission docket copy (P2023-0161,
filed as Sangamon County Exhibit 1.3), which carries a text layer. The PHMSA
site returns 403 to automated fetches and the North Dakota PSC copy
(case 22-0391) is a 47 page scan with no text layer.

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
| Venting after isolation | Continued "for several hours" |
| Cloud reach | About 1 mile (1.6 km) to Satartia, over a hill crest |
| Consequences | 200 evacuated, 45 sought hospital treatment, no fatalities |
| Cost | $3,947,009 |

PHMSA notes the reported release volume "likely exceeded this amount due to a
valve operation error", so 4,000 to 5,000 t is a floor.

**Crater width and plan area are not stated in the report body.** Only depth
is given. Do not infer a diameter from these figures.

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

## The finding that matters most for consultation

Denbury's own dispersion model "did not contemplate a release that could
affect the Village of Satartia." The operator underestimated the affected
area, and PHMSA cited it as a contributing factor. That is a direct precedent
for challenging Peak Cluster's hazard modelling, and it does not depend on any
number this project computes.

## Open question this does not answer

Crater plan dimensions, which is the input needed to size the TWODEE source
patch (see the source-term issue in `rupture-simulation-status.md`). Depth
alone does not constrain it. Possible routes: the 47 page PHMSA version with
figures, photogrammetry from the published aerial drone photograph, or the
DNV metallurgical report referenced as an appendix.
