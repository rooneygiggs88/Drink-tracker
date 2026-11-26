'use strict';

/* =========================================================
   Drink Tracker — tap a drink, it's logged. All data stays
   on this device (localStorage). A "night" runs 6am → 6am.
   ========================================================= */

const NIGHT_ROLLOVER_HOUR = 6;
const CLEAR_RATE = 1;          // units the body clears per hour (UK rule of thumb)
const KCAL_PER_UNIT = 56;      // 8g alcohol × 7 kcal
const BIG_MAC_KCAL = 563;
const DB_VERSION = 6;

const CATS = [
  { id: 'pints',     label: 'Pints' },
  { id: 'halves',    label: 'Halves' },
  { id: 'bottles',   label: 'Bottles & cans' },
  { id: 'wine',      label: 'Wine' },
  { id: 'shots',     label: 'Shots' },
  { id: 'spirits',   label: 'Spirits & mixers' },
  { id: 'cocktails', label: 'Cocktails' },
];

const SIZES = [
  { ml: 568, label: 'Pint' },
  { ml: 284, label: 'Half' },
  { ml: 330, label: 'Bottle 330ml' },
  { ml: 275, label: 'Small bottle 275ml' },
  { ml: 440, label: 'Can 440ml' },
  { ml: 500, label: 'Can 500ml' },
  { ml: 125, label: 'Small glass 125ml' },
  { ml: 175, label: 'Glass 175ml' },
  { ml: 250, label: 'Large glass 250ml' },
  { ml: 25,  label: 'Single 25ml' },
  { ml: 50,  label: 'Double 50ml' },
];

const FEELINGS = [
  { emoji: '😊', label: 'Sober',   sub: 'Feel completely normal' },
  { emoji: '🙂', label: 'Merry',   sub: 'Relaxed, chatty, enjoying it' },
  { emoji: '😵‍💫', label: 'Tipsy',  sub: 'Bit giddy, bit louder' },
  { emoji: '🥴', label: 'Drunk',   sub: 'Clumsy, decisions getting worse' },
  { emoji: '💀', label: 'Wrecked', sub: 'Room moving, should be home' },
];
const DRUNK_LEVEL = 3;

const MORNINGS = [
  { emoji: '😎', label: 'Fresh' },
  { emoji: '🙂', label: 'Fine' },
  { emoji: '😐', label: 'Rough' },
  { emoji: '🤢', label: 'Hanging' },
  { emoji: '☠️', label: 'Never again' },
];

// What kind of night is it? Each sets a drinks target and the tone of the guidance.
const GOALS = {
  quick:  { emoji: '🍻', label: 'Couple after work', sub: 'In, a couple, home',     target: 2, tone: 'light' },
  home:   { emoji: '🏠', label: 'Night in',          sub: 'A few on the sofa',      target: 3, tone: 'light' },
  social: { emoji: '🍽️', label: 'Dinner / catch-up', sub: 'Sociable, not messy',    target: 4, tone: 'mid' },
  big:    { emoji: '🎉', label: 'Big night out',     sub: 'Going for it, safely',   target: 8, tone: 'big' },
};

const DEFAULT_SETTINGS = { amber: 6, red: 10, checkEvery: 1 };   // checkEvery: ask how you feel every N drinks (0 = never)
const PINT_UNITS = 2.4;

// ABVs are typical UK figures; prices are rough UK pub averages.
// Both are editable in the app.
const DEFAULT_LIBRARY = [
  // Pints (568ml)
  { id: 'p-guinness',    cat: 'pints', name: 'Guinness',        abv: 4.2, ml: 568, price: 5.80 },
  { id: 'p-stella',      cat: 'pints', name: 'Stella Artois',   abv: 4.6, ml: 568, price: 5.60 },
  { id: 'p-peroni',      cat: 'pints', name: 'Peroni',          abv: 5.0, ml: 568, price: 6.20 },
  { id: 'p-moretti',     cat: 'pints', name: 'Birra Moretti',   abv: 4.6, ml: 568, price: 6.00 },
  { id: 'p-staropramen', cat: 'pints', name: 'Staropramen',     abv: 4.0, ml: 568, price: 5.80 },
  { id: 'p-madri',       cat: 'pints', name: 'Madrí',           abv: 4.6, ml: 568, price: 6.00 },
  { id: 'p-camden',      cat: 'pints', name: 'Camden Hells',    abv: 4.6, ml: 568, price: 6.40 },
  { id: 'p-carling',     cat: 'pints', name: 'Carling',         abv: 3.7, ml: 568, price: 4.80 },
  { id: 'p-asahi',       cat: 'pints', name: 'Asahi',           abv: 5.2, ml: 568, price: 6.40 },
  { id: 'p-ipa',         cat: 'pints', name: 'IPA / Pale ale',  abv: 5.5, ml: 568, price: 6.50 },
  { id: 'p-strongbow',   cat: 'pints', name: 'Strongbow',       abv: 4.5, ml: 568, price: 5.20 },
  { id: 'p-thatchers',   cat: 'pints', name: 'Thatchers Gold',  abv: 4.8, ml: 568, price: 5.50 },

  // Bottles & cans
  { id: 'b-bud',         cat: 'bottles', name: 'Budweiser',     abv: 4.5, ml: 330, price: 4.80 },
  { id: 'b-corona',      cat: 'bottles', name: 'Corona',        abv: 4.5, ml: 330, price: 5.00 },
  { id: 'b-peroni',      cat: 'bottles', name: 'Peroni',        abv: 5.1, ml: 330, price: 5.00 },
  { id: 'b-moretti',     cat: 'bottles', name: 'Birra Moretti', abv: 4.6, ml: 330, price: 5.00 },
  { id: 'b-stella',      cat: 'bottles', name: 'Stella Artois', abv: 4.6, ml: 330, price: 4.80 },
  { id: 'b-heineken',    cat: 'bottles', name: 'Heineken',      abv: 5.0, ml: 330, price: 4.80 },
  { id: 'b-sol',         cat: 'bottles', name: 'Sol',           abv: 4.5, ml: 330, price: 4.80 },
  { id: 'b-desperados',  cat: 'bottles', name: 'Desperados',    abv: 5.9, ml: 330, price: 5.50 },
  { id: 'b-guinness',    cat: 'bottles', name: 'Guinness can',  abv: 4.2, ml: 440, price: 2.00 },
  { id: 'b-kopparberg',  cat: 'bottles', name: 'Kopparberg',    abv: 4.0, ml: 500, price: 6.00 },
  { id: 'b-magners',     cat: 'bottles', name: 'Magners',       abv: 4.5, ml: 568, price: 6.00 },

  // Wine
  { id: 'w-small',       cat: 'wine', name: 'Wine (small)',     abv: 12,  ml: 125, price: 5.00 },
  { id: 'w-medium',      cat: 'wine', name: 'Wine (medium)',    abv: 12,  ml: 175, price: 6.50 },
  { id: 'w-large',       cat: 'wine', name: 'Wine (large)',     abv: 12,  ml: 250, price: 8.50 },
  { id: 'w-prosecco',    cat: 'wine', name: 'Prosecco',         abv: 11,  ml: 125, price: 7.00 },
  { id: 'w-bottle',      cat: 'wine', name: 'Bottle of wine',   abv: 12,  ml: 750, price: 26.00 },

  // Shots
  { id: 's-tequila',     cat: 'shots', name: 'Tequila',         abv: 38,   ml: 25, price: 4.00 },
  { id: 's-jagerbomb',   cat: 'shots', name: 'Jägerbomb',       abv: 35,   ml: 25, price: 5.00 },
  { id: 's-sambuca',     cat: 'shots', name: 'Sambuca',         abv: 38,   ml: 25, price: 4.00 },
  { id: 's-vodka',       cat: 'shots', name: 'Vodka shot',      abv: 37.5, ml: 25, price: 4.00 },
  { id: 's-fireball',    cat: 'shots', name: 'Fireball',        abv: 33,   ml: 25, price: 4.00 },
  { id: 's-baby',        cat: 'shots', name: 'Baby Guinness',   abv: 20,   ml: 25, price: 4.00 },

  // Spirits & mixers
  { id: 'x-vodka1',      cat: 'spirits', name: 'Vodka & mixer',   abv: 37.5, ml: 25, price: 6.00 },
  { id: 'x-vodka2',      cat: 'spirits', name: 'Double vodka',    abv: 37.5, ml: 50, price: 8.50 },
  { id: 'x-gin1',        cat: 'spirits', name: 'Gin & tonic',     abv: 37.5, ml: 25, price: 6.50 },
  { id: 'x-gin2',        cat: 'spirits', name: 'Double G&T',      abv: 37.5, ml: 50, price: 9.00 },
  { id: 'x-rum',         cat: 'spirits', name: 'Rum & coke',      abv: 37.5, ml: 25, price: 6.00 },
  { id: 'x-jd',          cat: 'spirits', name: 'JD & coke',       abv: 40,   ml: 25, price: 6.50 },
  { id: 'x-whisky',      cat: 'spirits', name: 'Whisky',          abv: 40,   ml: 25, price: 5.50 },

  // Cocktails (whole drink, approximate)
  { id: 'c-pornstar',    cat: 'cocktails', name: 'Pornstar martini', abv: 15,  ml: 150, size: 'Cocktail', price: 11.00 },
  { id: 'c-espresso',    cat: 'cocktails', name: 'Espresso martini', abv: 20,  ml: 100, size: 'Cocktail', price: 11.00 },
  { id: 'c-mojito',      cat: 'cocktails', name: 'Mojito',           abv: 9,   ml: 200, size: 'Cocktail', price: 10.50 },
  { id: 'c-margarita',   cat: 'cocktails', name: 'Margarita',        abv: 20,  ml: 100, size: 'Cocktail', price: 10.50 },
  { id: 'c-aperol',      cat: 'cocktails', name: 'Aperol spritz',    abv: 5.6, ml: 250, size: 'Cocktail', price: 9.50 },
];

// Every pint also comes as a half (pubs charge a bit over half price).
for (const d of DEFAULT_LIBRARY.filter(d => d.cat === 'pints')) {
  DEFAULT_LIBRARY.push({ ...d, id: 'h' + d.id.slice(1), cat: 'halves', ml: 284, price: Math.round((d.price / 2 + 0.1) * 100) / 100 });
}

const FOOD_KINDS = {
  snack: { emoji: '🍟', label: 'Snack', lasts: 2 },   // hours it meaningfully lines the stomach
  meal:  { emoji: '🍽️', label: 'Meal',  lasts: 5 },
};

/* ---------------- Storage ---------------- */

const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem('dt.' + key);
      return raw == null ? fallback : JSON.parse(raw);
    } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem('dt.' + key, JSON.stringify(value)); }
    catch { alert('Could not save — storage may be full or blocked.'); }
  },
};

const state = {
  library: [],
  log: [],          // drinks
  water: [],        // { id, ts }
  food: [],         // { id, ts, kind: 'snack'|'meal' }
  checkins: [],     // { id, ts, level, units }
  mornings: {},     // nightKey -> level | 'skip'
  plans: {},        // nightKey -> home-time timestamp
  ended: {},        // nightKey -> when you said you were done
  goals: {},        // nightKey -> { type, target, work }
  settings: { ...DEFAULT_SETTINGS },
  cat: null,
  editing: false,
  view: 'now',
  sheet: null,
  lastAdded: null,  // { type: 'drink'|'water'|'food', id }
  toastTimer: null,
};

