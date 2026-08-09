"""Writers for TWODEE-2.3 input files. Formats follow the user manual
tables 4 and 5 and the bundled example1."""
from pathlib import Path

import numpy as np


def write_grd(path, array, x0: float, y0: float, dx: float) -> None:
    arr = np.asarray(array, dtype=float)
    ny, nx = arr.shape
    with open(path, "w") as f:
        f.write("DSAA\n")
        f.write(f"{nx} {ny}\n")
        f.write(f"{x0:g} {x0 + (nx - 1) * dx:g}\n")
        f.write(f"{y0:g} {y0 + (ny - 1) * dx:g}\n")
        f.write(f"{arr.min():g} {arr.max():g}\n")
        for row in arr:  # row 0 is the southern edge, as GRD expects
            f.write(" ".join(f"{v:.4f}" for v in row) + "\n")


def read_grd(path):
    lines = Path(path).read_text().split("\n")
    nx, ny = (int(v) for v in lines[1].split())
    xmin, xmax = (float(v) for v in lines[2].split())
    ymin, _ = (float(v) for v in lines[3].split())
    values = " ".join(lines[5:]).split()
    arr = np.array(values, dtype=float).reshape(ny, nx)
    dx = (xmax - xmin) / (nx - 1)
    return arr, xmin, ymin, dx


def write_wind_uniform(path, u_ms, v_ms, t_ground_c, t_ref_c, duration_s,
                       pressure_hpa=1013.0) -> None:
    # Date must match the TIME block written by write_inp.
    with open(path, "w") as f:
        f.write("2026 1 15 6 0 CUP\n")
        f.write(
            f"0 {duration_s:g} {u_ms:g} {v_ms:g} "
            f"{t_ground_c:g} {t_ref_c:g} {pressure_hpa:g}\n"
        )


def write_source(path, x_bng, y_bng, bins, patch_m=20.0) -> None:
    with open(path, "w") as f:
        for b in bins:
            f.write(
                f"{x_bng:.1f} {y_bng:.1f} {b.rate_kgs:.4f} "
                f"{patch_m:.1f} {patch_m:.1f} KG_SEC {b.t_start:g} {b.t_end:g}\n"
            )


INP_TEMPLATE = """ VERSION
   VERSION = 2.3
   PROBLEM_NAME = {name}
   !
 TIME
   YEAR = 2026
   MONTH = 1
   DAY = 15
   HOUR = 6
   MINUTE = 0
   SIMULATION_INTERVAL_(SEC) = {sim_s}
   RESTART_RUN = NO
   !
 GRID
   UTM_ZONE  = 30U
   UTM_DATUM = OSGB_36
   X_ORIGIN_(UTM_M) = {x0}
   Y_ORIGIN_(UTM_M) = {y0}
   NX     = {nx}
   NY     = {ny}
   DX_(M) = {dx}
   DY_(M) = {dx}
   !
 PROPERTIES
   AMBIENT_GAS_DENSITY_20C_(KG/M3) = 1.204
   DENSE_GAS_DENSITY_20C_(KG/M3)   = 1.839
   AVERAGED_TEMPERATURE_(C)        = {gas_temp_c}
   DOSE_GAS_TOXIC_EXPONENT         = 8.0
   !
 METEO
   WIND_MODEL        = UNIFORM
   Z_REFERENCE_(M)   = 10.0
   X_STATION_(UTM_M) = {station_x}
   Y_STATION_(UTM_M) = {station_y}
   !
 FILES
   OUTPUT_DIRECTORY        = outfiles
   TOPOGRAPHY_FILE         = topography.grd
   TOPOGRAPHY_FILE_FORMAT  = GRD
   ROUGHNESS_FILE          = roughness.grd
   ROUGHNESS_FILE_FORMAT   = GRD
   RESTART_FILE            = restart.dat
   SOURCE_FILE             = source.dat
   WIND_FILE               = wind.dat
   TRACK_POINTS            = NO
   TRACK_POINTS_FILE       = points.pts
   TRACK_BOXES             = NO
   TRACK_BOXES_FILE        = boxes.dat
   !
 OUTPUT
   OUTPUT_INTERVAL_(SEC)  = {out_s}
   OUTPUT_GRD_FILE_FORMAT = no
   OUTPUT_NC_FILE_FORMAT  = yes
   OUTPUT_DOMAIN          = yes
   OUTPUT_Z0              = yes
   OUTPUT_SOURCE          = yes
   OUTPUT_METEO           = yes
   OUTPUT_VELOCITY        = yes
   OUTPUT_H               = yes
   OUTPUT_RHO             = yes
   OUTPUT_DOSE            = yes
   OUTPUT_CONCENTRATION   = yes
     HEIGHTS_(M)          = 1.5
     CONCENTRATION_BG     = 420.
   OUTPUT_Z_CRITICAL      = yes
     CRITICAL_C_(%)       = 4 7 10
   OUTPUT_IMPACT          = no
   !
 NUMERIC
   FRONT_FROUDE_NUMBER     = 1.0
   OPTIMAL_COURANT_NUMBER  = 0.25
   EDGE_ENTRAINMENT_COEFF  = 0.0
   DIFFUSION_COEFFICIENT   = 0.20
   SHAPE_PARAMETER         = 0.5
   ZETA_PARAMETER          = 0.0
   ALPHA_2                 = 0.7
   ALPHA_3                 = 1.3
   ALPHA_7                 = 0.45
   VON_KARMAN_CONSTANT     = 0.4
   BRITTER_B_CONSTANT      = 0.11
"""


def write_inp(path, cfg: dict) -> None:
    Path(path).write_text(INP_TEMPLATE.format(**cfg))
