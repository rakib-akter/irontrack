"""One-rep-max estimation and intensity math."""

from __future__ import annotations


def epley_1rm(weight: float, reps: int) -> float:
    """Epley formula: 1RM = w * (1 + reps/30). Accurate for ~1-10 reps."""
    if reps <= 0:
        raise ValueError("reps must be >= 1")
    if reps == 1:
        return float(weight)
    return weight * (1 + reps / 30)


def brzycki_1rm(weight: float, reps: int) -> float:
    """Brzycki formula: 1RM = w * 36 / (37 - reps). Diverges past ~12 reps."""
    if reps <= 0:
        raise ValueError("reps must be >= 1")
    if reps == 1:
        return float(weight)
    if reps >= 37:
        raise ValueError("Brzycki is undefined for reps >= 37")
    return weight * 36 / (37 - reps)


def estimate_1rm(weight: float, reps: int, method: str = "consensus") -> float:
    """Estimate 1RM.

    method="epley" | "brzycki" | "consensus" (mean of the two, which is more
    robust across rep ranges than either alone).
    """
    if method == "epley":
        return epley_1rm(weight, reps)
    if method == "brzycki":
        return brzycki_1rm(weight, reps)
    if method == "consensus":
        # Brzycki is undefined at very high reps; fall back to Epley there.
        if reps >= 37:
            return epley_1rm(weight, reps)
        return (epley_1rm(weight, reps) + brzycki_1rm(weight, reps)) / 2
    raise ValueError(f"unknown method: {method}")


def weight_for_reps(one_rm: float, reps: int, method: str = "epley") -> float:
    """Inverse of the 1RM formula: the working weight for a target rep count."""
    if reps <= 0:
        raise ValueError("reps must be >= 1")
    if reps == 1:
        return float(one_rm)
    if method == "epley":
        return one_rm / (1 + reps / 30)
    if method == "brzycki":
        return one_rm * (37 - reps) / 36
    raise ValueError(f"unknown method: {method}")


def relative_intensity(weight: float, one_rm: float) -> float:
    """Working weight as a percentage of 1RM (0-100+)."""
    if one_rm <= 0:
        raise ValueError("one_rm must be > 0")
    return weight / one_rm * 100