function loadData() {
  state.log = store.get('log', []);
  state.water = store.get('water', []);
  state.food = store.get('food', []);
  state.snooze = store.get('snooze', null);
  state.checkins = store.get('checkins', []);
  state.mornings = store.get('mornings', {});
  state.plans = store.get('plans', {});
  state.ended = store.get('ended', {});
  state.goals = store.get('goals', {});
  state.settings = { ...DEFAULT_SETTINGS, ...store.get('settings', {}) };

  const library = store.get('library', []);
  const seen = new Set(store.get('seenDefaults', []));
  const defaults = new Map(DEFAULT_LIBRARY.map(d => [d.id, d]));

  // Add built-in drinks we haven't offered before (won't resurrect ones you removed).
  for (const d of DEFAULT_LIBRARY) {
    if (!seen.has(d.id)) {
      if (!library.some(x => x.id === d.id)) library.push({ ...d });
      seen.add(d.id);
    }
  }
  // v1 → v2: give built-in drinks a default price if they never had one.
  for (const d of library) {
    if (d.price === undefined && defaults.has(d.id)) d.price = defaults.get(d.id).price;
  }
  // Back-fill category/price/kcal on old log entries so totals work for past nights.
  for (const e of state.log) {
    const src = library.find(d => d.id === e.drinkId) || defaults.get(e.drinkId);
    if (!e.cat) e.cat = src ? src.cat : 'pints';
    if (e.kcal === undefined) e.kcal = kcalOf(e.cat, e.ml, e.abv);
    if (e.price === undefined) e.price = src && src.price != null ? src.price : null;
  }

  state.library = library;
  store.set('library', library);
  store.set('seenDefaults', [...seen]);
  store.set('log', state.log);
  store.set('version', DB_VERSION);
}

const save = {
  library: () => store.set('library', state.library),
  log: () => store.set('log', state.log),
  water: () => store.set('water', state.water),
  food: () => store.set('food', state.food),
  checkins: () => store.set('checkins', state.checkins),
  mornings: () => store.set('mornings', state.mornings),
  plans: () => store.set('plans', state.plans),
  ended: () => store.set('ended', state.ended),
  goals: () => store.set('goals', state.goals),
  settings: () => store.set('settings', state.settings),
};

/* ---------------- Helpers ---------------- */

const $ = id => document.getElementById(id);
const HOUR = 3600e3;
const MIN = 60e3;
const unitsOf = (ml, abv) => (ml * abv) / 1000;
const fmtUnits = u => (Math.round(u * 10) / 10).toFixed(1);
const fmtMoney = n => '£' + (Math.round(n * 100) / 100).toFixed(2);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const plural = (n, word, many) => n + ' ' + (n === 1 ? word : (many || word + 's'));

function kcalOf(cat, ml, abv) {
  const base = unitsOf(ml, abv) * KCAL_PER_UNIT;
  const extra = { pints: ml * 0.14, halves: ml * 0.14, bottles: ml * 0.14, wine: ml * 0.2, shots: 15, spirits: 80, cocktails: 130 }[cat] || 0;
  return Math.round(base + extra);
}

