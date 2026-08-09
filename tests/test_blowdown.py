import pytest

from scripts.rupture_lib.blowdown import (
    GasPhaseError,
    blowdown_series,
    choked_mass_flux,
    co2_density,
    release_temperature_k,
    saturation_pressure_barg,
    segment_inventory_kg,
)

P = 35e5 + 101325.0  # 35 barg absolute
T = 283.15
BORE = 0.914 - 2 * 0.025
SEG = 16000.0


def test_density_reference():
    assert co2_density(P, T) == pytest.approx(91.8, rel=0.02)


def test_choked_flux_reference():
    assert choked_mass_flux(P, T) == pytest.approx(13774.0, rel=0.03)


def test_inventory_reference():
    assert segment_inventory_kg(P, T, BORE, SEG) == pytest.approx(861_000, rel=0.02)


def test_release_temperature_cold_but_above_sublimation():
    t_exit = release_temperature_k(P, T)
    assert t_exit == pytest.approx(273.15 - 49.4, abs=2.0)
    assert t_exit >= 194.65


def test_release_temperature_clamps_at_sublimation():
    """Deep expansion must clamp, not raise.

    Above about 37 barg at 10 C the isenthalpic exit state falls below
    the triple point, where CoolProp has no single-phase solution. The
    documented sublimation clamp has to cover that case.
    """
    assert release_temperature_k(40e5 + 101325.0, T) == pytest.approx(194.65)


def test_saturation_pressure_at_line_temperature():
    # CO2 saturates near 44 barg at 10 C, which bounds gas-phase operation
    assert saturation_pressure_barg(T) == pytest.approx(44.0, abs=0.5)


def test_liquid_phase_pressure_is_rejected():
    """45 barg at 10 C is liquid CO2, outside this model's scope.

    Silently returning a liquid density would inflate the inventory by
    roughly 9x and produce a scenario the gas-phase source term cannot
    represent.
    """
    with pytest.raises(GasPhaseError):
        blowdown_series(45e5 + 101325.0, T, BORE, SEG)


def test_fbr_mass_conservation():
    bins, meta = blowdown_series(P, T, BORE, SEG)
    released = sum(b.rate_kgs * (b.t_end - b.t_start) for b in bins)
    # inventory not fully vented within t_end plus valve feed until closure
    import math
    expected = meta["inventory_kg"] * (1 - math.exp(-3600.0 / meta["tau_s"])) + 95.0 * 930.0
    assert released == pytest.approx(expected, rel=1e-3)
    assert released == pytest.approx(meta["total_released_kg"], rel=1e-6)


def test_fbr_peak_and_decay():
    bins, meta = blowdown_series(P, T, BORE, SEG)
    assert meta["q_peak_kgs"] == pytest.approx(10_014, rel=0.03)
    assert meta["tau_s"] == pytest.approx(86.0, rel=0.05)
    rates = [b.rate_kgs for b in bins]
    assert all(a >= b for a, b in zip(rates, rates[1:]))  # never increases


def test_puncture_slow_and_steady():
    bins, meta = blowdown_series(P, T, BORE, SEG, hole_diameter_m=0.05)
    assert meta["mode"] == "puncture"
    assert meta["q_peak_kgs"] == pytest.approx(16.8, rel=0.1)
    # constant until valve closure at 930 s
    early = [b.rate_kgs for b in bins if b.t_end <= 900]
    assert max(early) == pytest.approx(min(early), rel=1e-6)
