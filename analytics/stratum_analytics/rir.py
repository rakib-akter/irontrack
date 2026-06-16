"""RPE / RIR and the RPE → %1RM chart (Tuchscherer / RTS style).

RPE (rate of perceived exertion, 1-10) and RIR (reps in reserve) are two views
of the same thing: RIR = 10 - RPE. The chart below maps (RPE, reps) to a
percentage of 1RM, which lets us estimate a 1RM from a submaximal set where the
lifter reported how hard it felt.
"""

from __future__ import annotations

# %1RM by reps (rows) and RPE (cols). Widely used RPE chart.
_REPS = list(range(1, 13))
_RPES = [10.0, 9.5, 9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 6.0]
_TABLE: dict[int, dict[float, float]] = {
    1:  dict(zip(_RPES, [100.0, 97.8, 95.5, 93.9, 92.2, 90.7, 89.2, 87.8, 86.3])),
    2:  dict(zip(_RPES, [95.5, 93.9, 92.2, 90.7, 89.2, 87.8, 86.3, 85.0, 83.7])),
    3:  dict(zip(_RPES, [92.2, 90.7, 89.2, 87.8, 86.3, 85.0, 83.7, 82.4, 81.1])),
    4:  dict(zip(_RPES, [89.2, 87.8, 86.3, 85.0, 83.7, 82.4, 81.1, 79.9, 78.6])),
    5:  dict(zip(_RPES, [86.3, 85.0, 83.7, 82.4, 81.1, 79.9, 78.6, 77.4, 76.2])),
    6:  dict(zip(_RPES, [83.7, 82.4, 81.1, 79.9, 78.6, 77.4, 76.2, 75.1, 73.9])),
    7:  dict(zip(_RPES, [81.1, 79.9, 78.6, 77.4, 76.2, 75.1, 73.9, 72.3, 70.7])),
    8:  dict(zip(_RPES, [78.6, 77.4, 76.2, 75.1, 73.9, 72.3, 70.7, 69.4, 68.0])),
    9:  dict(zip(_RPES, [76.2, 75.1, 73.9, 72.3, 70.7, 69.4, 68.0, 66.7, 65.3])),
    10: dict(zip(_RPES, [73.9, 72.3, 70.7, 69.4, 68.0, 66.7, 65.3, 64.0, 62.6])),
    11: dict(zip(_RPES, [70.7, 69.4, 68.0, 66.7, 65.3, 64.0, 62.6, 61.3, 59.9])),
    12: dict(zip(_RPES, [68.0, 66.7, 65.3, 64.0, 62.6, 61.3, 59.9, 58.6, 57.3])),
}


def rir_from_rpe(rpe: float) -> float:
    """Reps in reserve implied by an RPE (RIR = 10 - RPE)."""
    return 10.0 - rpe


def rpe_from_rir(rir: float) -> float:
    return 10.0 - rir


def _nearest(value: float, options: list[float]) -> float:
    return min(options, key=lambda o: abs(o - value))


def percent_1rm_from_rpe(rpe: float, reps: int) -> float:
    """Percentage of 1RM for a set of `reps` taken at the given `rpe`.

    Snaps to the nearest 0.5 RPE and clamps reps to the chart's 1-12 range.
    """
    reps = max(1, min(12, reps))
    rpe = _nearest(rpe, _RPES)
    return _TABLE[reps][rpe]


def estimate_1rm_from_rpe(weight: float, reps: int, rpe: float) -> float:
    """Estimate 1RM from a submaximal set with a reported RPE."""
    pct = percent_1rm_from_rpe(rpe, reps)
    return weight / (pct / 100)