function sizeLabel(item) {
  if (item.size) return item.size;
  const s = SIZES.find(s => s.ml === item.ml);
  return s ? s.label : item.ml + 'ml';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function nightKey(ts) {
  const d = new Date(ts - NIGHT_ROLLOVER_HOUR * HOUR);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

const fmtNight = key => keyToDate(key).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtTime = ts => new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

function fmtDur(ms) {
  const m = Math.max(0, Math.round(ms / MIN));
  if (m < 60) return m + ' min';
  const h = Math.floor(m / 60), r = m % 60;
  return h + 'h' + (r ? ' ' + r + 'm' : '');
}

const fmtAgo = ms => (ms < MIN ? 'just now' : fmtDur(ms) + ' ago');

// "03:10", "tomorrow 09:10" or "Sat 09:10"
function fmtWhen(ts) {
  const now = new Date();
  const d = new Date(ts);
  const days = Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / (24 * HOUR));
  if (days <= 0) return fmtTime(ts);
  if (days === 1) return 'tomorrow ' + fmtTime(ts);
  return d.toLocaleDateString('en-GB', { weekday: 'short' }) + ' ' + fmtTime(ts);
}

const inNight = (arr, key) => arr.filter(e => nightKey(e.ts) === key).sort((a, b) => a.ts - b.ts);
const sum = (arr, f) => arr.reduce((s, x) => s + (f(x) || 0), 0);

/* ---------------- The maths ---------------- */

// Units still in the body: each drink lands instantly, body clears CLEAR_RATE/hour.
function unitsInSystem(entries, at) {
  let remaining = 0, t = null;
  for (const e of [...entries].sort((a, b) => a.ts - b.ts)) {
    if (e.ts > at) break;
    if (t !== null) remaining = Math.max(0, remaining - ((e.ts - t) / HOUR) * CLEAR_RATE);
    remaining += e.units;
    t = e.ts;
  }
  if (t !== null) remaining = Math.max(0, remaining - ((at - t) / HOUR) * CLEAR_RATE);
  return remaining;
}

// Most recent food that's still "lining the stomach" at time t, or null.
function fedAt(t) {
  let best = null;
  for (const f of state.food) {
    const age = t - f.ts;
    if (age >= 0 && age <= FOOD_KINDS[f.kind].lasts * HOUR && (!best || f.ts > best.ts)) best = f;
  }
  return best;
}

// Amber/red lines in units: from tonight's plan if there is one, else from settings.
function goalLimits(goal) {
  if (!goal || !GOALS[goal.type]) return { amber: state.settings.amber, red: state.settings.red };
  const red = Math.round((goal.target * PINT_UNITS * 1.15 + 0.3) * 10) / 10;
  const amber = Math.round(Math.min(red - PINT_UNITS, red * 0.6) * 10) / 10;
  return { amber, red };
}

function unitsLevel(units, lim) {
  if (units >= lim.red) return 2;
  if (units >= lim.amber) return 1;
  return 0;
}

function howYouMightFeel(u) {
  if (u < 0.5)  return 'Sober, or as good as.';
  if (u < 2)    return 'Probably feeling normal. Maybe a little more relaxed.';
  if (u < 4)    return 'Relaxed and chattier. Reaction times are already slower than you think.';
  if (u < 6)    return 'Merry. Judgement is starting to slip — the "one more" voice gets louder from here.';
  if (u < 9)    return 'Noticeably drunk for most people: louder, clumsier, worse decisions.';
  if (u < 12)   return 'Slurring, unsteady, memory getting patchy. Tomorrow is going to hurt.';
  return 'Seriously drunk. Real risk of blackouts, being sick and accidents. Water, then home.';
}

// Average night-total units at the first "Drunk" check-in, over the last 5 such nights.
// fed: true/false limits it to check-ins made with/without food in you; undefined = all.
function personalDrunkPoint(excludeKey, fed) {
  const byNight = new Map();
  for (const c of [...state.checkins].sort((a, b) => a.ts - b.ts)) {
    const k = nightKey(c.ts);
    if (k === excludeKey || c.level < DRUNK_LEVEL || byNight.has(k)) continue;
    if (fed !== undefined && !!fedAt(c.ts) !== fed) continue;
    byNight.set(k, c.units);
  }
  const vals = [...byNight.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 5).map(x => x[1]);
  if (!vals.length) return null;
  return { units: sum(vals, x => x) / vals.length, nights: vals.length };
}

function nightSummary(key) {
  const drinks = inNight(state.log, key);
  const water = inNight(state.water, key);
  const food = inNight(state.food, key);
  const checkins = inNight(state.checkins, key);
  return {
    key, drinks, water, food, checkins,
    units: sum(drinks, e => e.units),
    kcal: sum(drinks, e => e.kcal),
    spend: sum(drinks, e => e.price),
    unpriced: drinks.filter(e => e.price == null).length,
    peakFeeling: checkins.length ? Math.max(...checkins.map(c => c.level)) : null,
  };
}

function homeTimeToTs(key, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = keyToDate(key);
  d.setHours(h, m, 0, 0);
  if (h < NIGHT_ROLLOVER_HOUR) d.setDate(d.getDate() + 1);
  return d.getTime();
}

function analyse() {
  const now = Date.now();
  const key = nightKey(now);
  const s = nightSummary(key);
  const n = s.drinks.length;
  const first = n ? s.drinks[0].ts : null;
  const last = n ? s.drinks[n - 1].ts : null;
  const ended = n && state.ended[key] ? state.ended[key] : null;
  const elapsed = n ? (ended || now) - first : 0;
  const lastHour = s.drinks.filter(e => now - e.ts <= HOUR).length;
  const pe = pintEq(s.units);
  const avgGap = n >= 2 ? elapsed / pe : null;            // minutes per pint-equivalent
  const lastHourPe = pintEq(sum(s.drinks.filter(e => now - e.ts <= HOUR), e => e.units));
  // The first drink always goes down quickly, so it doesn't count towards pace.
  const afterFirst = s.drinks.slice(1);
  const burst90 = sum(afterFirst.filter(e => now - e.ts <= 90 * MIN), e => e.units);
  const peAfterFirst = pintEq(sum(afterFirst, e => e.units));
  const perPintAfterFirst = n >= 3 && peAfterFirst > 0 ? (last - first) / peAfterFirst : null;

  // Pace: faster than one drink an hour goes amber; 3+ in an hour goes red.
  // Steady = about 45 min a pint. Amber if quicker; red at 3 pints' worth in an hour.
  let paceLevel = 0;
  if (lastHourPe >= 2.95) paceLevel = 2;
  else if (burst90 > 5.5 || (perPintAfterFirst && perPintAfterFirst < 35 * MIN)) paceLevel = 1;

  const goal = state.goals[key] && GOALS[state.goals[key].type] ? state.goals[key] : null;
  const lim = goalLimits(goal);
  const uLevel = unitsLevel(s.units, lim);
  // Overall light: units decide, but a fast pace can push green to amber.
  const level = n ? Math.max(uLevel, Math.min(paceLevel, 1)) : -1;

  // Include the last 48h so a late finish last night still counts in the morning.
  const inSystem = unitsInSystem(state.log.filter(e => now - e.ts < 48 * HOUR), now);
  const soberAt = inSystem > 0 ? now + (inSystem / CLEAR_RATE) * HOUR : null;

  const lastWater = s.water.length ? s.water[s.water.length - 1].ts : 0;
  const drinksSinceWater = s.drinks.filter(e => e.ts > lastWater).length;

  const lastCheckin = s.checkins.length ? s.checkins[s.checkins.length - 1] : null;
  const drinksSinceCheckin = lastCheckin ? s.drinks.filter(e => e.ts > lastCheckin.ts).length : n;

  const home = state.plans[key] || null;
  const fed = fedAt(now);
  const lastFood = s.food.length ? s.food[s.food.length - 1] : null;
  // Prefer the tipping point that matches whether you've eaten; fall back to all nights.
  const matched = personalDrunkPoint(key, !!fed);
  const drunkPoint = matched ? { ...matched, fed: !!fed } : personalDrunkPoint(key);

  return { now, key, s, n, first, last, elapsed, lastHour, avgGap, paceLevel, uLevel, level,
           inSystem, soberAt, drinksSinceWater, lastCheckin, drinksSinceCheckin, home, drunkPoint, fed, lastFood, ended, goal, lim, pe };
}

// Plans count in pint-equivalents (a half = ½, a large wine ≈ 1¼, a shot ≈ ⅓).
const pintEq = units => units / PINT_UNITS;
const PLAN_SLACK = 0.4;   // a couple of strong pints is still a couple
function fmtPints(pe) {
  const h = Math.round(pe * 2) / 2;
  const whole = Math.floor(h);
  return (whole ? String(whole) : '') + (h % 1 ? '½' : '') || '0';
}
const fmtClock = ms => {
  const t = Math.max(0, Math.floor(ms / 1000));
  return [Math.floor(t / 3600), Math.floor(t / 60) % 60, t % 60].map(x => String(x).padStart(2, '0')).join(':');
};

function pintsLeftText(unitsLeft) {
  const halves = Math.floor(unitsLeft / (PINT_UNITS / 2));
  if (halves < 1) return 'less than a half';
  if (halves === 1) return 'one half';
  const pints = Math.floor(halves / 2);
  return `${plural(pints, 'pint')} (${halves} halves)`;
}

/* ---------------- The guidance library ----------------
   Several ways of saying each thing, so it doesn't go stale. The line changes
   with each drink (not every refresh). {placeholders} are filled from context. */
const LINES = {
  fine: [
    "You're doing fine. Keep it steady.",
    'Nice and steady. This is how it should feel.',
    'All good. Enjoy this one.',
    'On track. No notes.',
    'Steady as she goes.',
  ],
  makeLast: [
    'Make this one last.',
    'Fresh one in hand. Make it a slow one.',
    'Nurse this one. No rush.',
    "This one's a sipper, not a sprint.",
  ],
  nearQuick: [
    'Nearly at your couple. Make this one last.',
    "One more and that's your couple. Pace it.",
    "The couple's nearly done. Savour it.",
    '≈{pe} of {t}. Make the next one the last.',
  ],
  nearPlan: [
    'Nearly at your plan. Make this one last.',
    'Getting close to your {t}. Slow it right down.',
    "≈{pe} of {t}. You're nearly there.",
  ],
  atQuick: [
    "That's your couple. Good time to head home.",
    "Couple: done. Leave on a high.",
    "That's the plan complete. Home?",
    "That's the couple. Tomorrow-you says thanks for leaving now.",
  ],
  atHome: [
    "That's your lot for a night in. Swap to something soft?",
    'Plan hit. Kettle on?',
    "That's the {t}. Tea from here?",
  ],
  overLight: [
    "That's more than a couple. Make this the last.",
    'Over the plan now. This is the last one.',
    '≈{pe} on a {t}-pint plan. Last one, then home.',
    "The couple's become a few. Draw the line here.",
  ],
  wayOver1: [
    "Way past a couple. Tomorrow's going to hurt. Stop now.",
    "This stopped being 'a couple' a while ago. Home.",
    '≈{pe} pints on a {t}-pint plan. Call it.',
  ],
  wayOverWork: [
    "Way past a couple, and you've got work. Stop now.",
    '≈{pe} pints on a work night. Stop here.',
    "Work tomorrow and {u} units tonight. Time to go.",
  ],
  wayOver2: [
    '≈{pe} pints. You planned {t}. This is a full night out now. Stop.',
    '{n} drinks deep on a quick-one plan. Time to go.',
    "{over} pints over. Nothing good comes from the next one.",
  ],
  wayOver3: [
    '≈{pe} pints on a {t}-pint night. Seriously, get home.',
    "This is a big night nobody planned. Water, taxi, bed.",
    'Every extra pint now is pure regret tomorrow. Stop.',
  ],
  noFood: [
    'Eat something before the next drink.',
    '{n} drinks, no food. Get something in.',
    'Food. Now. Chips count.',
    'Empty stomach and {u} units. Eat something.',
  ],
  noFoodBig: [
    'Long night ahead. Eat something now.',
    'Line your stomach before the next round. Food first.',
    "You won't last the night on an empty stomach. Eat.",
  ],
  paceRed: [
    'Slow right down. Nothing before {next}.',
    "That's a sprint, not a session. Pause till {next}.",
    "Too quick. Your head hasn't caught up yet. Wait till {next}.",
  ],
  paceRedBig: [
    'This is quick even for a big night. Nothing before {next}.',
    "Long night, short drinks. Wait till {next}.",
    "You'll peak too early at this rate. Next one after {next}.",
  ],
  paceAmber: [
    'Bit quick. Next one not before {next}.',
    'Ease off. Next one after {next}.',
    'Slightly too fast. Give it till {next}.',
  ],
  water: [
    'Water before the next one.',
    'Water break. Then decide.',
    '{dsw} drinks since your last water. Have one.',
    'Hydrate before the next round.',
  ],
  feltEarly: [
    "You're feeling it early tonight. Take it slow.",
    "It's hitting early tonight. Ease off.",
    'Tipsy on {cu} units? Your body is telling you something.',
  ],
  fineButHigh: [
    "You feel fine, but it's still catching up. Slow down.",
    "Feeling fine is the trap. It's still landing.",
    "{u} units and 'fine'? Give it 30 minutes.",
  ],
  amber: [
    'Steady on. Halves or water from here.',
    'Amber. Halves would be clever now.',
    'Into amber. Slow the next one down.',
    'Good time to switch to halves.',
  ],
  bigAmber: [
    "Big night, fair enough. Pace it, it's a long one.",
    "Big one, but there's a long way to go. Pace.",
    'Halfway-ish. Water, food, then carry on.',
    'Marathon, not a sprint.',
  ],
  foodGone: [
    "Your food's worn off. Grab something.",
    "Dinner's long gone. Snack time.",
    'Top up the tank. Something to eat.',
  ],
  redLast: [
    "You're in the red. Make this your last one.",
    'Red zone. This is the last.',
    '{u} units. Last one, then call it.',
  ],
  bigHit: [
    "You've hit your big-night number. Make this the last.",
    '{t} pints: big night achieved. Last one.',
    "That's the big night done. Finish this and get home.",
  ],
  atTipping: [
    'This is where you usually get drunk. Make it the last.',
    'Your usual tipping point. Last one.',
    "You know how this goes from here. Last one.",
  ],
  drunk: [
    'You said drunk. Make this your last one.',
    'Drunk, by your own account. Last one.',
    "You said drunk. Believe yourself. Last one.",
  ],
  wrecked: [
    'You said wrecked. Stop now: water, then home.',
    'Wrecked means home. Now.',
    'No more. Water, then get yourself home safe.',
  ],
  pastHome: [
    'Past your home time. Get your coat.',
    'Home time was {home}. Go.',
    'You promised yourself {home}. Keep it.',
  ],
  stop: [
    'Stop now. Water, then home.',
    "{u} units. That's plenty. Home.",
    'Nothing good happens after this. Home.',
  ],
  stop2: [
    '{u} units. This is genuinely a lot. Water and home, now.',
    'Way beyond red. Get yourself home safe.',
    'Done. Water, taxi, bed. In that order.',
  ],
};

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Pick a line for a situation; stable for a given seed (night + drink count).
function say(sit, ctx, seed) {
  const opts = LINES[sit] || LINES.fine;
  const line = opts[hashStr(seed + '|' + sit) % opts.length];
  return line.replace(/\{(\w+)\}/g, (_, k) => (ctx[k] != null ? ctx[k] : ''));
}

/* ---------------- Tomorrow & nudges ---------------- */

const MONEY_EQUIVALENTS = [
  [5, 'a meal deal'],
  [10, 'a cinema ticket'],
  [15, "a month of Netflix"],
  [25, 'a decent takeaway'],
  [40, "a month's gym membership"],
  [60, 'a weekly food shop'],
  [90, 'a new pair of running trainers'],
  [150, 'a weekend train trip'],
  [250, 'a cheap flight somewhere sunny'],
];

// What a night of `u` units costs tomorrow. Rough, but grounded: sleep quality drops
// above ~4 units; heavy drinking blunts muscle recovery for about a day.
function tomorrowTier(a, u) {
  const tmr = keyToDate(a.key); tmr.setDate(tmr.getDate() + 1);
  const day = tmr.toLocaleDateString('en-GB', { weekday: 'long' });
  const after = new Date(tmr); after.setDate(after.getDate() + 1);
  const day2 = after.toLocaleDateString('en-GB', { weekday: 'long' });
  const tier = u < 4 ? 0 : u < 8 ? 1 : u < 12 ? 2 : u < 16 ? 3 : 4;
  return {
    tier,
    extra: [0, 2, 6, 12, 30][tier],          // hours of feeling rough after you hit zero
    day,
    short: ['fine. Gym and runs are on',
            'a slower morning. Light gym or an easy run, no PBs',
            'a rough morning. A heavy session or long run is a write-off',
            'a full-day hangover. No training',
            `a two-day recovery. No gym or runs until ${day2}`][tier],
    text: [
      `Should be fine ${day}. Gym's on.`,
      `Expect a slower ${day} morning. Sleep takes a hit above ~4 units. Light training's fine, no PBs.`,
      `Hangover likely through ${day} morning. Strength and endurance noticeably down; a heavy session or long run is a write-off.`,
      `Probably a full-day hangover ${day}. Muscle recovery is blunted for about a day after heavy drinking. Skip training.`,
      `This is two-day-recovery territory. Gym and runs are off until ${day2}, realistically.`,
    ][tier],
  };
}

function tomorrowNudge(a) {
  const u = a.s.units;
  if (u < 2) return null;
  const t = tomorrowTier(a, u);
  let text = t.text;
  if (a.soberAt && u >= 4) text += ` Feeling normal by <b>${fmtFeelTime(a.soberAt + t.extra * HOUR)}</b>.`;
  return { icon: '🏋️', label: 'Tomorrow', text };
}

// "tomorrow late morning" / "Saturday afternoon". You feel a hangover when you're awake,
// so anything overnight rounds forward to the morning.
function fmtFeelTime(ts) {
  const d = new Date(ts);
  if (d.getHours() < 8) d.setHours(8, 0, 0, 0);
  if (d.getHours() >= 23) { d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); }
  const h = d.getHours();
  const part = h < 10 ? 'morning' : h < 12 ? 'late morning' : h < 14 ? 'lunchtime' : h < 16 ? 'mid-afternoon' : h < 18 ? 'late afternoon' : 'evening';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const day0 = new Date(d); day0.setHours(0, 0, 0, 0);
  const days = Math.round((day0 - today) / (24 * HOUR));
  const dayWord = days <= 0 ? 'today' : days === 1 ? 'tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'long' });
  return `${dayWord} ${part}`;
}

