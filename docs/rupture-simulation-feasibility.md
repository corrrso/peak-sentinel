# Feasibility of a 2D CO2 rupture dispersion simulation

**Status:** Feasibility assessment and data-gathering plan. No code yet.

**Verdict:** Feasible at screening level. A full 3D CFD study (FLACS, OpenFOAM) is out of reach for one developer without HPC resources, commercial licences, and consequence-modelling experience. A 2D shallow-layer dense-gas model over our existing LIDAR terrain, driven by a literature-anchored source term, is achievable with the skills and data already in this project. This class of model has peer-reviewed precedent for CO2 hazard mapping over real terrain (TWODEE-2, used by INGV for volcanic CO2 dispersion, descended from the UK Health and Safety Laboratory's TWODEE model validated against the Thorney Island dense-gas trials).

The result would be an indicative hazard footprint with quantified sensitivity ranges, suitable for illustrating risk in consultation responses. It would not be a quantified risk assessment of the kind HSE or the applicant would produce, and we should never present it as one. Credibility depends on modelling what is actually proposed, stating assumptions plainly, and benchmarking against published results.

## A correction to the framing first

All three papers we started from (Gexcon EFFECTS tutorial, the Leeds GHGT-12 COOLTRANS paper, the 2024 full-scale burst test paper) model **dense-phase** CO2 at 100–150 bar. Peak Cluster states publicly that its onshore pipeline would operate in the **gaseous phase**, at "between half and a quarter of the pressure" of the Denbury dense-phase line that ruptured at Satartia. Denbury ran at roughly 90–100+ bar, so the implied operating range is around 25–50 bar.

This matters in both directions:

- A gaseous-phase source term is simpler to model. No flashing, no solid CO2 bank, no two-phase pipe flow. A transient gas blowdown of a long pipe is standard engineering that we can implement and validate.
- A gas-phase pipe still holds a large inventory. A 36-inch pipe (914 mm OD, ~864 mm ID at 25 mm wall) at 30–40 bar holds roughly 35–60 kg of CO2 per metre. With block valves at ~16 km spacing, a mid-segment rupture releases on the order of 500–1000 tonnes from the isolated segment alone, more before valves close. Cold CO2 from Joule-Thomson expansion is well over 1.5x denser than air, so it still slumps, follows terrain, and pools in the sinks we have already mapped.

Modelling the gaseous phase as the base case is the honest approach and also removes the hardest physics. Dense-phase behaviour becomes a documented sensitivity case (relevant because the project's design parameters are not yet fixed and the DCO envelope may permit higher pressures; the scoping documents need checking on exactly this point).

## The physics chain

Every credible study, including the three papers above, splits the problem into three stages. We adopt the same structure.

**Stage 1, source term.** Transient mass flow out of the ruptured pipe. For gas phase: choked orifice flow fed by pipe decompression with wall friction (Fanno flow), solvable in Python with real-gas CO2 properties from CoolProp. Full-bore rupture is double-ended. Outputs: mass flow rate and temperature versus time, total released mass. Validation targets: published blowdown curves and the outflow tables in the Gexcon article and GHGT-12 paper (after adjusting for phase).

**Stage 2, crater and near field.** The buried pipe rupture forms a crater that destroys the jet's horizontal momentum and turns the release into a cold, slow, vertically-vented plume that collapses back to the ground (the COOLTRANS experiments and simulations show crater exit velocities of tens of m/s at ~189 K for dense phase). We do not simulate this stage. We take crater-exit behaviour from the literature and represent the release as a low-momentum ground-level area source with the Stage 1 mass flow, a conservative and defensible simplification for far-field dispersion.

**Stage 3, far-field dispersion.** This is the 2D model. Shallow-layer (depth-averaged) equations for a dense gas layer flowing over the DEM under gravity, wind stress, and air entrainment. Two implementation options, decided in Phase 2:

1. **TWODEE-2.3** as published (Fortran 90, GPL, maintained by INGV). Proven, citable, validated. Cost: integrating a Fortran build into our pipeline and converting our data into its input formats.
2. **A Python reimplementation** of the same equations (the Folch, Costa & Hankin 2009 paper in Computers & Geosciences documents them fully). Fits our NumPy/rasterio pipeline naturally. Cost: we own the burden of proving it reproduces TWODEE-2 results, so a benchmark against the original on at least one published case is mandatory.

Cross-check for either option: the Britter-McQuaid dense-gas workbook correlations, which give order-of-magnitude hazard distances on flat terrain from the source strength alone. If our model disagrees wildly with Britter-McQuaid on flat ground, something is wrong.

**Outputs per scenario:** time-evolving CO2 concentration at breathing height, arrival time of key concentration thresholds, maximum-extent contours, and accumulated toxic dose. Thresholds: 4% (NIOSH IDLH), 7% (impairment within minutes), 10%+ (loss of consciousness, potentially fatal), plus HSE's dangerous toxic load values for CO2 (SLOT 1.5e40 ppm^8.min, SLOD 1.5e41 ppm^8.min) for dose contours.

## What we already have

- Corridor polygon and centerline, official route sections, AGI positions with attributes, estimated BVS positions (`data/manual/`, `data/processed/`). These define rupture locations and segment inventories.
- 1m LIDAR DTM for SJ18–SJ57, covering the Wirral through east Cheshire, plus working rasterio merge/downsample code (`scripts/02_dem_sinks.py`).
- Topographic sink analysis, which independently identifies where a dispersion model should show pooling. Good internal consistency check.
- Schools, postcode centroids, and the postcode index for receptor overlays.
- A frontend that already renders map layers and per-postcode risk cards, ready to display scenario footprints.

## What we need to gather

### P0, blocking

1. **Pipeline engineering parameters** from the Scoping Report (section 3.2) and any consultation Q&A. The user has the PDFs in `docs/originalPdfs/`. Extract and record in a `data/manual/pipeline_parameters.json` with a source citation per value:
   - operating pressure range and MAOP, and explicit confirmation of gaseous phase across the whole route (or where compression stages change conditions)
   - diameter and wall thickness per section (feeder lines from Cauldon/Hope/Tunstead are likely narrower than the trunk line)
   - block valve spacing and assumed closure time (if not stated, use the GHGT-12 assumption of 900 s detection plus 30 s closure and say so)
   - burial depth (public factsheet says 1.2 m minimum, 0.5 m in shallow rock)
   - CO2 composition and impurities from cement/lime capture (affects density and toxicity margins)
   - design throughput in Mt/yr per section
2. **DEM coverage for the Peak District.** EA National LIDAR Programme 1m DTM tiles for the SK grid squares along the eastern corridor (Defra Survey Data Downloader, same source as existing tiles). Fallback where LIDAR is missing: OS Terrain 50, open data. The shallow-layer model runs at 10–25 m resolution, so Terrain 50 is acceptable away from the Wirral focus area.
3. **Model decision inputs.** Download TWODEE-2.3 source and manual (DIGITAL.CSIC, doi:10.20350/digitalCSIC/13877; manual at datasim.ov.ingv.it). Attempt a build and a bundled test case. The outcome decides option 1 versus option 2 above.

### P1, needed before production runs

4. **Meteorology.** Hourly wind and stability data for stations near the corridor: Crosby and Hawarden for the Wirral end, Rostherne and Buxton for the east. Source: CEDA MIDAS Open (free registration) or NOAA ISD (no registration). Derive a wind rose and Pasquill stability class frequencies. The design cases for dense gas are low-wind stable conditions (F2) and neutral (D5), matching the Gexcon comparison of blanket versus jet mode.
5. **Toxicological basis.** One documented page citing HSE SLOT/SLOD for CO2, NIOSH IDLH, and the physiological concentration bands, with primary sources. This underpins every published contour and will be the first thing a critical reader checks.
6. **Validation materials.** The PHMSA failure investigation report for Satartia 2020 (public), including released volume and impact extent, plus USGS terrain for the site. Satartia was dense phase, so it validates the dispersion stage rather than our gas-phase source term. The 2024 full-scale burst test paper (jlp.2024.105489) provides measured concentration versus distance for direct comparison.

### P2, improves the product

7. ONS Census 2021 output-area population centroids, to state how many people live inside each scenario contour.
8. Land cover roughness (UKCEH Land Cover Map or CORINE, both free) for spatially varying surface roughness instead of a single constant.
9. Any Peak Cluster or MNZ technical annex on valve philosophy, leak detection response times, and compressor station conditions at the Coastal AGI, where the offshore side may run at higher pressure.

## Scenario matrix

Keep the production matrix small and justified. Roughly 20–30 runs:

- **Rupture locations (5–8):** mid-segment points chosen where the corridor passes close to settlements or mapped sinks. On the Wirral specifically: the segment near the Coastal AGI options at Leasowe, and the populated corridor sections southward. Plus one Peak District location (e.g. near the North Feeder AGI) once DEM coverage exists.
- **Failure modes (2):** full-bore rupture (double-ended) and a 50 mm-equivalent puncture. Same split the Gexcon tutorial uses.
- **Weather (2–3):** F2 stable low wind, D5 neutral, and the prevailing south-westerly at typical speed.
- **Sensitivity (documented separately):** dense-phase operation at 100 bar using the GHGT-12 source term, valve closure time doubled, and DEM resolution halved, each to show which assumptions move the answer.

## Credibility plan

This will be scrutinised by the applicant's consultants, so:

- Publish the full methodology, all parameter values with citations, and the code. Reproducibility is the strongest defence.
- Benchmark the dispersion stage against at least one published case (Thorney Island trial data, a TWODEE-2 published case, or Satartia extent) and show the comparison.
- State limitations up front: no solid CO2 bank, no near-field jet structure, no buildings, depth-averaged concentrations, screening-level source term.
- Label outputs as indicative hazard footprints, never as predicted casualties.
- Seek one round of expert review before publishing. The Leeds group behind the COOLTRANS papers (Wareing, Fairweather) and the TWODEE authors (Costa, Folch, contacts published with the code) are plausible reviewers; community groups have had success with brief academic reviews of this kind.

## Implementation shape (for later planning)

Following the existing pipeline conventions:

- `scripts/10_rupture_source.py` reads `pipeline_parameters.json`, computes transient blowdown per failure mode, writes source-term time series to `data/processed/rupture_sources.json`.
- `scripts/11_rupture_dispersion.py` runs the shallow-layer model per scenario over the merged DEM, writes per-scenario concentration contour GeoJSON and arrival-time rasters to `data/processed/rupture_scenarios/`.
- Frontend gains a scenario picker and an animated cloud layer; the postcode risk card gains "worst-case scenario reaching this postcode" with arrival time.

A full TDD implementation plan (per `docs/superpowers/plans/` conventions) should be written once the P0 items above are resolved, because the model choice and the pipeline parameters change the task breakdown.

## Open questions for Action Against CCS

1. Which scoping report sections or annexes state operating pressure, phase, and valve spacing? Supplying those PDFs (or page references) unblocks P0 item 1 immediately.
2. Does the consultation material reserve the right to dense-phase operation in future, or is gaseous phase a binding design commitment? This decides whether dense phase is a sensitivity case or a co-equal scenario.
3. Is there a preferred set of rupture locations from the campaign's perspective (specific villages, schools, the Leasowe embankment) to prioritise in the scenario matrix?
