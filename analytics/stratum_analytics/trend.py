"""Trend math: rolling averages, EWMA, and least-squares slope."""

from __future__ import annotations

from collections.abc import Sequence


def rolling_average(values: Sequence[float], window: int) -> list[float]:
    """Trailing simple moving average. Output has the same length as input;
    early points average over however many values exist so far."""
    if window < 1:
        raise ValueError("window must be >= 1")
    out: list[float] = []
    for i in range(len(values)):
        start = max(0, i - window + 1)
        chunk = values[start : i + 1]
        out.append(sum(chunk) / len(chunk))
    return out


def ewma(values: Sequence[float], alpha: float) -> list[float]:
    """Exponentially weighted moving average. alpha in (0, 1]; higher = more
    responsive. Used for trend weight and smoothed strength."""
    if not 0 < alpha <= 1:
        raise ValueError("alpha must be in (0, 1]")
    out: list[float] = []
    prev: float | None = None
    for v in values:
        prev = v if prev is None else alpha * v + (1 - alpha) * prev
        out.append(prev)
    return out


def linear_slope(xs: Sequence[float], ys: Sequence[float]) -> float | None:
    """Least-squares slope of ys over xs. None if undefined (n<2 or no spread
    in xs)."""
    n = len(xs)
    if n < 2 or n != len(ys):
        return None
    sx = sum(xs)
    sy = sum(ys)
    sxx = sum(x * x for x in xs)
    sxy = sum(x * y for x, y in zip(xs, ys))
    denom = n * sxx - sx * sx
    if denom == 0:
        return None
    return (n * sxy - sx * sy) / denom
