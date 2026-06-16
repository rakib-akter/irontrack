"""STRATUM analytics — pure, dependency-free strength & body-composition models.

Every function here is a pure function (no I/O, no globals) so it can be unit
tested in isolation and reused from FastAPI or mirrored in TypeScript.
"""

from .strength import (
    epley_1rm,
    brzycki_1rm,
    estimate_1rm,
    weight_for_reps,
    relative_intensity,
)
from .rir import rir_from_rpe, rpe_from_rir, percent_1rm_from_rpe, estimate_1rm_from_rpe
from .volume import session_volume, total_volume
from .trend import rolling_average, ewma, linear_slope
from .plateau import (
    progression_rate_per_week,
    detect_plateau,
    projected_weeks_to_target,
    PlateauResult,
)
from .fatigue import acute_chronic_ratio

__all__ = [
    "epley_1rm",
    "brzycki_1rm",
    "estimate_1rm",
    "weight_for_reps",
    "relative_intensity",
    "rir_from_rpe",
    "rpe_from_rir",
    "percent_1rm_from_rpe",
    "estimate_1rm_from_rpe",
    "session_volume",
    "total_volume",
    "rolling_average",
    "ewma",
    "linear_slope",
    "progression_rate_per_week",
    "detect_plateau",
    "projected_weeks_to_target",
    "PlateauResult",
    "acute_chronic_ratio",
]
