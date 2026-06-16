import pytest

from stratum_analytics import (
    rolling_average,
    ewma,
    linear_slope,
    progression_rate_per_week,
    detect_plateau,
    projected_weeks_to_target,
    acute_chronic_ratio,
    session_volume,
    total_volume,
)


# --- volume ---
def test_session_and_total_volume():
    assert session_volume(225, 5, 3) == 3375
    assert total_volume([(225, 5, 3), (135, 10, 1)]) == 3375 + 1350


# --- trend ---
def test_rolling_average_trailing():
    assert rolling_average([2, 4, 6], 2) == [2.0, 3.0, 5.0]


def test_ewma_first_value_is_seed():
    out = ewma([10, 20], 0.5)
    assert out[0] == 10
    assert out[1] == pytest.approx(15.0)


def test_ewma_alpha_validation():
    with pytest.raises(ValueError):
        ewma([1, 2], 0)


def test_linear_slope_positive():
    assert linear_slope([0, 1, 2], [0, 2, 4]) == pytest.approx(2.0)


def test_linear_slope_undefined():
    assert linear_slope([1], [1]) is None
    assert linear_slope([1, 1], [2, 3]) is None  # no spread in x


# --- plateau / progression ---
def test_progression_rate_per_week():
    # +1 unit/day over 14 days -> 7 units/week
    series = [(0.0, 100.0), (14.0, 114.0)]
    assert progression_rate_per_week(series) == pytest.approx(7.0)


def test_detect_plateau_flat():
    series = [(0.0, 200.0), (10.0, 200.2), (20.0, 199.9), (28.0, 200.1)]
    res = detect_plateau(series)
    assert res.is_plateau is True
    assert res.reason == "flat-progression"


def test_detect_plateau_progressing():
    series = [(0.0, 200.0), (10.0, 205.0), (20.0, 210.0), (28.0, 216.0)]
    res = detect_plateau(series)
    assert res.is_plateau is False
    assert res.reason == "progressing"


def test_detect_plateau_insufficient():
    assert detect_plateau([(0.0, 100.0)]).reason == "insufficient-data"


def test_projected_weeks_to_target():
    assert projected_weeks_to_target(280, 315, 5) == pytest.approx(7.0)
    assert projected_weeks_to_target(320, 315, 5) == 0.0
    assert projected_weeks_to_target(280, 315, 0) is None
    assert projected_weeks_to_target(280, 315, None) is None


# --- fatigue ---
def test_acwr_spike():
    # 21 days at 100, then 7 days at 200 -> acute 200, chronic ~125 -> ratio 1.6
    daily = [100.0] * 21 + [200.0] * 7
    ratio = acute_chronic_ratio(daily)
    assert ratio == pytest.approx(200 / ((100 * 21 + 200 * 7) / 28))
    assert ratio > 1.3


def test_acwr_insufficient_history():
    assert acute_chronic_ratio([100.0] * 10) is None
