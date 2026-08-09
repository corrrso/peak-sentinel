"""Gas-phase pipeline blowdown source terms.

Screening-level model: full-bore ruptures follow an exponential decay
whose peak is choked orifice flow at line conditions and whose time
constant conserves segment inventory exactly (effective release rate
approach in the spirit of Jo & Ahn 2003, J. Hazard. Mater. A97).
Punctures are capacity-limited and near constant until valve closure.
Friction-limited late-time flow is not modelled; the sensitivity study
varies tau instead.
"""
from dataclasses import dataclass
from math import exp, pi, sqrt

from CoolProp.CoolProp import PropsSI

R_UNIVERSAL = 8.314462618
M_CO2 = 0.0440098
R_CO2 = R_UNIVERSAL / M_CO2
CO2_SUBLIMATION_K = 194.65
ATM_PA = 101325.0


class GasPhaseError(ValueError):
    """Raised when line conditions are not gas phase.

    The Peak Cluster onshore pipeline is stated to run in gas phase
    (Scoping Report 3.2.67), and this model assumes that throughout.
    CO2 saturates near 44 barg at 10 C, so the upper end of the
    published pressure range is liquid rather than gas.
    """


def saturation_pressure_barg(t_k: float) -> float:
    """Vapour pressure at t_k, in barg. Gas phase requires staying below it."""
    return (PropsSI("P", "T", t_k, "Q", 1, "CO2") - ATM_PA) / 1e5


def co2_density(p_pa: float, t_k: float) -> float:
    return PropsSI("D", "P", p_pa, "T", t_k, "CO2")


def choked_mass_flux(p_pa: float, t_k: float) -> float:
    """Choked mass flux (kg/m2/s) with real-gas gamma and Z.

    Ideal-gas critical-flow formula evaluated with local properties.
    Near the saturation dome gamma is large (about 1.9 at 35 barg,
    10 C) which this captures; full non-ideal nozzle integration is
    beyond screening scope.
    """
    gamma = PropsSI("CPMASS", "P", p_pa, "T", t_k, "CO2") / PropsSI(
        "CVMASS", "P", p_pa, "T", t_k, "CO2"
    )
    z = p_pa / (co2_density(p_pa, t_k) * R_CO2 * t_k)
    return (
        p_pa
        * sqrt(gamma / (z * R_CO2 * t_k))
        * (2.0 / (gamma + 1.0)) ** ((gamma + 1.0) / (2.0 * (gamma - 1.0)))
    )


def release_temperature_k(p_pa: float, t_k: float) -> float:
    """Isenthalpic expansion to 1 atm, clamped at the sublimation point.

    Above roughly 37 barg at line temperature the exit enthalpy falls
    below anything CoolProp can solve at 1 atm, because the real fluid
    would be depositing solid CO2. That is the clamp case, so treat the
    solver failure as reaching the sublimation point.
    """
    h = PropsSI("HMASS", "P", p_pa, "T", t_k, "CO2")
    try:
        t_exit = PropsSI("T", "P", ATM_PA, "HMASS", h, "CO2")
    except ValueError:
        return CO2_SUBLIMATION_K
    return max(t_exit, CO2_SUBLIMATION_K)


def segment_inventory_kg(p_pa: float, t_k: float, bore_m: float, length_m: float) -> float:
    return co2_density(p_pa, t_k) * (pi / 4.0) * bore_m * bore_m * length_m


@dataclass
class SourceBin:
    t_start: float
    t_end: float
    rate_kgs: float


def blowdown_series(
    p_pa: float,
    t_k: float,
    bore_m: float,
    segment_length_m: float,
    hole_diameter_m: float | None = None,
    cd: float = 0.62,
    feed_rate_kgs: float = 95.0,
    valve_closure_s: float = 930.0,
    bin_s: float = 30.0,
    t_end_s: float = 3600.0,
):
    """Transient release rate binned for the TWODEE source file.

    hole_diameter_m None means full-bore rupture: both cut ends vent
    (exit area = 2x bore area) and the upstream network feeds the break
    at the design flow rate until valve closure. A puncture is
    capacity-limited: constant peak rate until closure, exponential
    decay of the isolated inventory afterwards.
    """
    p_sat = PropsSI("P", "T", t_k, "Q", 1, "CO2")
    if p_pa >= p_sat:
        raise GasPhaseError(
            f"{(p_pa - ATM_PA) / 1e5:.1f} barg at {t_k - 273.15:.1f} C is at or above "
            f"the CO2 saturation pressure of {(p_sat - ATM_PA) / 1e5:.1f} barg, so the "
            "contents would be liquid. This gas-phase model does not apply."
        )

    bore_area = (pi / 4.0) * bore_m * bore_m
    inventory = segment_inventory_kg(p_pa, t_k, bore_m, segment_length_m)
    flux = choked_mass_flux(p_pa, t_k)

    if hole_diameter_m is None:
        mode = "fbr"
        q_peak = cd * 2.0 * bore_area * flux
    else:
        mode = "puncture"
        q_peak = cd * (pi / 4.0) * hole_diameter_m * hole_diameter_m * flux

    tau = inventory / q_peak

    def mass_between(t1: float, t2: float) -> float:
        if mode == "fbr":
            decay = inventory * (exp(-t1 / tau) - exp(-t2 / tau))
            feed = feed_rate_kgs * max(0.0, min(t2, valve_closure_s) - min(t1, valve_closure_s))
            return decay + feed
        # puncture: constant until closure, decaying afterwards
        flat = q_peak * max(0.0, min(t2, valve_closure_s) - min(t1, valve_closure_s))
        d1 = max(t1, valve_closure_s) - valve_closure_s
        d2 = max(t2, valve_closure_s) - valve_closure_s
        decay = inventory * (exp(-d1 / tau) - exp(-d2 / tau)) if t2 > valve_closure_s else 0.0
        return flat + decay

    bins: list[SourceBin] = []
    total = 0.0
    t = 0.0
    while t < t_end_s:
        t2 = min(t + bin_s, t_end_s)
        mass = mass_between(t, t2)
        rate = mass / (t2 - t)
        if rate >= 0.5:
            bins.append(SourceBin(t, t2, rate))
            total += mass
        t = t2

    meta = {
        "mode": mode,
        "q_peak_kgs": q_peak,
        "tau_s": tau,
        "inventory_kg": inventory,
        "total_released_kg": total,
        "release_temp_k": release_temperature_k(p_pa, t_k),
    }
    return bins, meta
