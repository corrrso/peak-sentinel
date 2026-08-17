"""Tests for the friction-limited blowdown model.

The reference points here are textbook compressible pipe flow, not
Satartia. Satartia was dense phase at 96.5 barg, which this gas-phase
model deliberately refuses to run, so it can only serve as an
order-of-magnitude plausibility check.
"""
import math

import pytest

from scripts.rupture_lib.blowdown import (
    choked_mass_flux,
    friction_limited_flux,
    blowdown_series_friction,
)

P = 35e5 + 101325.0
T = 283.15
BORE = 0.864
SEG = 16000.0


def test_short_pipe_is_never_throttled_below_the_isothermal_limit():
    """A short pipe must not be treated as a strong restriction.

    The isothermal pipe relation and the isentropic orifice are separate
    physical limits and do not coincide as length goes to zero: with no
    friction term left, the isothermal relation still retains the
    2 ln(p1/p2) acceleration term and returns about half the orifice
    flux. What matters is that the result is bounded by the orifice flux
    and stays the same order as it, so a short flow path does not
    manufacture a restriction that is not there.
    """
    free = choked_mass_flux(P, T)
    short = friction_limited_flux(P, T, BORE, length_m=1.0)
    assert short <= free
    assert short > 0.4 * free


def test_long_pipe_throttles_flow_by_about_ten():
    """8 km of 864 mm bore should deliver roughly a tenth of orifice flow.

    Hand calculation with the isothermal compressible relation gives
    760 to 1070 kg/s depending on friction factor, against 13,774
    kg/m2/s free-orifice flux, i.e. about 10,000 kg/s over the bore.
    """
    area = math.pi / 4 * BORE**2
    q = friction_limited_flux(P, T, BORE, length_m=8000.0) * area
    assert 600.0 < q < 1400.0


def test_flux_falls_monotonically_with_length():
    fluxes = [friction_limited_flux(P, T, BORE, length_m=L)
              for L in (10.0, 100.0, 1000.0, 8000.0, 16000.0)]
    assert all(a > b for a, b in zip(fluxes, fluxes[1:]))


def test_rougher_pipe_delivers_less():
    smooth = friction_limited_flux(P, T, BORE, length_m=8000.0, roughness_m=1e-6)
    rough = friction_limited_flux(P, T, BORE, length_m=8000.0, roughness_m=1e-3)
    assert rough < smooth


def test_friction_series_conserves_mass():
    """Total released must equal what the rate history integrates to."""
    bins, meta = blowdown_series_friction(P, T, BORE, SEG, t_end_s=36000.0)
    integrated = sum(b.rate_kgs * (b.t_end - b.t_start) for b in bins)
    assert integrated == pytest.approx(meta["total_released_kg"], rel=1e-6)
    # and it cannot exceed what was in the pipe plus what was fed in
    available = meta["inventory_kg"] + 95.0 * 930.0
    assert meta["total_released_kg"] <= available * 1.001


def test_friction_series_empties_the_segment():
    """Given long enough, essentially all the inventory must come out."""
    bins, meta = blowdown_series_friction(P, T, BORE, SEG, t_end_s=86400.0)
    available = meta["inventory_kg"] + 95.0 * 930.0
    assert meta["total_released_kg"] / available > 0.95


def test_friction_release_is_slower_than_orifice_model():
    """The whole point: friction stretches the release.

    The orifice model empties a 16 km segment in about 7 minutes. With
    friction the same inventory must take substantially longer.
    """
    bins, meta = blowdown_series_friction(P, T, BORE, SEG, t_end_s=36000.0)
    assert meta["q_peak_kgs"] < 2000.0          # not the 10,014 orifice peak
    assert meta["t_95_s"] > 1800.0              # more than half an hour


def test_rate_never_increases():
    bins, _ = blowdown_series_friction(P, T, BORE, SEG, t_end_s=36000.0)
    rates = [b.rate_kgs for b in bins]
    assert all(a >= b - 1e-9 for a, b in zip(rates, rates[1:]))


def test_satartia_order_of_magnitude_plausibility():
    """A gas-phase line of similar scale should vent in hours, not minutes.

    This is not a validation against Satartia. Satartia was dense phase
    and this model refuses those conditions. It checks only that the
    friction model puts a comparable-length large-bore segment in the
    same order of magnitude as the one real release on record, rather
    than the two-orders-too-fast answer the orifice model gives.
    """
    bins, meta = blowdown_series_friction(P, T, BORE, SEG, t_end_s=86400.0)
    assert 600.0 < meta["t_95_s"] < 86400.0