// The positive version: what stopping now buys you, versus one more.
function stopNowLines(a, g) {
  const { s, n } = a;
  const u = s.units;
  const lines = [];
  const lastDrink = s.drinks[n - 1];
  const more = lastDrink.units;
  const zeroNow = a.soberAt || a.now;
  const zeroMore = zeroNow + (more / CLEAR_RATE) * HOUR;
  lines.push(`Clear by <b>${fmtWhen(zeroNow)}</b>. One more pushes that to <b>${fmtWhen(zeroMore)}</b>.`);

  const now = tomorrowTier(a, u), next = tomorrowTier(a, u + more);
  lines.push(`🏋️ <b>${now.day}:</b> ${now.short}.` +
    (next.tier > now.tier ? `<br><b>One more pint:</b> ${next.short}.` : ''));

  if (u >= 4) {
    const plain = zeroNow + now.extra * HOUR;
    const cared = zeroNow + now.extra * 0.6 * HOUR;
    const todo = [a.drinksSinceWater ? 'a pint of water' : 'a pint of water (you haven\'t had one)', a.fed ? null : 'some food', 'a proper sleep'].filter(Boolean);
    const fc = fmtFeelTime(cared), fp = fmtFeelTime(plain);
    const list = todo.join(', ').replace(/, ([^,]*)$/, ' and $1');
    lines.push(fc !== fp
      ? `Add ${list} and you'll feel human by <b>${fc}</b> instead of <b>${fp}</b>.`
      : `Add ${list}: it won't speed up your liver, but it takes the edge off by <b>${fc}</b>.`);
  }

  const priced = s.drinks.filter(e => e.price != null);
  if (priced.length) {
    const avg = sum(priced, e => e.price) / priced.length;
    lines.push(`You keep <b>${fmtMoney(avg * 2)}</b>, what the next two would cost.`);
  }

  if (a.goal && GOALS[a.goal.type]) {
    lines.push(g.overPlan ? "You're over the plan, but stopping here still counts." : 'And the plan stays intact. ✅');
  }
  return lines;
}

function nudgePool(a) {
  const { s, n } = a;
  const u = s.units;
  const pool = [];
  if (s.spend > 0) {
    const eq = MONEY_EQUIVALENTS.filter(([amt]) => s.spend >= amt).pop();
    if (eq) pool.push({ icon: '💷', text: `<b>${fmtMoney(s.spend)}</b> tonight. That's ${eq[1]}.` });
    const priced = s.drinks.filter(e => e.price != null);
    if (priced.length && !a.ended) {
      const avg = sum(priced, e => e.price) / priced.length;
      pool.push({ icon: '💷', text: `The next one makes it <b>${fmtMoney(s.spend + avg)}</b>. A round for four: ~${fmtMoney(avg * 4)}.` });
    }
    if (s.spend >= 30) pool.push({ icon: '💷', text: `A night like this every week is about <b>£${Math.round(s.spend * 52).toLocaleString('en-GB')}</b> a year.` });
  }
  if (u >= 7) pool.push({ icon: '📊', text: `That's <b>${Math.round((u / 14) * 100)}%</b> of the weekly guideline (14 units) in one night.` });
  if (s.kcal >= 400) pool.push({ icon: '🏃', text: `${s.kcal.toLocaleString('en-GB')} kcal. About <b>${Math.round(s.kcal / 65)} km</b> of running to burn off.` });
  if (u >= 4) pool.push({ icon: '😴', text: 'Above ~4 units, deep and REM sleep take the hit: you sleep longer and wake up worse.' });
  if (n >= 3 && !s.water.length) pool.push({ icon: '💧', text: 'Alcohol makes you lose more fluid than you drink. One water per drink is the cheapest hangover cure going.' });
  if (a.elapsed > 2 * HOUR && u > 3) pool.push({ icon: '🫀', text: `Your body's cleared about <b>${fmtUnits(Math.max(0, u - a.inSystem))}</b> of your ${fmtUnits(u)} units so far. The rest is queued up for the night shift.` });
  if (a.goal && a.goal.type === 'big' && n >= 3) pool.push({ icon: '🔋', text: "Phone battery, how you're getting home, who you're with. Sort those while you still care." });
  if (u >= 10) pool.push({ icon: '🧠', text: "Past ~10 units, memory starts getting patchy. If you can't remember drink 6 tomorrow, that's why." });
  return pool;
}

// Two nudges, rotating with each drink so they don't go stale.
function pickNudges(a, count = 2) {
  const pool = nudgePool(a);
  if (pool.length <= count) return pool;
  const start = hashStr(a.key + '|nudge|' + a.n) % pool.length;
  return Array.from({ length: count }, (_, i) => pool[(start + i * 3) % pool.length])
    .filter((x, i, arr) => arr.indexOf(x) === i);
}

/* The guidance engine: weighs everything and decides one thing to do next.
   Returns { title, reasons[], next (html), actions[] }. */
function guidance(a) {
  const { n, s, now } = a;
  const R = a.lim.red, A = a.lim.amber, u = s.units;
  const goal = a.goal, G = goal ? GOALS[goal.type] : null, tone = G ? G.tone : 'mid';
  const c = a.lastCheckin, fl = c ? c.level : null;
  const dp = a.drunkPoint;
  const reasons = [];
  const actions = new Set();

  // ---- Finished for the night: recovery mode ----
  if (a.ended) {
    reasons.push(`Final tally: <b>${plural(n, 'drink')}, ${fmtUnits(u)} units</b>, ${fmtMoney(s.spend)}.`);
    reasons.push('<b>A pint of water before bed</b>, and keep one next to you.');
    if (!a.fed) reasons.push('<b>Eat something</b> if you can. Toast beats a kebab, but either beats nothing.');
    if (a.inSystem > 0.05) reasons.push('<b>No driving</b> until the clock above hits zero, and be cautious even then.');
    reasons.push("Tomorrow we'll ask how the head is.");
    return { title: 'Done for the night. Good call.', reasons, next: '', actions: ['water', 'food', 'undone'] };
  }

  // ---- Not started ----
  if (!n) {
    if (a.inSystem > 0.5) {
      return { title: 'Still some of last night in you. Take it easy.',
        reasons: [`~<b>${fmtUnits(a.inSystem)} units</b> left, back to zero around <b>${fmtWhen(a.soberAt)}</b>.`], next: '', actions: ['water', 'food'] };
    }
    if (G) return { title: `${G.emoji} ${G.label}: ${plural(goal.target, 'pint')}. Enjoy them.`, next: '',
      actions: a.home ? ['food'] : ['home', 'food'], reasons: [
        `Amber from about pint ${Math.max(1, Math.ceil(A / PINT_UNITS))}, red after ${plural(goal.target, 'pint')}. Halves count as half.`,
        a.home ? `Home by <b>${fmtTime(a.home)}</b>.` : 'Set a <b>home time</b> now, while you\'re sensible.',
        '<b>Eat before you start.</b> It slows everything down.',
      ] };
    return { title: 'Nothing yet. Enjoy it.', next: '', actions: ['plan', ...(a.home ? [] : ['home']), 'food'], reasons: [
      '<b>Plan tonight</b>: a couple after work or a big one? The guidance steers to match.',
      'Set a <b>home time</b> now, while you\'re sensible.',
      '<b>Eat before you start.</b> It slows everything down.',
      'Halves and a water every couple of drinks make the night last longer.',
    ] };
  }

  // ---- Signals ----
  const pastHome = a.home && now > a.home;
  const wrecked = fl === 4;
  const drunk = fl === 3;
  const atTipping = dp && u >= dp.units - 0.5;
  const noFood = n >= 3 && !a.lastFood;
  const foodGone = n >= 3 && a.lastFood && !a.fed;
  const waterDue = a.drinksSinceWater >= 3;
  const feltEarly = fl != null && fl >= 2 && c.units < (dp ? dp.units * 0.7 : A * 0.7);
  const fineButHigh = fl != null && fl <= 1 && u >= A && now - c.ts < 90 * MIN;

  const pe = a.pe;
  const overPlan = G && pe > goal.target + PLAN_SLACK;
  const atPlan = G && !overPlan && pe >= goal.target - PLAN_SLACK;
  // On a light night, going past the plan means stop; on bigger nights it means "last one".
  const stop = wrecked || u >= R * 1.5 || pastHome || (drunk && u >= R) || (tone === 'light' && (u >= R * 1.6 || pe >= goal.target + 2));
  const lastOne = !stop && (u >= R || drunk || atTipping || (tone === 'light' && overPlan));

  // ---- When could the next one be? ~45 min a pint, scaled by size; the first is quicker. ----
  let nextAt = null;
  if (!stop && !lastOne) {
    const lastUnits = s.drinks[n - 1].units;
    let gap = Math.min(75 * MIN, Math.max(15 * MIN, 45 * MIN * pintEq(lastUnits)));
    if (n === 1) gap = Math.min(gap, 25 * MIN);
    if (a.uLevel === 1 || feltEarly) gap *= 1.33;
    if (a.paceLevel === 2) gap *= 2;
    nextAt = a.last + gap;
  }

  // ---- The one thing to do: pick a situation, then a line from the library ----
  const over = G ? pe - goal.target : 0;
  let sit;
  if (stop) {
    if (pastHome) sit = 'pastHome';
    else if (wrecked) sit = 'wrecked';
    else if (tone === 'light' && overPlan) sit = over >= 5 ? 'wayOver3' : over >= 3 ? 'wayOver2' : goal.work ? 'wayOverWork' : 'wayOver1';
    else sit = u >= R * 2 ? 'stop2' : 'stop';
  }
  else if (lastOne) sit = drunk ? 'drunk' : tone === 'light' && overPlan ? 'overLight'
    : atTipping ? 'atTipping' : tone === 'big' ? 'bigHit' : 'redLast';
  else if (tone === 'light' && atPlan) sit = goal.type === 'quick' ? 'atQuick' : 'atHome';
  else if (noFood) sit = tone === 'big' ? 'noFoodBig' : 'noFood';
  else if (a.paceLevel === 2) sit = tone === 'big' ? 'paceRedBig' : 'paceRed';
  else if (tone === 'light' && a.uLevel === 1) sit = goal.type === 'quick' ? 'nearQuick' : 'nearPlan';
  else if (tone === 'big' && a.uLevel === 1) sit = 'bigAmber';
  else if (waterDue) sit = 'water';
  else if (feltEarly) sit = 'feltEarly';
  else if (fineButHigh) sit = 'fineButHigh';
  else if (a.uLevel === 1) sit = 'amber';
  else if (a.paceLevel === 1) sit = 'paceAmber';
  else if (foodGone) sit = 'foodGone';
  else if (now - a.last < 15 * MIN) sit = 'makeLast';
  else sit = 'fine';

  const title = say(sit, {
    n, pe: fmtPints(pe), t: G ? goal.target : 0, over: fmtPints(over), u: fmtUnits(u),
    next: nextAt ? fmtTime(nextAt) : '', home: a.home ? fmtTime(a.home) : '',
    dsw: a.drinksSinceWater, cu: c ? fmtUnits(c.units) : '',
  }, `${a.key}|${n}`);

  // ---- Why ----
  if (G) reasons.push(`${G.emoji} Plan: <b>${G.label}</b>, ${plural(goal.target, 'pint')}. You're on <b>≈${fmtPints(pe)}</b>${overPlan ? `, <b>${fmtPints(pe - goal.target)} over</b>` : ''}${Math.abs(n - pe) >= 0.5 ? ` (${plural(n, 'drink')})` : ''}.`);
  let workReason = null;
  if (goal && goal.work) {
    const eight = keyToDate(a.key); eight.setDate(eight.getDate() + 1); eight.setHours(8, 0, 0, 0);
    const at8 = a.inSystem - Math.max(0, (eight - now) / HOUR) * CLEAR_RATE;
    workReason = at8 > 0.3
      ? `<b>Work tomorrow:</b> ~${fmtUnits(at8)} units still in you at 8am. Every extra pint adds ~2½ hours.`
      : overPlan || stop || lastOne ? '<b>Work tomorrow:</b> stop now and you should just about be clear by 8am.'
      : '<b>Work tomorrow:</b> keep it here and you\'ll be clear by 8am.';
    if (tone === 'light') reasons.push(workReason);
  }
  if (u >= R) reasons.push(`<b>${fmtUnits(u)} units</b>: ${fmtUnits(u - R)} past your red line of ${R}.`);
  else reasons.push(`<b>${fmtUnits(u)} units</b>${u >= A ? ' (amber)' : ''}. About <b>${pintsLeftText(R - u)}</b> before red.`);

  if (c) {
    const f = FEELINGS[fl];
    let t = `You said <b>${f.label.toLowerCase()}</b> at ${fmtTime(c.ts)}, on ${fmtUnits(c.units)} units.`;
    if (feltEarly) t += " That's early for you.";
    if (fineButHigh) t += ' Alcohol keeps rising for 30–90 minutes after a drink, so feeling fine lags behind.';
    reasons.push(t);
  }
  if (dp && !atTipping) reasons.push(`You usually feel drunk around <b>${fmtUnits(dp.units)} units</b>${dp.fed === undefined ? '' : dp.fed ? ' when fed' : ' on an empty stomach'}. ${fmtUnits(dp.units - u)} to go.`);
  else if (dp) reasons.push(`You usually feel drunk around <b>${fmtUnits(dp.units)} units</b>. You're there.`);
  if (a.paceLevel >= 1) reasons.push(`<b>${plural(a.lastHour, 'drink')} in the last hour.</b> Alcohol takes 30–90 min to fully hit, so a quick pace means you decide on the next one before the last has landed.`);
  if (noFood) reasons.push('<b>Nothing eaten.</b> On an empty stomach it hits harder and faster.');
  else if (foodGone) reasons.push(`<b>Last ate ${fmtAgo(now - a.lastFood.ts)}.</b> That's stopped helping.`);
  if (waterDue) reasons.push(`<b>${a.drinksSinceWater} drinks since your last water.</b>`);
  if (workReason && tone !== 'light') reasons.push(workReason);
  if (tone === 'big' && (a.uLevel >= 1 || n >= 4)) reasons.push('<b>Big night basics:</b> water every couple of drinks, eat, keep your phone charged, know how you\'re getting home.');
  if (pastHome) reasons.push(`Home time was <b>${fmtTime(a.home)}</b>, ${fmtAgo(now - a.home)}.`);
  else if (a.home && a.avgGap && n >= 2) {
    const more = Math.floor((a.home - now) / a.avgGap);
    reasons.push(`At this pace: <b>~${plural(more, 'more pint')}</b> by ${fmtTime(a.home)}, ending on ~${fmtUnits(u + more * PINT_UNITS)} units.`);
  }

  // ---- What you can do about it ----
  if (stop || lastOne) { actions.add('done'); actions.add('water'); }
  if (noFood || foodGone) actions.add('food');
  if (waterDue) actions.add('water');
  if (!stop && !lastOne && (a.uLevel >= 1 || a.paceLevel >= 1 || feltEarly || fineButHigh)) actions.add('halves');

  let next;
  if (stop) next = '⛔ <b>No more tonight.</b>';
  else if (lastOne) next = '⛔ <b>After this one, no more.</b>';
  else if (nextAt > now) next = `⏳ Next drink not before <b>${fmtTime(nextAt)}</b> · ${fmtDur(nextAt - now)} to wait`;
  else next = '⏳ No rush. About 45 minutes a pint keeps it steady.';

  if (!goal) actions.add('plan');
  if (stop && tone === 'light' && overPlan) next = '⛔ <b>Plan says home.</b>';
  return { title, reasons: reasons.slice(0, 6), next, actions: [...actions], stop, lastOne, overPlan, atPlan, pastHome };
}

