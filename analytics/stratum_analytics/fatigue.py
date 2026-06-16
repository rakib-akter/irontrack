"""Fatigue proxy via the acute:chronic workload ratio (ACWR).

ACWR compares recent ("acute") training load to longer-term ("chronic") load.
Ratios well above 1 indicate a spike in load relative to what the athlete is
prepared for (elevated fatigue / injury risk); well below 1 indicates
detraining. A commonly cited "sweet spot" is roughly 0.8-1.3.
"""

from __future__ import annotations

from collections.abc import Sequence


def acute_chronic_ratio(
    daily_volumes: Sequence[float],
    acute_days: int = 7,
    chronic_days: int = 28,
) -> float | None:
    """ACWR from a chronological list of daily volume loads (most recent last).

    Returns acute_avg / chronic_avg, or None if there isn't enough history or
    the chronic average is zero.
    """
    if len(daily_volumes) < chronic_days or chronic_days <= 0 or acute_days <= 0:
        return None
    acute = daily_volumes[-acute_days:]
    chronic = daily_volumes[-chronic_days:]
    acute_avg = sum(acute) / len(acute)
    chronic_avg = sum(chronic) / len(chronic)
    if chronic_avg == 0:
        return None
    return acute_avg / chronic_avg
