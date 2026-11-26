'use strict';

/* =========================================================
   Drink Tracker — tap a drink, it's logged. All data stays
   on this device (localStorage). A "night" runs 6am → 6am.
   ========================================================= */

const NIGHT_ROLLOVER_HOUR = 6;
const CLEAR_RATE = 1;          // units the body clears per hour (UK rule of thumb)
const KCAL_PER_UNIT = 56;      // 8g alcohol × 7 kcal
const BIG_MAC_KCAL = 563;
const DB_VERSION = 2;

const CATS = [
  { id: 'pints',     label: 'Pints' },
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

const DEFAULT_SETTINGS = { amber: 6, red: 10 };

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
  checkins: [],     // { id, ts, level, units }
  mornings: {},     // nightKey -> level | 'skip'
  plans: {},        // nightKey -> home-time timestamp
  settings: { ...DEFAULT_SETTINGS },
  cat: null,
  editing: false,
  view: 'now',
  sheet: null,
  lastAdded: null,  // { type: 'drink'|'water', id }
  toastTimer: null,
};

function loadData() {
  state.log = store.get('log', []);
  state.water = store.get('water', []);
  state.checkins = store.get('checkins', []);
  state.mornings = store.get('mornings', {});
  state.plans = store.get('plans', {});
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
  checkins: () => store.set('checkins', state.checkins),
  mornings: () => store.set('mornings', state.mornings),
  plans: () => store.set('plans', state.plans),
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
  const extra = { pints: ml * 0.14, bottles: ml * 0.14, wine: ml * 0.2, shots: 15, spirits: 80, cocktails: 130 }[cat] || 0;
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

function unitsLevel(units) {
  if (units >= state.settings.red) return 2;
  if (units >= state.settings.amber) return 1;
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
function personalDrunkPoint(excludeKey) {
  const byNight = new Map();
  for (const c of [...state.checkins].sort((a, b) => a.ts - b.ts)) {
    const k = nightKey(c.ts);
    if (k === excludeKey || c.level < DRUNK_LEVEL || byNight.has(k)) continue;
    byNight.set(k, c.units);
  }
  const vals = [...byNight.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 5).map(x => x[1]);
  if (!vals.length) return null;
  return { units: sum(vals, x => x) / vals.length, nights: vals.length };
}

function nightSummary(key) {
  const drinks = inNight(state.log, key);
  const water = inNight(state.water, key);
  const checkins = inNight(state.checkins, key);
  return {
    key, drinks, water, checkins,
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
  const elapsed = n ? now - first : 0;
  const lastHour = s.drinks.filter(e => now - e.ts <= HOUR).length;
  const avgGap = n >= 2 ? elapsed / n : null;

  // Pace: faster than one drink an hour goes amber; 3+ in an hour goes red.
  let paceLevel = 0;
  if (lastHour >= 3) paceLevel = 2;
  else if (lastHour === 2 || (n >= 3 && avgGap < 45 * MIN)) paceLevel = 1;

  const uLevel = unitsLevel(s.units);
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
  const drunkPoint = personalDrunkPoint(key);

  return { now, key, s, n, first, last, elapsed, lastHour, avgGap, paceLevel, uLevel, level,
           inSystem, soberAt, drinksSinceWater, lastCheckin, drinksSinceCheckin, home, drunkPoint };
}

function headline(a) {
  const { n, s, now } = a;
  if (!n) return a.inSystem > 0.5 ? 'Still some of last night in you. Take it easy.' : 'Nothing yet. Enjoy it.';
  if (a.home && now > a.home) return "It's past your home time. Time to go.";
  if (s.units >= state.settings.red * 1.5) return 'Way past your limit. Water, then home.';
  if (a.uLevel === 2) return "That's a lot. Time to call it a night.";
  if (a.drunkPoint && s.units >= a.drunkPoint.units - 0.5) return 'This is about where you usually get drunk. Ease off.';
  if (a.paceLevel === 2) return `${a.lastHour} in the last hour. Slow right down.`;
  if (a.drinksSinceWater >= 3) return 'Have a water before the next one.';
  if (a.uLevel === 1) return 'Steady on. Slow the pace.';
  if (a.paceLevel === 1) return 'Faster than one an hour. Ease off a bit.';
  if (now - a.last < 15 * MIN) return 'Make this one last.';
  return "You're doing fine. Keep it steady.";
}

/* ---------------- Logging ---------------- */

function logDrink(drink) {
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
}

function logWater() {
  const entry = { id: uid(), ts: Date.now() };
  state.water.push(entry);
  save.water();
  state.lastAdded = { type: 'water', id: entry.id };
  showToast('💧 Water logged. Good call.', true);
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

function fact(icon, title, main, sub) {
  return `<li class="fact"><span class="fact-icon">${icon}</span><div class="fact-body">
    <div class="fact-title">${title}</div><div class="fact-main">${main}</div>${sub ? `<div class="fact-sub">${sub}</div>` : ''}</div></li>`;
}

function renderNow(a) {
  const { s, n } = a;
  setLevelClass($('panel'), a.level);
  $('nowDate').textContent = 'Tonight · ' + fmtNight(a.key);
  $('nowDrinks').textContent = n;
  $('nowDrinksLabel').textContent = n === 1 ? 'drink' : 'drinks';
  $('nowUnits').textContent = fmtUnits(s.units);
  $('nowHeadline').textContent = headline(a);

  renderMorningCard(a);
  renderCheckinCard(a);

  const facts = [];
  if (n) {
    facts.push(fact('⏱️', 'Time out', `Out for ${fmtDur(a.elapsed)}`,
      `Started ${fmtTime(a.first)} · last drink ${fmtAgo(a.now - a.last)}`));
    facts.push(fact('🍺', 'Pace',
      `${a.avgGap ? '1 drink every ' + fmtDur(a.avgGap) : 'Just getting started'}<span class="tag ${LVL_CLASS(a.paceLevel)}">${PACE_NAME[a.paceLevel]}</span>`,
      `${plural(a.lastHour, 'drink')} in the last hour. Your body only clears about 1 unit an hour.`));
  }

  if (a.inSystem > 0.05) {
    facts.push(fact('🫀', 'In your system',
      `~${fmtUnits(a.inSystem)} units · zero by ${fmtWhen(a.soberAt)}`,
      `Your body clears roughly ${CLEAR_RATE} unit an hour, so about ${fmtDur((a.inSystem / CLEAR_RATE) * HOUR)} if you stopped now. Every extra pint adds ~2½ hours.`));
    facts.push(fact('🧠', 'How you might feel', howYouMightFeel(a.inSystem),
      'Typical effects — food, sleep, weight and mood all change it.'));
  }

  if (a.drunkPoint) {
    const gap = a.drunkPoint.units - s.units;
    const where = gap > 0.5 ? `You're about ${fmtUnits(gap)} units away.` : "You're there now.";
    facts.push(fact('📍', 'Your tipping point',
      `You usually feel drunk around ${fmtUnits(a.drunkPoint.units)} units`,
      `Based on ${plural(a.drunkPoint.nights, 'night')} of check-ins. ${where}`));
  }

  if (a.lastCheckin) {
    const f = FEELINGS[a.lastCheckin.level];
    facts.push(fact(f.emoji, 'Last check-in', `${f.label} at ${fmtTime(a.lastCheckin.ts)}`,
      `You'd had ${fmtUnits(a.lastCheckin.units)} units then.`));
  }

  if (a.home) {
    if (a.now < a.home) {
      let sub = '';
      if (a.avgGap && n >= 2) {
        const more = Math.floor((a.home - a.now) / a.avgGap);
        sub = `At this pace that's ~${plural(more, 'more drink')}, finishing on ~${fmtUnits(s.units + more * (s.units / n))} units.`;
      }
      facts.push(fact('🏠', 'Home time', `Home by ${fmtTime(a.home)} · ${fmtDur(a.home - a.now)} to go`, sub));
    } else {
      facts.push(fact('🏠', 'Home time', `Home time was ${fmtTime(a.home)}`, `That was ${fmtAgo(a.now - a.home)}. Get your coat.`));
    }
  }

  if (n) {
    facts.push(fact('💷', 'Spent', fmtMoney(s.spend) + (s.unpriced ? ` <span class="fact-sub">+ ${s.unpriced} unpriced</span>` : ''),
      s.unpriced ? 'Set prices in Add → ✎ Edit.' : 'Based on the prices in your library.'));
    facts.push(fact('🍔', 'Calories', `${s.kcal.toLocaleString('en-GB')} kcal`,
      `About ${(s.kcal / BIG_MAC_KCAL).toFixed(1)} Big Macs' worth.`));
  }
  if (n || s.water.length) {
    const ws = s.water.length;
    facts.push(fact('💧', 'Water', ws ? plural(ws, 'glass', 'glasses') : 'None yet',
      a.drinksSinceWater >= 2 ? `${plural(a.drinksSinceWater, 'drink')} since your last water.` : ''));
  }

  $('facts').innerHTML = facts.join('');
}

function renderCheckinCard(a) {
  const card = $('checkinCard');
  const due = a.n >= 2 && a.drinksSinceCheckin >= (a.lastCheckin ? 3 : 2);
  card.hidden = !due;
  if (!due) return;
  card.innerHTML = `
    <div class="prompt-title">Quick check: how are you feeling?</div>
    <div class="prompt-sub">One tap. It teaches the app where your tipping point is.</div>
    <div class="prompt-faces">${FEELINGS.map((f, i) =>
      `<button data-feel="${i}">${f.emoji}<span>${f.label}</span></button>`).join('')}</div>`;
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
    <div class="prompt-sub">After ${fmtNight(night.key)}: ${plural(night.drinks.length, 'drink')} · ${fmtUnits(night.units)} units</div>
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
    const emojis = (s.peakFeeling != null ? FEELINGS[s.peakFeeling].emoji : '') + (typeof m === 'number' ? MORNINGS[m].emoji : '');
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
  if (ml === 568 || ml === 284) return 'pints';
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
    library: state.library, log: state.log, water: state.water, checkins: state.checkins,
    mornings: state.mornings, plans: state.plans, settings: state.settings,
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
      mergeById(state.checkins, data.checkins);
      state.mornings = { ...(data.mornings || {}), ...state.mornings };
      state.plans = { ...(data.plans || {}), ...state.plans };
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
  $('waterBtn').addEventListener('click', logWater);
  $('feelBtn').addEventListener('click', () => openSheet('feelSheet'));
  $('homeBtn').addEventListener('click', openHomeSheet);
  $('checkinCard').addEventListener('click', e => {
    const b = e.target.closest('[data-feel]');
    if (b) logFeeling(Number(b.dataset.feel));
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
      const src = { drink: state.log, water: state.water, feel: state.checkins }[type];
      const item = src.find(x => x.id === del.dataset.del);
      if (!item) return;
      const label = type === 'drink' ? item.name : type === 'water' ? 'water' : 'check-in';
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
      state.settings = { amber, red };
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