const GUIDE_ACTIONS = {
  water:  '💧 Have a water',
  food:   '🍔 Log food',
  halves: '🍺 Switch to halves',
  home:   '🏠 Set home time',
  plan:   '🎯 Plan tonight',
  done:   "🛑 I'm done for the night",
  undone: '↩︎ Not done after all',
};

/* ---------------- Logging ---------------- */

// Should we put a speed bump in front of this drink? Returns a title, or null.
function holdUpTitle(a, g, drink) {
  if (!a.n) return null;
  if (a.ended) return `You called it a night at ${fmtTime(a.ended)}.`;
  if (g.pastHome) return `You said home by ${fmtTime(a.home)}.`;
  if (g.stop) return g.title;
  if (g.lastOne) return 'You said the last one was the last one.';
  const after = a.pe + pintEq(unitsOf(drink.ml, drink.abv));
  if (a.goal && after > a.goal.target + PLAN_SLACK) return `You planned ${plural(a.goal.target, 'pint')}. This takes you to ≈${fmtPints(after)}.`;
  return null;
}

function openHoldUp(drink, title, g) {
  state.pendingDrink = drink;
  $('holdTitle').textContent = title;
  $('holdDrink').textContent = `${drink.name} · ${fmtUnits(unitsOf(drink.ml, drink.abv))} units`;
  $('holdWhy').innerHTML = g.reasons.slice(0, 3).map(r => `<li>${r}</li>`).join('');
  const btn = $('holdAnyway');
  let left = 3;
  btn.disabled = true;
  btn.textContent = `Log it anyway (${left})`;
  clearInterval(state.holdTimer);
  state.holdTimer = setInterval(() => {
    left -= 1;
    if (left > 0) { btn.textContent = `Log it anyway (${left})`; return; }
    clearInterval(state.holdTimer);
    btn.disabled = false;
    btn.textContent = 'Log it anyway';
  }, 1000);
  openSheet('holdSheet');
}

function logDrink(drink, force) {
  const key = nightKey(Date.now());
  if (!force) {
    const a = analyse();
    const g = guidance(a);
    const t = holdUpTitle(a, g, drink);
    if (t) return openHoldUp(drink, t, g);
  }
  if (state.ended[key]) {
    delete state.ended[key];
    save.ended();
  }
  const entry = {
    id: uid(),
    drinkId: drink.id,
    name: drink.name,
    cat: drink.cat,
    abv: drink.abv,
    ml: drink.ml,
    size: sizeLabel(drink),
    units: unitsOf(drink.ml, drink.abv),
    kcal: kcalOf(drink.cat, drink.ml, drink.abv),
    price: drink.price != null ? drink.price : null,
    ts: Date.now(),
  };
  state.log.push(entry);
  save.log();
  state.lastAdded = { type: 'drink', id: entry.id };
  showToast(drink.name + ' added', true);
  goTo('now', true);
  if (!state.goals[key] && inNight(state.log, key).length === 1) openPlanSheet();
}

function setDone(done) {
  const key = nightKey(Date.now());
  if (done) {
    state.ended[key] = Date.now();
    state.lastAdded = { type: 'ended', id: key };
    showToast('🛑 Done for the night. Good call.', true);
  } else {
    delete state.ended[key];
  }
  save.ended();
  goTo('now');
}

function logWater() {
  const entry = { id: uid(), ts: Date.now() };
  state.water.push(entry);
  save.water();
  state.lastAdded = { type: 'water', id: entry.id };
  showToast('💧 Water logged. Good call.', true);
  render();
}

function logFood(kind, hoursAgo) {
  const entry = { id: uid(), ts: Date.now() - hoursAgo * HOUR, kind };
  state.food.push(entry);
  save.food();
  state.lastAdded = { type: 'food', id: entry.id };
  closeSheets();
  showToast(`${FOOD_KINDS[kind].emoji} ${FOOD_KINDS[kind].label} logged. Sensible.`, true);
  render();
}

function logFeeling(level) {
  const a = analyse();
  state.checkins.push({ id: uid(), ts: Date.now(), level, units: a.s.units, inSystem: a.inSystem });
  save.checkins();
  closeSheets();
  showToast(FEELINGS[level].emoji + ' ' + FEELINGS[level].label + ' — noted', false);
  render();
}

function removeItem(type, id) {
  if (type === 'drink') { state.log = state.log.filter(e => e.id !== id); save.log(); }
  if (type === 'water') { state.water = state.water.filter(e => e.id !== id); save.water(); }
  if (type === 'ended') { delete state.ended[id]; save.ended(); }
  if (type === 'food')  { state.food = state.food.filter(e => e.id !== id); save.food(); }
  if (type === 'feel')  { state.checkins = state.checkins.filter(e => e.id !== id); save.checkins(); }
  render();
}

function showToast(text, undo) {
  $('toastText').textContent = text;
  $('toastUndo').hidden = !undo;
  $('toast').hidden = false;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(hideToast, 5000);
}

function hideToast() {
  $('toast').hidden = true;
  state.lastAdded = null;
}

/* ---------------- Rendering: Now ---------------- */

const LVL_CLASS = l => (l < 0 ? 'lvl-none' : 'lvl-' + l);
const PACE_NAME = ['Steady', 'Quick', 'Too fast'];

function setLevelClass(el, level) {
  el.classList.remove('lvl-none', 'lvl-0', 'lvl-1', 'lvl-2');
  el.classList.add(LVL_CLASS(level));
}

// warn: 0 = fine, 1 = amber edge, 2 = red edge
function tile(icon, label, value, sub, warn = 0, action = '') {
  const tag = action ? 'button' : 'div';
  return `<${tag} class="tile warn-${warn}"${action ? ` data-action="${action}"` : ''}>
    <div class="tile-label">${icon} ${label}</div>
    <div class="tile-value">${value}</div>
    <div class="tile-sub">${sub}</div>
  </${tag}>`;
}

