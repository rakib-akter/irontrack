"""Progression rate, plateau detection, and projected-PR timing.

A "series" is a list of (day_index, value) points where day_index is days since
an arbitrary epoch and value is typically a best estimated 1RM. Working in days
lets us express progression per week regardless of logging cadence.
"""

from __future__ import annotations

from dataclasses import dataclass

from .trend import linear_slope


def progression_rate_per_week(series: list[tuple[float, float]]) -> float | None:
    """Least-squares slope of value vs. time, expressed per 7 days. None if it
    can't be computed (need >= 2 points spread over time)."""
    if len(series) < 2:
        return None
    days = [p[0] for p in series]
    values = [p[1] for p in series]
    if max(days) - min(days) <= 0:
        return None
    per_day = linear_slope(days, values)
    if per_day is None:
        return None
    return per_day * 7


@dataclass
class PlateauResult:
    is_plateau: bool
    rate_per_week: float | None  # progression rate over the window
    reason: str


def detect_plateau(
    series: list[tuple[float, float]],
    window_days: float = 28,
    min_points: int = 3,
    flat_threshold_per_week: float = 0.5,
) -> PlateauResult:
    """Detect a plateau over the trailing `window_days`.

    A plateau = enough recent data whose best-value progression is essentially
    flat (|rate| below `flat_threshold_per_week`, in the value's unit per week).
    """
    if len(series) < min_points:
        return PlateauResult(False, None, "insufficient-data")

    latest_day = max(p[0] for p in series)
    recent = [p for p in series if p[0] >= latest_day - window_days]
    if len(recent) < min_points:
        return PlateauResult(False, None, "insufficient-recent-data")

    rate = progression_rate_per_week(recent)
    if rate is None:
        return PlateauResult(False, None, "insufficient-spread")

    if abs(rate) < flat_threshold_per_week:
        return PlateauResult(True, rate, "flat-progression")
    if rate < 0:
        return PlateauResult(False, rate, "regressing")
    return PlateauResult(False, rate, "progressing")


def projected_weeks_to_target(
    current: float, target: float, rate_per_week: float | None
) -> float | None:
    """Weeks until `current` reaches `target` at `rate_per_week`. None if the
    rate is missing or pointing the wrong way; 0 if already at/past target."""
    gap = target - current
    if gap <= 0:
        return 0.0
    if not rate_per_week or rate_per_week <= 0:
        return None
    return gap / rate_per_week
