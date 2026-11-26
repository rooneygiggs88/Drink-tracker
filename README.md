# Drink Tracker

A tiny iPhone PWA for keeping count on a night out. Tap a drink, it's logged.
Shows drinks and units for tonight, plus history. All data stays on the phone.

- Hosted as static files (GitHub Pages) — no build step.
- A "night" runs 6am → 6am, so late drinks count towards the right evening.
- Units = ml × ABV% ÷ 1000.
- When changing app files, bump `CACHE` in `sw.js` so phones pick up the update.
