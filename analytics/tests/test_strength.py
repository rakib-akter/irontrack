import math

import pytest

from stratum_analytics import (
    epley_1rm,
    brzycki_1rm,
    estimate_1rm,
    weight_for_reps,
    relative_intensity,
)


def test_single_rep_is_the_weight():
    assert epley_1rm(225, 1) == 225
    assert brzycki_1rm(225, 1) == 225
    assert estimate_1rm(225, 1) == 225


def test_epley_known_value():
    # 225 x 5 -> 225 * (1 + 5/30) = 262.5
    assert epley_1rm(225, 5) == pytest.approx(262.5)


def test_brzycki_known_value():
    # 225 x 5 -> 225 * 36 / 32 = 253.125
    assert brzycki_1rm(225, 5) == pytest.approx(253.125)


def test_consensus_is_mean_of_methods():
    w, r = 185, 8
    assert estimate_1rm(w, r, "consensus") == pytest.approx(
        (epley_1rm(w, r) + brzycki_1rm(w, r)) / 2
    )


def test_consensus_falls_back_to_epley_at_high_reps():
    assert estimate_1rm(100, 40, "consensus") == epley_1rm(100, 40)


def test_weight_for_reps_inverts_epley():
    one_rm = epley_1rm(225, 5)
    assert weight_for_reps(one_rm, 5, "epley") == pytest.approx(225)


def test_weight_for_reps_inverts_brzycki():
    one_rm = brzycki_1rm(225, 5)
    assert weight_for_reps(one_rm, 5, "brzycki") == pytest.approx(225)


def test_relative_intensity():
    assert relative_intensity(225, 300) == pytest.approx(75.0)


def test_invalid_inputs():
    with pytest.raises(ValueError):
        epley_1rm(100, 0)
    with pytest.raises(ValueError):
        brzycki_1rm(100, 37)
    with pytest.raises(ValueError):
        relative_intensity(100, 0)
    with pytest.raises(ValueError):
        estimate_1rm(100, 5, "nope")
