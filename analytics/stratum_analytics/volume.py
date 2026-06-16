"""Training volume."""

from __future__ import annotations

from collections.abc import Iterable


def session_volume(weight: float, reps: int, sets: int = 1) -> float:
    """Volume load for a single logged movement: weight * reps * sets."""
    if reps < 0 or sets < 0:
        raise ValueError("reps and sets must be >= 0")
    return weight * reps * sets


def total_volume(entries: Iterable[tuple[float, int, int]]) -> float:
    """Sum of session_volume over (weight, reps, sets) tuples."""
    return sum(session_volume(w, r, s) for (w, r, s) in entries)