function renderNow(a) {
  const { s, n } = a;
  setLevelClass($('panel'), a.level);
  $('nowDate').textContent = 'Tonight · ' + fmtNight(a.key) + (a.ended ? ' · done at ' + fmtTime(a.ended) : '');
  $('nowDrinks').textContent = n;
  $('nowDrinksLabel').textContent = n === 1 ? 'drink' : 'drinks';
  $('nowUnits').textContent = fmtUnits(s.units);
  const G = a.goal ? GOALS[a.goal.type] : null;
  $('nowPlan').innerHTML = G
    ? `${G.emoji} ${G.label} · <b>≈${fmtPints(a.pe)} of ${a.goal.target}</b> pints${a.goal.work ? ' · 🗓' : ''}`
    : state.goals[a.key] ? '📊 Just tracking · tap to set a plan' : '🎯 Tap to plan tonight';
  const g = guidance(a);
  $('nowHeadline').textContent = g.title;

  renderMorningCard(a);
  renderCheckinCard(a);

  // ---- What now: reasons, next-drink time, buttons ----
  renderClearCard(a);

  // ---- Tomorrow + rotating nudges ----
  const showStop = n >= 2 && !a.ended;
  $('stopCard').hidden = !showStop;
  if (showStop) {
    $('stopCard').innerHTML = `<div class="tile-label">🌙 If you stop now</div>` +
      stopNowLines(a, g).map(l => `<div class="stop-line">${l}</div>`).join('');
  }
  const tm = n && !showStop ? tomorrowNudge(a) : null;
  const nudges = n ? pickNudges(a) : [];
  $('nudgeCard').hidden = !tm && !nudges.length;
  $('nudgeCard').innerHTML = [tm, ...nudges].filter(Boolean).map(x =>
    `<div class="nudge"><span class="nudge-icon">${x.icon}</span><div>${x.label ? `<div class="tile-label">${x.label}</div>` : ''}${x.text}</div></div>`).join('');

  $('guideCard').innerHTML = `
    <div class="tile-label">${a.ended ? '🌙 Before bed' : '🧭 What now'}</div>
    ${g.next ? `<div class="guide-next">${g.next}</div>` : ''}
    <ul class="guide-why">${g.reasons.map(r => `<li>${r}</li>`).join('')}</ul>
    ${g.actions.length ? `<div class="guide-actions">${g.actions.map(k =>
      `<button class="guide-btn${k === 'done' ? ' stop' : ''}" data-guide="${k}">${GUIDE_ACTIONS[k]}</button>`).join('')}</div>` : ''}`;

  $('goAdd').innerHTML = a.ended ? '<span>+</span> Add drink anyway' : '<span>+</span> Add drink';
  $('doneBtn').hidden = !n || !!a.ended || g.actions.includes('done');

  // ---- Tiles: numbers you can read at a glance ----
  const tiles = [];
  if (n) {
    tiles.push(a.ended
      ? tile('⏱️', 'Session', fmtDur(a.elapsed), `${fmtTime(a.first)}–${fmtTime(a.ended)}`)
      : tile('⏱️', 'Out for', fmtDur(a.elapsed), `since ${fmtTime(a.first)}`));
    if (!a.ended) tiles.push(tile('🍺', 'Pace', a.avgGap ? fmtDur(a.avgGap) : '—',
      a.avgGap ? `per pint · ${a.lastHour} in last hr` : 'first one\'s free', a.paceLevel));
  }
  if (a.inSystem > 0.05) {
    tiles.push(tile('🫀', 'In system', `${fmtUnits(a.inSystem)}u`, `zero ${fmtWhen(a.soberAt)}`));
  }
  if (n) {
    if (a.ended) { /* home time no longer matters */ }
    else if (a.home) {
      const left = a.home - a.now;
      tiles.push(left > 0
        ? tile('🏠', 'Home in', fmtDur(left), `by ${fmtTime(a.home)}`, left < 30 * MIN ? 1 : 0, 'home')
        : tile('🏠', 'Home time', 'Passed', `was ${fmtTime(a.home)}`, 2, 'home'));
    } else {
      tiles.push(tile('🏠', 'Home time', '—', 'tap to set', 0, 'home'));
    }
    const lf = a.lastFood;
    tiles.push(tile('🍔', 'Food', lf ? fmtAgo(a.now - lf.ts) : 'None',
      lf ? FOOD_KINDS[lf.kind].label + (a.fed ? '' : ' · wearing off') : 'get something in',
      n >= 3 && !a.fed ? (lf ? 1 : 2) : 0, 'food'));
    tiles.push(tile('💧', 'Water', String(s.water.length),
      a.drinksSinceWater >= 2 ? `${a.drinksSinceWater} drinks since` : 'glasses', a.drinksSinceWater >= 3 ? 1 : 0, 'water'));
    tiles.push(tile('💷', 'Spent', fmtMoney(s.spend), s.unpriced ? `+ ${s.unpriced} unpriced` : 'tonight'));
    tiles.push(tile('🔥', 'Calories', s.kcal.toLocaleString('en-GB'), `≈ ${(s.kcal / BIG_MAC_KCAL).toFixed(1)} Big Macs`));
  }
  $('tiles').innerHTML = tiles.join('');
  $('tiles').hidden = !tiles.length;

  // ---- One card for the words ----
  const lines = [];
  if (a.inSystem > 0.05) {
    const foodNote = a.fed
      ? "You've eaten recently, so it'll creep up a bit slower."
      : a.lastFood ? 'Your food is wearing off, so drinks will start hitting harder.'
      : 'On an empty stomach this hits harder and faster.';
    lines.push(`<p class="feel-main">${howYouMightFeel(a.inSystem)}</p><p class="feel-note">${foodNote}</p>`);
  }
  if (a.inSystem > 0.05) {
    lines.push(`<p class="feel-note">Your body clears about ${CLEAR_RATE} unit an hour. Every extra pint adds ~2½ hours.</p>`);
  }
  $('feelCard').innerHTML = `<div class="tile-label">🧠 How you might feel</div>` + lines.join('');
  $('feelCard').hidden = !lines.length;
}

// Live countdown to zero units: shown once you're done, and the morning after.
function clearLog() { return state.log.filter(e => Date.now() - e.ts < 48 * HOUR); }

function renderClearCard(a) {
  const show = (a.ended || !a.n) && a.inSystem > 0.01;
  $('clearCard').hidden = !show;
  if (!show) return;
  const log = clearLog();
  const lastTs = Math.max(...log.map(e => e.ts));
  state.clearPeak = unitsInSystem(log, lastTs);
  tickClear();
}

function tickClear() {
  const card = $('clearCard');
  if (card.hidden || state.view !== 'now') return;
  const now = Date.now();
  const left = unitsInSystem(clearLog(), now);
  if (left <= 0.0005) return render();
  const ms = (left / CLEAR_RATE) * HOUR;
  $('clearClock').textContent = fmtClock(ms);
  $('clearUnits').textContent = left.toFixed(3);
  $('clearWhen').textContent = fmtWhen(now + ms);
  $('clearFill').style.width = Math.max(2, Math.min(100, 100 * (1 - left / (state.clearPeak || left)))) + '%';
}

function renderCheckinCard(a) {
  const card = $('checkinCard');
  const every = state.settings.checkEvery;
  // Every N drinks since your last check-in (N from settings). "Not now" waits for the next N.
  const snoozed = state.snooze && state.snooze.key === a.key && a.n - state.snooze.n < every;
  const due = every > 0 && !a.ended && !snoozed && a.n >= every && a.drinksSinceCheckin >= every;
  card.hidden = !due;
  if (!due) return;
  card.innerHTML = `
    <div class="prompt-title">How are you feeling?</div>
    <div class="prompt-sub">After drink ${a.n}. One tap, and the guidance takes it into account.</div>
    <div class="prompt-faces">${FEELINGS.map((f, i) =>
      `<button data-feel="${i}">${f.emoji}<span>${f.label}</span></button>`).join('')}</div>
    <button class="prompt-skip" data-snooze="1">Not now</button>`;
}

// The most recent night (yesterday or the day before) still waiting for a morning rating.
function pendingMorning(a) {
  const today = keyToDate(a.key);
  for (let back = 1; back <= 2; back++) {
    const d = new Date(today);
    d.setDate(d.getDate() - back);
    const k = nightKey(d.getTime() + 12 * HOUR);
    if (state.mornings[k] !== undefined) return null;
    const s = nightSummary(k);
    if (s.drinks.length) return s;
  }
  return null;
}

function renderMorningCard(a) {
  const card = $('morningCard');
  const night = pendingMorning(a);
  card.hidden = !night;
  if (!night) return;
  card.innerHTML = `
    <div class="prompt-title">Morning! How's the head?</div>
    <div class="prompt-sub">After ${fmtNight(night.key)}: ${plural(night.drinks.length, 'drink')} · ${fmtUnits(night.units)} units${
      state.goals[night.key] && GOALS[state.goals[night.key].type] ? ` (planned ${state.goals[night.key].target}, had ≈${fmtPints(pintEq(night.units))})` : ''}</div>
    <div class="prompt-faces">${MORNINGS.map((m, i) =>
      `<button data-morning="${i}" data-key="${night.key}">${m.emoji}<span>${m.label}</span></button>`).join('')}</div>
    <button class="prompt-skip" data-morning="skip" data-key="${night.key}">Skip</button>`;
}

/* ---------------- Rendering: other views ---------------- */

function renderBar(a) {
  const bar = $('bar');
  bar.hidden = state.view === 'now';
  setLevelClass(bar, a.level);
  $('barMain').textContent = `${plural(a.n, 'drink')} · ${fmtUnits(a.s.units)} units`;
  $('barSub').textContent = a.n ? `out ${fmtDur(a.elapsed)}` : '';
}

function usualDrinks() {
  const counts = new Map();
  for (const e of state.log) counts.set(e.drinkId, (counts.get(e.drinkId) || 0) + 1);
  return state.library
    .filter(d => counts.has(d.id))
    .sort((a, b) => counts.get(b.id) - counts.get(a.id))
    .slice(0, 8);
}

function renderCats() {
  const usual = usualDrinks();
  const cats = [];
  if (usual.length) cats.push({ id: 'usual', label: '★ Usual' });
  cats.push(...CATS);
  if (state.library.some(d => d.custom)) cats.push({ id: 'mine', label: 'My drinks' });
  if (!state.cat || !cats.some(c => c.id === state.cat)) state.cat = usual.length ? 'usual' : 'pints';

  $('cats').innerHTML =
    cats.map(c => `<button class="cat${c.id === state.cat ? ' active' : ''}" data-cat="${c.id}">${esc(c.label)}</button>`).join('') +
    `<button class="cat edit${state.editing ? ' on' : ''}" data-edit="1">${state.editing ? 'Done' : '✎ Edit'}</button>`;
}

function drinksForCat(cat) {
  if (cat === 'usual') return usualDrinks();
  if (cat === 'mine') return state.library.filter(d => d.custom);
  return state.library.filter(d => d.cat === cat);
}

function renderGrid() {
  const drinks = drinksForCat(state.cat);
  $('grid').classList.toggle('editing', state.editing);
  $('grid').innerHTML =
    drinks.map(d => `
      <button class="drink" data-id="${esc(d.id)}">
        <span class="drink-units">${fmtUnits(unitsOf(d.ml, d.abv))}u</span>
        <span class="drink-name">${esc(d.name)}</span>
        <span class="drink-meta">${esc(sizeLabel(d))} · ${d.abv}%${d.price != null ? ' · ' + fmtMoney(d.price) : ''}</span>
      </button>`).join('') +
    `<button class="drink add" data-add="1"><span class="plus">+</span>Add your own</button>`;
  $('editHint').hidden = !state.editing;
}

function timelineRows(key, withDelete) {
  const rows = [
    ...inNight(state.log, key).map(e => ({ type: 'drink', e })),
    ...inNight(state.water, key).map(e => ({ type: 'water', e })),
    ...inNight(state.food, key).map(e => ({ type: 'food', e })),
    ...inNight(state.checkins, key).map(e => ({ type: 'feel', e })),
  ].sort((a, b) => b.e.ts - a.e.ts);

  return rows.map(({ type, e }) => {
    let name, meta, right = '', minor = false;
    if (type === 'drink') {
      name = esc(e.name);
      meta = `${esc(e.size)} · ${e.abv}%${e.price != null ? ' · ' + fmtMoney(e.price) : ''}`;
      right = `<span class="log-units">${fmtUnits(e.units)}u</span>`;
    } else if (type === 'water') {
      name = '💧 Water'; meta = 'Nice one'; minor = true;
    } else if (type === 'food') {
      name = `${FOOD_KINDS[e.kind].emoji} ${FOOD_KINDS[e.kind].label}`; meta = 'Food'; minor = true;
    } else {
      const f = FEELINGS[e.level];
      name = `${f.emoji} Feeling ${f.label.toLowerCase()}`; meta = `at ${fmtUnits(e.units)} units`; minor = true;
    }
    return `
      <li class="${minor ? 'minor' : ''}">
        <span class="log-time">${fmtTime(e.ts)}</span>
        <span class="log-main"><div class="log-name">${name}</div><div class="log-meta">${meta}</div></span>
        ${right}
        ${withDelete ? `<button class="log-del" data-del="${e.id}" data-type="${type}" aria-label="Remove">✕</button>` : ''}
      </li>`;
  }).join('');
}

