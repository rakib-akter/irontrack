"""Analytics endpoints — thin HTTP layer over the pure `stratum_analytics`
package. Stateless and auth-free (pure compute, no user data)."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel

from stratum_analytics import (
    epley_1rm,
    brzycki_1rm,
    estimate_1rm,
    estimate_1rm_from_rpe,
    progression_rate_per_week,
    detect_plateau,
    projected_weeks_to_target,
)

router = APIRouter(prefix="/analytics", tags=["analytics"])


class OneRepMaxRequest(BaseModel):
    weight: float
    reps: int
    rpe: float | None = None


class OneRepMaxResponse(BaseModel):
    epley: float
    brzycki: float | None
    consensus: float
    from_rpe: float | None = None


@router.post("/one-rep-max", response_model=OneRepMaxResponse)
def one_rep_max(req: OneRepMaxRequest) -> OneRepMaxResponse:
    try:
        brzycki = brzycki_1rm(req.weight, req.reps)
    except ValueError:
        brzycki = None
    return OneRepMaxResponse(
        epley=round(epley_1rm(req.weight, req.reps), 2),
        brzycki=round(brzycki, 2) if brzycki is not None else None,
        consensus=round(estimate_1rm(req.weight, req.reps), 2),
        from_rpe=(
            round(estimate_1rm_from_rpe(req.weight, req.reps, req.rpe), 2)
            if req.rpe is not None
            else None
        ),
    )


class StrengthPoint(BaseModel):
    day: float  # days since an epoch
    one_rm: float


class ProgressionRequest(BaseModel):
    series: list[StrengthPoint]
    target_1rm: float | None = None


class ProgressionResponse(BaseModel):
    rate_per_week: float | None
    is_plateau: bool
    plateau_reason: str
    weeks_to_target: float | None = None


@router.post("/progression", response_model=ProgressionResponse)
def progression(req: ProgressionRequest) -> ProgressionResponse:
    series = [(p.day, p.one_rm) for p in req.series]
    rate = progression_rate_per_week(series)
    plateau = detect_plateau(series)
    weeks = None
    if req.target_1rm is not None and series:
        weeks = projected_weeks_to_target(series[-1][1], req.target_1rm, rate)
    return ProgressionResponse(
        rate_per_week=round(rate, 3) if rate is not None else None,
        is_plateau=plateau.is_plateau,
        plateau_reason=plateau.reason,
        weeks_to_target=round(weeks, 1) if weeks is not None else None,
    )
