# Feasibility of a 2D CO2 rupture dispersion simulation

**Status:** Feasibility confirmed, P0 items resolved, ready for implementation planning. No simulation code yet.

**Scope decisions (Aug 2026):**

- Gaseous phase only. Dense phase excluded from scope by campaign decision. One flag stays on record: SR 3.2.128 allows the separate Coastal AGI to MLWS pipelines (twin 42-inch) to switch to dense phase in later operational years.
- Simulation areas: **Greasby** and **Arrowe Park Hospital**, both on the Wirral and both roughly 100 m from the scoping corridor edge. The hospital domain is small, which makes it the development test case; Greasby is the first full residential scenario. Meols and Saughall Massie remain candidates for later runs.
- Dispersion model: **TWODEE-2.3** as published. It builds cleanly with gfortran and netCDF-Fortran (`libnetcdff-dev`, then `./configure` with `NETCDF_INC`/`NETCDF_LIB` from `nf-config`), and the bundled example (400x170 grid, 30 simulated minutes) runs in about 3 minutes of CPU and writes NetCDF output that our Python stack reads directly. Its input format takes a topography grid, a roughness grid, wind data, and a time-varying ground source, and supports the OSGB_36 datum, so our BNG LIDAR data plugs in without reprojection gymnastics. No reimplementation needed.

Extracted pipeline parameters with citations live in `data/manual/pipeline_parameters.json`.