function renderTonight(a) {
  const html = timelineRows(a.key, true);
  $('tonightList').innerHTML = html;
  $('tonightEmpty').hidden = !!html;
}

function renderHistory(a) {
  const keys = [...new Set(state.log.map(e => nightKey(e.ts)))].sort().reverse();
  const today = keyToDate(a.key);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  const week = keys.filter(k => keyToDate(k) >= monday).map(nightSummary);
  const wk = {
    units: sum(week, s => s.units), drinks: sum(week, s => s.drinks.length),
    spend: sum(week, s => s.spend), kcal: sum(week, s => s.kcal), days: week.length,
  };
  $('weekSummary').innerHTML = `
    <div class="week-label">This week (from Mon)</div>
    <div class="week-nums"><b>${fmtUnits(wk.units)}</b> units · ${plural(wk.drinks, 'drink')} · ${plural(wk.days, 'day')}</div>
    <div class="week-extra">💷 ${fmtMoney(wk.spend)} · 🍔 ${Math.round(wk.kcal).toLocaleString('en-GB')} kcal</div>
    <div class="week-note">UK guideline: no more than 14 units a week, spread over 3+ days.</div>`;

  // Insights
  const ins = [];
  const dp = personalDrunkPoint(null);
  if (dp) ins.push(`You usually feel <b>drunk around ${fmtUnits(dp.units)} units</b> (from ${plural(dp.nights, 'night')}).`);
  const planned = keys.filter(k => state.goals[k] && GOALS[state.goals[k].type]).map(k => ({ g: state.goals[k], s: nightSummary(k) }));
  if (planned.length) {
    const stuck = planned.filter(p => pintEq(p.s.units) <= p.g.target + PLAN_SLACK).length;
    ins.push(`Stuck to the plan on <b>${stuck} of ${plural(planned.length, 'night')}</b>.`);
    const quick = planned.filter(p => p.g.type === 'quick');
    const blown = quick.filter(p => pintEq(p.s.units) >= p.g.target + 2).length;
    if (blown) ins.push(`"Couple after work" turned into ${quick[0].g.target + 2}+ pints <b>${blown} of ${quick.length}</b> times.`);
  }
  const dpFed = personalDrunkPoint(null, true), dpEmpty = personalDrunkPoint(null, false);
  if (dpFed && dpEmpty) ins.push(`With food in you that's <b>${fmtUnits(dpFed.units)} units</b>. On an empty stomach, <b>${fmtUnits(dpEmpty.units)}</b>.`);
  const rated = keys.filter(k => typeof state.mornings[k] === 'number').map(k => ({ lvl: state.mornings[k], s: nightSummary(k) }));
  const good = rated.filter(r => r.lvl <= 1), bad = rated.filter(r => r.lvl >= 2);
  if (good.length && bad.length) {
    ins.push(`Good mornings followed nights of about <b>${fmtUnits(sum(good, r => r.s.units) / good.length)} units</b>. Rough ones followed <b>${fmtUnits(sum(bad, r => r.s.units) / bad.length)} units</b>.`);
  } else if (bad.length) {
    ins.push(`Rough mornings so far followed nights of about <b>${fmtUnits(sum(bad, r => r.s.units) / bad.length)} units</b>.`);
  }
  $('insights').hidden = !ins.length;
  $('insights').innerHTML = `<div class="week-label">What we've learned</div>` + ins.map(t => `<p>${t}</p>`).join('');

  $('historyList').innerHTML = keys.map(k => {
    const s = nightSummary(k);
    const m = state.mornings[k];
    const gl = state.goals[k] && GOALS[state.goals[k].type] ? state.goals[k] : null;
    const emojis = (gl ? GOALS[gl.type].emoji + (pintEq(s.units) <= gl.target + PLAN_SLACK ? '✅' : '❌') : '') + (s.food.length ? '🍔' : '') + (s.peakFeeling != null ? FEELINGS[s.peakFeeling].emoji : '') + (typeof m === 'number' ? MORNINGS[m].emoji : '');
    return `
      <li class="night">
        <button class="night-head" data-night="${k}">
          <span class="night-date">${fmtNight(k)}${emojis ? `<span class="night-emoji">${emojis}</span>` : ''}</span>
          <span class="night-sum">${plural(s.drinks.length, 'drink')} · <b>${fmtUnits(s.units)}u</b>${s.spend ? ' · ' + fmtMoney(s.spend) : ''}</span>
        </button>
        <ul class="night-drinks log" hidden>${timelineRows(k, true)}</ul>
      </li>`;
  }).join('');
  $('historyEmpty').hidden = keys.length > 0;

  if (document.activeElement !== $('setAmber')) $('setAmber').value = state.settings.amber;
  if (document.activeElement !== $('setRed')) $('setRed').value = state.settings.red;
  $('setCheck').value = String(state.settings.checkEvery);
}

function render() {
  const a = analyse();
  for (const v of ['now', 'add', 'tonight', 'history']) $('view-' + v).hidden = v !== state.view;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === state.view));
  renderBar(a);
  if (state.view === 'now') renderNow(a);
  if (state.view === 'add') { renderCats(); renderGrid(); }
  if (state.view === 'tonight') renderTonight(a);
  if (state.view === 'history') renderHistory(a);
}

function goTo(view, bump) {
  state.view = view;
  window.scrollTo(0, 0);
  render();
  if (bump) {
    const p = $('panel');
    p.classList.remove('bump');
    void p.offsetWidth;
    p.classList.add('bump');
  }
}

/* ---------------- Sheets ---------------- */

function renderFoodKinds() {
  $('foodKinds').innerHTML = Object.entries(FOOD_KINDS).map(([k, f]) =>
    `<button type="button" class="chip${state.foodKind === k ? ' active' : ''}" data-kind="${k}">${f.emoji} ${f.label}</button>`).join('');
}

const openSheet = id => { $(id).hidden = false; };

function closeSheets() {
  document.querySelectorAll('.sheet-backdrop').forEach(s => (s.hidden = true));
  state.sheet = null;
  if (document.activeElement) document.activeElement.blur();
}

function openDrinkSheet(mode, drink) {
  const d = drink || { name: '', abv: '', ml: 568, price: null, cat: CATS.some(c => c.id === state.cat) ? state.cat : 'pints' };
  state.sheet = { mode, id: drink ? drink.id : null, ml: d.ml, cat: d.cat, catChosen: mode === 'edit', otherMl: !SIZES.some(s => s.ml === d.ml) };

  $('sheetTitle').textContent = mode === 'edit' ? 'Edit drink' : 'Add your own';
  $('fName').value = d.name;
  $('fAbv').value = d.abv;
  $('fPrice').value = d.price != null ? d.price.toFixed(2) : '';
  $('fMl').value = state.sheet.otherMl ? d.ml : '';
  $('saveLogBtn').hidden = mode === 'edit';
  $('saveBtn').textContent = mode === 'edit' ? 'Save changes' : 'Save to library';
  $('deleteBtn').hidden = mode !== 'edit';

  renderSheetChips();
  updatePreview();
  openSheet('drinkSheet');
  if (mode === 'new') setTimeout(() => $('fName').focus(), 250);
}

function renderSheetChips() {
  const s = state.sheet;
  $('sizeChips').innerHTML =
    SIZES.map(z => `<button type="button" class="chip${!s.otherMl && s.ml === z.ml ? ' active' : ''}" data-ml="${z.ml}">${z.label}</button>`).join('') +
    `<button type="button" class="chip${s.otherMl ? ' active' : ''}" data-ml="other">Other…</button>`;
  $('fMl').hidden = !s.otherMl;
  $('catChips').innerHTML = CATS.map(c =>
    `<button type="button" class="chip${s.cat === c.id ? ' active' : ''}" data-cat="${c.id}">${c.label}</button>`).join('');
}

// Best guess at the type from the size, until you pick one yourself.
function catForMl(ml) {
  if (ml === 568) return 'pints';
  if (ml === 284) return 'halves';
  if (ml >= 275 && ml <= 500) return 'bottles';
  if (ml >= 125 && ml <= 250) return 'wine';
  return 'spirits';
}

const parseNum = v => parseFloat(String(v).replace(',', '.').replace('£', ''));

function readForm() {
  const name = $('fName').value.trim();
  const abv = parseNum($('fAbv').value);
  const ml = state.sheet.otherMl ? parseNum($('fMl').value) : state.sheet.ml;
  const p = parseNum($('fPrice').value);
  const price = p >= 0 ? Math.round(p * 100) / 100 : null;
  return { name, abv, ml, price };
}

function updatePreview() {
  const { abv, ml } = readForm();
  $('unitPreview').textContent = abv > 0 && ml > 0
    ? `${fmtUnits(unitsOf(ml, abv))} units · ~${kcalOf(state.sheet.cat, ml, abv)} kcal`
    : '— units';
}

function submitDrinkSheet(action) {
  const { name, abv, ml, price } = readForm();
  if (!name) return $('fName').focus();
  if (!(abv > 0 && abv < 100)) return $('fAbv').focus();
  if (!(ml > 0 && ml < 5000)) return $('fMl').focus();

  const s = state.sheet;
  let drink;
  if (s.mode === 'edit') {
    drink = state.library.find(d => d.id === s.id);
    const keepSize = drink.size && drink.ml === ml;
    Object.assign(drink, { name, abv, ml, price, cat: s.cat });
    if (!keepSize) delete drink.size;
  } else {
    drink = { id: 'u-' + uid(), cat: s.cat, name, abv, ml, price, custom: true };
    state.library.push(drink);
  }
  save.library();
  closeSheets();
  if (action === 'savelog') return logDrink(drink);
  showToast(s.mode === 'edit' ? 'Saved' : name + ' saved to library', false);
  render();
}

function openHomeSheet() {
  const key = nightKey(Date.now());
  const cur = state.plans[key];
  const curStr = cur ? fmtTime(cur) : null;
  $('homeChips').innerHTML = ['22:00', '23:00', '23:30', '00:00', '01:00', '02:00']
    .map(t => `<button type="button" class="chip${t === curStr ? ' active' : ''}" data-time="${t}">${t}</button>`).join('');
  $('homeTime').value = curStr || '';
  $('homeClear').hidden = !cur;
  openSheet('homeSheet');
}

function openPlanSheet() {
  const key = nightKey(Date.now());
  const cur = state.goals[key];
  const day = keyToDate(key).getDay();          // 0 Sun … 6 Sat
  const defaultWork = day >= 0 && day <= 4;     // Sun–Thu nights
  state.planDraft = cur && GOALS[cur.type]
    ? { ...cur }
    : { type: 'quick', target: GOALS.quick.target, work: defaultWork };
  renderPlanSheet();
  openSheet('planSheet');
}

