# stratum-analytics

Pure, dependency-free strength & body-composition models for STRATUM. No I/O, no
globals — just functions that are trivial to test and safe to reuse from the
FastAPI backend (or mirror in TypeScript on the client).

## Modules

| Module | What |
|---|---|
| `strength` | Epley & Brzycki 1RM, consensus estimate, inverse (weight for reps), relative intensity |
| `rir` | RPE↔RIR, RPE→%1RM chart (Tuchscherer/RTS), 1RM from a submaximal RPE set |
| `volume` | Session volume (w×r×s) and totals |
| `trend` | Rolling average, EWMA, least-squares slope |
| `plateau` | Progression rate/week, plateau detection, projected weeks-to-target |
| `fatigue` | Acute:chronic workload ratio (ACWR) |

## Develop & test

```bash
cd analytics
python -m venv .venv
.venv/Scripts/python -m pip install --use-feature=truststore pytest   # Windows
PYTHONPATH=. .venv/Scripts/python -m pytest -q
```

> On this machine, `--use-feature=truststore` makes pip trust the Windows
> certificate store (the local TLS proxy otherwise breaks pip).

## Example

```python
from stratum_analytics import estimate_1rm, estimate_1rm_from_rpe, detect_plateau

estimate_1rm(225, 5)                 # consensus 1RM ≈ 257.8
estimate_1rm_from_rpe(225, 5, rpe=8) # ≈ 277.4 (5 reps @ RPE 8 = 81.1%)
detect_plateau([(0, 200), (14, 200.3), (28, 200.1)]).is_plateau  # True
```
