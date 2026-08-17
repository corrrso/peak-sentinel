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
from math import exp, log, log10, pi, sqrt

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


# Commercial steel, the roughness normally assumed for transmission pipe.
STEEL_ROUGHNESS_M = 4.5e-5


def _colebrook_f(reynolds: float, rel_roughness: float) -> float:
    """Darcy friction factor from the Colebrook-White correlation.

    Solved by fixed-point iteration, which converges in a handful of
    passes for pipe-flow Reynolds numbers.
    """
    if reynolds < 2300.0:
        return 64.0 / max(reynolds, 1e-6)
    f = 0.02
    for _ in range(60):
        rhs = -2.0 * log10(rel_roughness / 3.7 + 2.51 / (reynolds * sqrt(f)))
        f_new = 1.0 / (rhs * rhs)
        if abs(f_new - f) < 1e-12:
            return f_new
        f = f_new
    return f


def friction_limited_flux(
    p_pa: float,
    t_k: float,
    bore_m: float,
    length_m: float,
    roughness_m: float = STEEL_ROUGHNESS_M,
    p_exit_pa: float = ATM_PA,
) -> float:
    """Mass flux (kg/m2/s) a length of pipe can actually deliver.

    Isothermal compressible pipe flow with a sonic exit, the standard
    screening treatment (Crane TP-410; Perry 6-22). For the pipe
    resistance term,

        G^2 = rho1 * (p1^2 - p2^2) / (p1 * (f L/D + 2 ln(p1/p2)))

    The result is capped at the free-orifice choked flux, because no
    length of pipe can deliver more than an unrestricted hole. That cap
    is what makes a very short pipe recover the orifice answer.

    Friction depends on flow rate through the Reynolds number, so the
    two are iterated to consistency.
    """
    free = choked_mass_flux(p_pa, t_k)
    if length_m <= 0.0:
        return free

    rho = co2_density(p_pa, t_k)
    mu = PropsSI("V", "P", p_pa, "T", t_k, "CO2")
    p2 = min(max(p_exit_pa, 1.0), p_pa * 0.999)

    g = free  # start from the orifice value and relax downward
    for _ in range(100):
        reynolds = max(g * bore_m / mu, 1.0)
        f = _colebrook_f(reynolds, roughness_m / bore_m)
        denom = f * length_m / bore_m + 2.0 * log(p_pa / p2)
        g_new = sqrt(rho * (p_pa * p_pa - p2 * p2) / (p_pa * denom))
        g_new = min(g_new, free)
        if abs(g_new - g) < 1e-9 * max(g, 1.0):
            return g_new
        g = 0.5 * g + 0.5 * g_new  # damped, the coupling is stiff
    return g


