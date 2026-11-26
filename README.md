# Drink Tracker

A small iPhone PWA for keeping count on a night out. Tap a drink, it's logged.
Everything stays on the phone (localStorage); no accounts, no server.

## What it does
- **Tally first.** Drinks and units, coloured by a traffic light that follows tonight's plan.
- **Plans.** Couple after work / night in / dinner / matchday / big night, an adjustable aim
  (in pint-equivalents, so halves count as half), work tomorrow, local vs train home,
  an if-then rule ("when I hit my plan I'll switch to a 0.0") and an optional "tomorrow I want to…".
- **Reactive guidance.** One instruction at a time, a next-drink time, and "moments" when a
  drink tips something over (into red, past the plan, tomorrow gets worse, shots, energy drinks).
- **Where you stand.** What's already locked in, what's at stake, what stopping now saves.
- **Speed bump.** A hold-up sheet (with an alcohol-free swap) before a drink that breaks the plan.
- **Getting home.** Home time or last-train countdown, leave-by time, banner in the final 60/90 min.
- **Mornings.** A short check-in (head, sleep, symptoms, training, worth it), a did-you-train
  follow-up, and day-two check after heavy nights. These calibrate future predictions.
- **History.** Weekly units vs goal, drink-free days, plan streak, and what we've learned.

## Notes
- Static files on GitHub Pages; no build step.
- A "night" runs 06:00 → 06:00 by the wall clock (safe across clock changes).
- Units = ml × ABV% ÷ 1000. Body clears ~1 unit/hour (rule of thumb, never a driving guide).
- When changing app files, bump `CACHE` in `sw.js` so phones pick up the update.
