// Logging streaks: consecutive days with any activity (a lift, meal, recovery
// check-in, or measurement). Pure function over a set of YYYY-MM-DD day keys.

export interface Streak {
  current: number;
  longest: number;
}

const DAY_MS = 86_400_000;
const key = (d: Date) => d.toISOString().slice(0, 10);

export function computeStreak(
  days: Iterable<string>,
  today: Date = new Date(),
): Streak {
  const set = new Set(days);
  if (set.size === 0) return { current: 0, longest: 0 };

  // Longest run of consecutive days.
  const sorted = [...set].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00Z`).getTime();
    const cur = new Date(`${sorted[i]}T00:00:00Z`).getTime();
    if (cur - prev === DAY_MS) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  // Current streak: count back from today (or yesterday if nothing logged yet today).
  const todayKey = key(today);
  const yesterdayKey = key(new Date(today.getTime() - DAY_MS));
  let cursor: Date;
  if (set.has(todayKey)) cursor = today;
  else if (set.has(yesterdayKey)) cursor = new Date(today.getTime() - DAY_MS);
  else return { current: 0, longest };

  let current = 0;
  while (set.has(key(cursor))) {
    current += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return { current, longest };
}