def blowdown_series_friction(
    p_pa: float,
    t_k: float,
    bore_m: float,
    segment_length_m: float,
    cd: float = 0.62,
    feed_rate_kgs: float = 95.0,
    valve_closure_s: float = 930.0,
    bin_s: float = 30.0,
    t_end_s: float = 36000.0,
    roughness_m: float = STEEL_ROUGHNESS_M,
    hole_diameter_m: float | None = None,
):
    """Friction-limited blowdown, integrated forward in time.

    The orifice model in blowdown_series assumes an unlimited reservoir
    behind the hole and so releases the whole segment in minutes. A real
    segment feeds the break through kilometres of bore, and friction
    over that distance throttles the flow to roughly a tenth of the
    orifice rate.

    Quasi-steady treatment: at each step the current mean line pressure
    sets the deliverable flux, mass leaves, and the pressure follows from
    the remaining inventory at constant temperature. Gas travels from the
    segment midpoint to the break, so the flow path is half the segment
    for a full-bore rupture.

    This omits the sonic decompression wave that travels back along the
    line in the first seconds, and it holds temperature fixed rather
    than tracking Joule-Thomson cooling of the remaining inventory. Both
    matter most very early, when the orifice model is also least
    reliable.

    Returns the same (bins, meta) shape as blowdown_series, with meta
    additionally carrying t_95_s, the time to release 95% of the
    available mass.
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
    volume = bore_area * segment_length_m
    path_m = segment_length_m / 2.0

    if hole_diameter_m is None:
        mode = "fbr"
        exit_area = cd * 2.0 * bore_area
    else:
        mode = "puncture"
        exit_area = cd * (pi / 4.0) * hole_diameter_m * hole_diameter_m
    # The release is limited by whichever of the two restrictions binds:
    # the hole, or the pipe feeding it. These are compared as total mass
    # flow, since flux per unit area differs between bore and hole.
    pipe_flow_area = bore_area

    mass = inventory
    released = 0.0
    q_peak = 0.0
    bins: list[SourceBin] = []
    dt = min(bin_s, 5.0)  # integrate finer than the reporting bin

    t = 0.0
    while t < t_end_s:
        t_bin_end = min(t + bin_s, t_end_s)
        bin_mass = 0.0
        tt = t
        while tt < t_bin_end:
            step = min(dt, t_bin_end - tt)
            rho_now = mass / volume
            if rho_now <= 1e-6:
                break
            try:
                p_now = PropsSI("P", "D", rho_now, "T", t_k, "CO2")
            except ValueError:
                break
            if p_now <= ATM_PA * 1.01:
                break
            pipe_flux = friction_limited_flux(
                p_now, t_k, bore_m, path_m, roughness_m=roughness_m
            )
            # hole capacity at current pressure vs what the pipe can supply
            rate = min(
                choked_mass_flux(p_now, t_k) * exit_area,
                pipe_flux * pipe_flow_area,
            )
            feed = feed_rate_kgs if tt < valve_closure_s else 0.0
            out = min(rate * step, mass + feed * step)
            mass += feed * step - out
            bin_mass += out
            q_peak = max(q_peak, rate)
            tt += step
        if bin_mass <= 0.0:
            break
        rate_avg = bin_mass / (t_bin_end - t)
        if rate_avg >= 0.5:
            bins.append(SourceBin(t, t_bin_end, rate_avg))
            released += bin_mass
        t = t_bin_end

    available = inventory + feed_rate_kgs * valve_closure_s
    cum = 0.0
    t_95 = float("nan")
    for b in bins:
        cum += b.rate_kgs * (b.t_end - b.t_start)
        if cum >= 0.95 * available:
            t_95 = b.t_end
            break

    meta = {
        "mode": mode,
        "model": "friction_limited",
        "q_peak_kgs": q_peak,
        "inventory_kg": inventory,
        "total_released_kg": released,
        "release_temp_k": release_temperature_k(p_pa, t_k),
        "t_95_s": t_95,
        "flow_path_m": path_m,
        "roughness_m": roughness_m,
    }
    return bins, meta


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
    tau_scale: float = 1.0,
):
    """Transient release rate binned for the TWODEE source file.

    hole_diameter_m None means full-bore rupture: both cut ends vent
    (exit area = 2x bore area) and the upstream network feeds the break
    at the design flow rate until valve closure. A puncture is
    capacity-limited: constant peak rate until closure, exponential
    decay of the isolated inventory afterwards.

    tau_scale stretches the decay time constant. Friction along a 16 km
    segment is not modelled, and orifice-limited decay empties the line
    far faster than observed releases: Satartia vented for about four
    hours (PHMSA failure investigation, 2022). Raising tau_scale trades
    initial rate for duration at constant mass. Note that t_end_s must
    be long enough to capture the stretched tail, or the late mass is
    truncated rather than released.
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

    tau = (inventory / q_peak) * tau_scale

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
        "tau_scale": tau_scale,
        "inventory_kg": inventory,
        "total_released_kg": total,
        "release_temp_k": release_temperature_k(p_pa, t_k),
    }
    return bins, meta