function renderPlanSheet() {
  const d = state.planDraft;
  $('planOpts').innerHTML = Object.entries(GOALS).map(([k, g]) => `
    <button type="button" class="plan-opt${d.type === k ? ' active' : ''}" data-goal="${k}">
      <span class="plan-emoji">${g.emoji}</span>
      <span><b>${g.label}</b><small>${g.sub} · ~${plural(g.target, 'pint')}</small></span>
    </button>`).join('');
  $('aimVal').textContent = d.target;
  $('workToggle').classList.toggle('active', !!d.work);
  $('workToggle').textContent = d.work ? '🗓 Work tomorrow: yes' : '🗓 Work tomorrow: no';
}

function savePlan(type) {
  const key = nightKey(Date.now());
  state.goals[key] = type === 'none' ? { type: 'none' } : { ...state.planDraft };
  save.goals();
  closeSheets();
  if (type !== 'none') showToast(`${GOALS[state.planDraft.type].emoji} Plan set: ${plural(state.planDraft.target, 'pint')}.`, false);
  render();
}

function setHome(hhmm) {
  const key = nightKey(Date.now());
  if (hhmm) state.plans[key] = homeTimeToTs(key, hhmm);
  else delete state.plans[key];
  save.plans();
  closeSheets();
  if (hhmm) showToast('🏠 Home by ' + hhmm + '. Hold yourself to it.', false);
  render();
}

/* ---------------- Backup ---------------- */

async function exportData() {
  const data = JSON.stringify({
    app: 'drink-tracker', version: DB_VERSION, exported: new Date().toISOString(),
    library: state.library, log: state.log, water: state.water, food: state.food, checkins: state.checkins,
    mornings: state.mornings, plans: state.plans, ended: state.ended, goals: state.goals, settings: state.settings,
  }, null, 2);
  const name = 'drink-tracker-' + new Date().toISOString().slice(0, 10) + '.json';
  const file = new File([data], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Drink Tracker backup' }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.log) || !Array.isArray(data.library)) throw new Error('bad file');
      const mergeById = (target, incoming) => {
        const ids = new Set(target.map(x => x.id));
        let n = 0;
        for (const x of incoming || []) if (x && x.id && !ids.has(x.id)) { target.push(x); n++; }
        return n;
      };
      const added = mergeById(state.log, data.log);
      mergeById(state.library, data.library);
      mergeById(state.water, data.water);
      mergeById(state.food, data.food);
      mergeById(state.checkins, data.checkins);
      state.mornings = { ...(data.mornings || {}), ...state.mornings };
      state.plans = { ...(data.plans || {}), ...state.plans };
      state.ended = { ...(data.ended || {}), ...state.ended };
      state.goals = { ...(data.goals || {}), ...state.goals };
      Object.values(save).forEach(f => f());
      showToast('Imported ' + plural(added, 'drink'), false);
      render();
    } catch {
      alert("That file doesn't look like a Drink Tracker backup.");
    }
  };
  reader.readAsText(file);
}

/* ---------------- Events ---------------- */

function bind() {
  document.querySelector('.tabs').addEventListener('click', e => {
    const b = e.target.closest('.tab');
    if (b) goTo(b.dataset.view);
  });

  // Now screen
  $('goAdd').addEventListener('click', () => goTo('add'));
  $('doneBtn').addEventListener('click', () => setDone(true));
  const closeHold = () => { clearInterval(state.holdTimer); state.pendingDrink = null; closeSheets(); };
  $('holdWater').addEventListener('click', () => { closeHold(); goTo('now'); logWater(); });
  $('holdDone').addEventListener('click', () => { closeHold(); setDone(true); });
  $('holdAnyway').addEventListener('click', () => {
    const d = state.pendingDrink;
    closeHold();
    if (d) logDrink(d, true);
  });
  $('nowPlan').addEventListener('click', openPlanSheet);
  $('planOpts').addEventListener('click', e => {
    const b = e.target.closest('[data-goal]');
    if (!b) return;
    state.planDraft.type = b.dataset.goal;
    state.planDraft.target = GOALS[b.dataset.goal].target;
    renderPlanSheet();
  });
  $('aimMinus').addEventListener('click', () => { state.planDraft.target = Math.max(1, state.planDraft.target - 1); renderPlanSheet(); });
  $('aimPlus').addEventListener('click', () => { state.planDraft.target = Math.min(20, state.planDraft.target + 1); renderPlanSheet(); });
  $('workToggle').addEventListener('click', () => { state.planDraft.work = !state.planDraft.work; renderPlanSheet(); });
  $('planSave').addEventListener('click', () => savePlan(state.planDraft.type));
  $('planSkip').addEventListener('click', () => savePlan('none'));
  $('guideCard').addEventListener('click', e => {
    const b = e.target.closest('[data-guide]');
    if (!b) return;
    const k = b.dataset.guide;
    if (k === 'water') logWater();
    if (k === 'food') $('foodBtn').click();
    if (k === 'home') openHomeSheet();
    if (k === 'plan') openPlanSheet();
    if (k === 'halves') { state.cat = 'halves'; goTo('add'); }
    if (k === 'done') setDone(true);
    if (k === 'undone') setDone(false);
  });
  $('setCheck').addEventListener('change', e => {
    state.settings.checkEvery = Number(e.target.value);
    save.settings();
  });
  $('waterBtn').addEventListener('click', logWater);
  $('foodBtn').addEventListener('click', () => {
    state.foodKind = 'meal';
    renderFoodKinds();
    openSheet('foodSheet');
  });
  $('foodKinds').addEventListener('click', e => {
    const b = e.target.closest('[data-kind]');
    if (b) { state.foodKind = b.dataset.kind; renderFoodKinds(); }
  });
  $('foodWhen').addEventListener('click', e => {
    const b = e.target.closest('[data-ago]');
    if (b) logFood(state.foodKind, Number(b.dataset.ago));
  });
  $('feelBtn').addEventListener('click', () => openSheet('feelSheet'));
  $('homeBtn').addEventListener('click', openHomeSheet);
  $('checkinCard').addEventListener('click', e => {
    if (e.target.closest('[data-snooze]')) {
      const a = analyse();
      state.snooze = { key: a.key, n: a.n };
      store.set('snooze', state.snooze);
      return render();
    }
    const b = e.target.closest('[data-feel]');
    if (b) logFeeling(Number(b.dataset.feel));
  });
  $('tiles').addEventListener('click', e => {
    const b = e.target.closest('[data-action]');
    if (!b) return;
    if (b.dataset.action === 'home') openHomeSheet();
    if (b.dataset.action === 'food') $('foodBtn').click();
    if (b.dataset.action === 'water') logWater();
  });
  $('morningCard').addEventListener('click', e => {
    const b = e.target.closest('[data-morning]');
    if (!b) return;
    const v = b.dataset.morning;
    state.mornings[b.dataset.key] = v === 'skip' ? 'skip' : Number(v);
    save.mornings();
    if (v !== 'skip') showToast(MORNINGS[Number(v)].emoji + ' Noted. Drink some water.', false);
    render();
  });

  $('feelFaces').innerHTML = FEELINGS.map((f, i) =>
    `<button data-feel="${i}">${f.emoji}<span>${f.label}<small>${f.sub}</small></span></button>`).join('');
  $('feelFaces').addEventListener('click', e => {
    const b = e.target.closest('[data-feel]');
    if (b) logFeeling(Number(b.dataset.feel));
  });

  // Home time
  $('homeChips').addEventListener('click', e => {
    const b = e.target.closest('[data-time]');
    if (b) setHome(b.dataset.time);
  });
  $('homeSave').addEventListener('click', () => { if ($('homeTime').value) setHome($('homeTime').value); });
  $('homeClear').addEventListener('click', () => setHome(null));

  // Add screen
  $('cats').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.edit) state.editing = !state.editing;
    else state.cat = b.dataset.cat;
    renderCats(); renderGrid();
  });
  $('grid').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.add) return openDrinkSheet('new');
    const drink = state.library.find(d => d.id === b.dataset.id);
    if (!drink) return;
    if (state.editing) openDrinkSheet('edit', drink);
    else logDrink(drink);
  });

  $('toastUndo').addEventListener('click', () => {
    if (state.lastAdded) removeItem(state.lastAdded.type, state.lastAdded.id);
    hideToast();
  });

  // Lists
  const onListClick = e => {
    const del = e.target.closest('[data-del]');
    if (del) {
      const type = del.dataset.type;
      const src = { drink: state.log, water: state.water, food: state.food, feel: state.checkins }[type];
      const item = src.find(x => x.id === del.dataset.del);
      if (!item) return;
      const label = type === 'drink' ? item.name : type === 'feel' ? 'check-in' : type;
      if (confirm(`Remove ${label} (${fmtTime(item.ts)})?`)) removeItem(type, item.id);
      return;
    }
    const head = e.target.closest('.night-head');
    if (head) head.nextElementSibling.hidden = !head.nextElementSibling.hidden;
  };
  $('tonightList').addEventListener('click', onListClick);
  $('historyList').addEventListener('click', onListClick);

  // Sheets
  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeSheets));
  document.querySelectorAll('.sheet-backdrop').forEach(bd =>
    bd.addEventListener('click', e => { if (e.target === bd) closeSheets(); }));
  $('sizeChips').addEventListener('click', e => {
    const b = e.target.closest('[data-ml]');
    if (!b) return;
    if (b.dataset.ml === 'other') {
      state.sheet.otherMl = true;
      renderSheetChips();
      $('fMl').focus();
    } else {
      state.sheet.otherMl = false;
      state.sheet.ml = Number(b.dataset.ml);
      if (!state.sheet.catChosen) state.sheet.cat = catForMl(state.sheet.ml);
      renderSheetChips();
    }
    updatePreview();
  });
  $('catChips').addEventListener('click', e => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    state.sheet.cat = b.dataset.cat;
    state.sheet.catChosen = true;
    renderSheetChips();
    updatePreview();
  });
  ['fAbv', 'fMl'].forEach(id => $(id).addEventListener('input', updatePreview));
  $('drinkForm').addEventListener('submit', e => {
    e.preventDefault();
    const action = (e.submitter && e.submitter.dataset.action) || (state.sheet.mode === 'edit' ? 'save' : 'savelog');
    submitDrinkSheet(action);
  });
  $('deleteBtn').addEventListener('click', () => {
    const d = state.library.find(x => x.id === state.sheet.id);
    if (!d || !confirm('Remove ' + d.name + ' from your library? Past drinks stay in your history.')) return;
    state.library = state.library.filter(x => x.id !== d.id);
    save.library();
    closeSheets();
    render();
  });

  // Settings
  const onSetting = () => {
    const amber = parseNum($('setAmber').value);
    const red = parseNum($('setRed').value);
    if (amber > 0 && red > amber) {
      state.settings = { ...state.settings, amber, red };
      save.settings();
      renderBar(analyse());
    } else {
      $('setAmber').value = state.settings.amber;
      $('setRed').value = state.settings.red;
    }
  };
  $('setAmber').addEventListener('change', onSetting);
  $('setRed').addEventListener('change', onSetting);

  // Backup
  $('exportBtn').addEventListener('click', exportData);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', e => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });

  // Keep times fresh and catch the 6am rollover
  setInterval(() => { if (state.view !== 'history') render(); }, 30000);
  setInterval(tickClear, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
}

/* ---------------- Boot ---------------- */

loadData();
bind();
render();
// Only animate colour changes after the first paint, so it opens on the right colour.
requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.add('ready')));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