**Verdict:** Feasible at screening level. A full 3D CFD study (FLACS, OpenFOAM) is out of reach for one developer without HPC resources, commercial licences, and consequence-modelling experience. A 2D shallow-layer dense-gas model over our existing LIDAR terrain, driven by a literature-anchored source term, is achievable with the skills and data already in this project. This class of model has peer-reviewed precedent for CO2 hazard mapping over real terrain (TWODEE-2, used by INGV for volcanic CO2 dispersion, descended from the UK Health and Safety Laboratory's TWODEE model validated against the Thorney Island dense-gas trials).

The result would be an indicative hazard footprint with quantified sensitivity ranges, suitable for illustrating risk in consultation responses. It would not be a quantified risk assessment of the kind HSE or the applicant would produce, and we should never present it as one. Credibility depends on modelling what is actually proposed, stating assumptions plainly, and benchmarking against published results.

## A correction to the framing first

All three papers we started from (Gexcon EFFECTS tutorial, the Leeds GHGT-12 COOLTRANS paper, the 2024 full-scale burst test paper) model **dense-phase** CO2 at 100–150 bar. Peak Cluster states publicly that its onshore pipeline would operate in the **gaseous phase**, at "between half and a quarter of the pressure" of the Denbury dense-phase line that ruptured at Satartia. Denbury ran at roughly 90–100+ bar, so the implied operating range is around 25–50 bar.

This matters in both directions:

- A gaseous-phase source term is simpler to model. No flashing, no solid CO2 bank, no two-phase pipe flow. A transient gas blowdown of a long pipe is standard engineering that we can implement and validate.
- A gas-phase pipe still holds a large inventory. A 36-inch pipe (914 mm OD, ~864 mm ID at 25 mm wall) at 30–40 bar holds roughly 35–60 kg of CO2 per metre. With block valves at ~16 km spacing, a mid-segment rupture releases on the order of 500–1000 tonnes from the isolated segment alone, more before valves close. Cold CO2 from Joule-Thomson expansion is well over 1.5x denser than air, so it still slumps, follows terrain, and pools in the sinks we have already mapped.

Modelling the gaseous phase as the base case is the honest approach and also removes the hardest physics. The Scoping Report has now been checked (EN0710001-000013, January 2026): paragraph 3.2.67 confirms gas phase for the 195 km onshore pipeline, and no operating pressure is published anywhere in it. The only public pressure statement remains the informal "half to a quarter of Denbury" comparison, so pressure is carried as an assumption range (20 to 45 barg, base case 35) in `pipeline_parameters.json`. The absence of a published operating pressure at scoping stage is itself worth raising in consultation responses.

## The physics chain

Every credible study, including the three papers above, splits the problem into three stages. We adopt the same structure.

**Stage 1, source term.** Transient mass flow out of the ruptured pipe. For gas phase: choked orifice flow fed by pipe decompression with wall friction (Fanno flow), solvable in Python with real-gas CO2 properties from CoolProp. Full-bore rupture is double-ended. Outputs: mass flow rate and temperature versus time, total released mass. Validation targets: published blowdown curves and the outflow tables in the Gexcon article and GHGT-12 paper (after adjusting for phase).

**Stage 2, crater and near field.** The buried pipe rupture forms a crater that destroys the jet's horizontal momentum and turns the release into a cold, slow, vertically-vented plume that collapses back to the ground (the COOLTRANS experiments and simulations show crater exit velocities of tens of m/s at ~189 K for dense phase). We do not simulate this stage. We take crater-exit behaviour from the literature and represent the release as a low-momentum ground-level area source with the Stage 1 mass flow, a conservative and defensible simplification for far-field dispersion.

**Stage 3, far-field dispersion.** This is the 2D model. Shallow-layer (depth-averaged) equations for a dense gas layer flowing over the DEM under gravity, wind stress, and air entrainment. **Decided: TWODEE-2.3 as published** (Fortran 90, GPL, maintained by INGV). The build trial succeeded (see scope decisions above), which removes the main argument for a Python reimplementation. Our pipeline's job reduces to writing TWODEE input files (topography and roughness grids, wind data, time-varying source from Stage 1) and post-processing its NetCDF output into GeoJSON contours.

Cross-check: the Britter-McQuaid dense-gas workbook correlations, which give order-of-magnitude hazard distances on flat terrain from the source strength alone. If our model disagrees wildly with Britter-McQuaid on flat ground, something is wrong.

**Outputs per scenario:** time-evolving CO2 concentration at breathing height, arrival time of key concentration thresholds, maximum-extent contours, and accumulated toxic dose. Thresholds: 4% (NIOSH IDLH), 7% (impairment within minutes), 10%+ (loss of consciousness, potentially fatal), plus HSE's dangerous toxic load values for CO2 (SLOT 1.5e40 ppm^8.min, SLOD 1.5e41 ppm^8.min) for dose contours.

## What we already have

- Corridor polygon and centerline, official route sections, AGI positions with attributes, estimated BVS positions (`data/manual/`, `data/processed/`). These define rupture locations and segment inventories.
- 1m LIDAR DTM for SJ18–SJ57, covering the Wirral through east Cheshire, plus working rasterio merge/downsample code (`scripts/02_dem_sinks.py`).
- Topographic sink analysis, which independently identifies where a dispersion model should show pooling. Good internal consistency check.
- Schools, postcode centroids, and the postcode index for receptor overlays.
- A frontend that already renders map layers and per-postcode risk cards, ready to display scenario footprints.

## What we need to gather

### P0, blocking (all resolved)

1. **Pipeline engineering parameters. Done.** Extracted from Scoping Report Volume 1 (EN0710001-000013) and consultation material into `data/manual/pipeline_parameters.json` with a citation per value. Key findings: gas phase confirmed (SR 3.2.67); 195 km onshore; up to 36-inch diameter and 25 mm wall (consultation material, not the SR); burial 1.2 m minimum; **no operating pressure, valve spacing, or CO2 specification published anywhere**, so those are recorded as explicit assumptions (35 barg base case in a 20-45 range, 16 km spacing, 900 s + 30 s closure) and must appear in every sensitivity table.
2. **DEM coverage. Deferred, not blocking.** Both chosen simulation areas (Greasby, Arrowe Park Hospital) sit inside existing SJ LIDAR coverage. Peak District SK tiles (EA National LIDAR Programme via the Defra Survey Data Downloader, OS Terrain 50 fallback) are only needed when eastern scenarios are added.
3. **Model build trial. Done.** TWODEE-2.3 (DIGITAL.CSIC, doi:10.20350/digitalCSIC/13877) compiles with gfortran and netCDF-Fortran and runs its bundled example correctly. See scope decisions at the top.

### P1, needed before production runs

4. **Meteorology.** Hourly wind and stability data for stations near the corridor: Crosby and Hawarden for the Wirral end, Rostherne and Buxton for the east. Source: CEDA MIDAS Open (free registration) or NOAA ISD (no registration). Derive a wind rose and Pasquill stability class frequencies. The design cases for dense gas are low-wind stable conditions (F2) and neutral (D5), matching the Gexcon comparison of blanket versus jet mode.
5. **Toxicological basis.** One documented page citing HSE SLOT/SLOD for CO2, NIOSH IDLH, and the physiological concentration bands, with primary sources. This underpins every published contour and will be the first thing a critical reader checks.
6. **Validation materials.** The PHMSA failure investigation report for Satartia 2020 (public), including released volume and impact extent, plus USGS terrain for the site. Satartia was dense phase, so it validates the dispersion stage rather than our gas-phase source term. The 2024 full-scale burst test paper (jlp.2024.105489) provides measured concentration versus distance for direct comparison.

### P2, improves the product

7. ONS Census 2021 output-area population centroids, to state how many people live inside each scenario contour.
8. Land cover roughness (UKCEH Land Cover Map or CORINE, both free) for spatially varying surface roughness instead of a single constant.
9. Any Peak Cluster or MNZ technical annex on valve philosophy, leak detection response times, and compressor station conditions at the Coastal AGI, where the offshore side may run at higher pressure.

## Scenario matrix

Keep the production matrix small and justified.

- **Test case: Arrowe Park Hospital.** Corridor passes ~130 m from the hospital (nearest corridor point 53.3653, -3.1057). A compact domain of roughly 4 x 4 km at 10 m resolution keeps run times in minutes during development, and a hospital is the clearest possible example of a population that cannot self-evacuate. Every pipeline change gets validated here first.
- **First full scenario: Greasby.** Corridor passes ~110 m from the settlement edge (nearest corridor point 53.3719, -3.1303). Residential area with schools already in our data. Domain roughly 8 x 8 km to capture drainage toward surrounding low ground.
- **Later locations:** Meols (300 m from the corridor, next to the Coastal AGI zones and the surveyed Hoylake compressor sites), Saughall Massie, the Leasowe landfall segment, and one Peak District location once SK DEM coverage exists.
- **Failure modes (2):** full-bore rupture (double-ended) and a 50 mm-equivalent puncture. Same split the Gexcon tutorial uses.
- **Weather (2–3):** F2 stable low wind, D5 neutral, and the prevailing south-westerly at typical speed.
- **Sensitivity (documented separately):** operating pressure at 20 and 45 barg, valve spacing and closure time varied, and DEM resolution halved, each to show which assumptions move the answer. Dense phase is out of scope by campaign decision.

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
- `scripts/11_rupture_dispersion.py` writes TWODEE input files per scenario (DEM and roughness grids, wind, source), invokes the TWODEE binary, and converts its NetCDF output into concentration contour GeoJSON and arrival-time rasters in `data/processed/rupture_scenarios/`.
- Frontend gains a scenario picker and an animated cloud layer; the postcode risk card gains "worst-case scenario reaching this postcode" with arrival time.

P0 items are resolved, so a full TDD implementation plan (per `docs/superpowers/plans/` conventions) is the next step. The remaining pre-implementation gathering is P1: meteorology, the toxicological reference page, and validation materials.

## Resolved questions

1. **Pipeline parameters:** extracted from the published Scoping Report; see `data/manual/pipeline_parameters.json`. Operating pressure is not published and is carried as an assumption range.
2. **Dense phase:** excluded from scope by campaign decision. The SR 3.2.128 flag (Coastal AGI to MLWS lines could go dense phase in later years) stays on record for future consultation responses.
3. **Locations:** Arrowe Park Hospital (test case) and Greasby (first full scenario), per campaign direction.
