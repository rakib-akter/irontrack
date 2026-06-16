import pytest

from stratum_analytics import (
    rir_from_rpe,
    rpe_from_rir,
    percent_1rm_from_rpe,
    estimate_1rm_from_rpe,
)


def test_rir_rpe_inverse():
    assert rir_from_rpe(8) == 2
    assert rpe_from_rir(2) == 8
    assert rpe_from_rir(rir_from_rpe(7.5)) == 7.5


def test_rpe10_single_is_100pct():
    assert percent_1rm_from_rpe(10, 1) == 100.0


def test_chart_lookup_known_values():
    assert percent_1rm_from_rpe(8, 5) == pytest.approx(81.1)
    assert percent_1rm_from_rpe(9, 3) == pytest.approx(89.2)


def test_rpe_snaps_to_nearest_half():
    # 8.4 snaps to 8.5
    assert percent_1rm_from_rpe(8.4, 5) == percent_1rm_from_rpe(8.5, 5)


def test_reps_clamped_to_chart_range():
    assert percent_1rm_from_rpe(10, 20) == percent_1rm_from_rpe(10, 12)


def test_estimate_1rm_from_rpe():
    # 5 reps @ RPE 8 -> 81.1% of 1RM, so 1RM = w / 0.811
    est = estimate_1rm_from_rpe(225, 5, 8)
    assert est == pytest.approx(225 / 0.811, rel=1e-6)
    # An RPE-8 set should imply a higher 1RM than the weight itself.
    assert est > 225
