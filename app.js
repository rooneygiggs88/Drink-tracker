'use strict';

/* =========================================================
   Drink Tracker — tap a drink, it's logged. All data stays
   on this device (localStorage). A "night" runs 6am → 6am.
   ========================================================= */

const NIGHT_ROLLOVER_HOUR = 6;
const DB_VERSION = 1;

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

// ABVs are typical UK figures — editable in the app if your pub differs.
const DEFAULT_LIBRARY = [
  // Pints (568ml)
  { id: 'p-guinness',    cat: 'pints', name: 'Guinness',        abv: 4.2, ml: 568 },
  { id: 'p-stella',      cat: 'pints', name: 'Stella Artois',   abv: 4.6, ml: 568 },
  { id: 'p-peroni',      cat: 'pints', name: 'Peroni',          abv: 5.0, ml: 568 },
  { id: 'p-moretti',     cat: 'pints', name: 'Birra Moretti',   abv: 4.6, ml: 568 },
  { id: 'p-staropramen', cat: 'pints', name: 'Staropramen',     abv: 4.0, ml: 568 },
  { id: 'p-madri',       cat: 'pints', name: 'Madrí',           abv: 4.6, ml: 568 },
  { id: 'p-camden',      cat: 'pints', name: 'Camden Hells',    abv: 4.6, ml: 568 },
  { id: 'p-carling',     cat: 'pints', name: 'Carling',         abv: 3.7, ml: 568 },
  { id: 'p-asahi',       cat: 'pints', name: 'Asahi',           abv: 5.2, ml: 568 },
  { id: 'p-ipa',         cat: 'pints', name: 'IPA / Pale ale',  abv: 5.5, ml: 568 },
  { id: 'p-strongbow',   cat: 'pints', name: 'Strongbow',       abv: 4.5, ml: 568 },
  { id: 'p-thatchers',   cat: 'pints', name: 'Thatchers Gold',  abv: 4.8, ml: 568 },

  // Bottles & cans
  { id: 'b-bud',         cat: 'bottles', name: 'Budweiser',     abv: 4.5, ml: 330 },
  { id: 'b-corona',      cat: 'bottles', name: 'Corona',        abv: 4.5, ml: 330 },
  { id: 'b-peroni',      cat: 'bottles', name: 'Peroni',        abv: 5.1, ml: 330 },
  { id: 'b-moretti',     cat: 'bottles', name: 'Birra Moretti', abv: 4.6, ml: 330 },
  { id: 'b-stella',      cat: 'bottles', name: 'Stella Artois', abv: 4.6, ml: 330 },
  { id: 'b-heineken',    cat: 'bottles', name: 'Heineken',      abv: 5.0, ml: 330 },
  { id: 'b-sol',         cat: 'bottles', name: 'Sol',           abv: 4.5, ml: 330 },
  { id: 'b-desperados',  cat: 'bottles', name: 'Desperados',    abv: 5.9, ml: 330 },
  { id: 'b-guinness',    cat: 'bottles', name: 'Guinness can',  abv: 4.2, ml: 440 },
  { id: 'b-kopparberg',  cat: 'bottles', name: 'Kopparberg',    abv: 4.0, ml: 500 },
  { id: 'b-magners',     cat: 'bottles', name: 'Magners',       abv: 4.5, ml: 568 },

  // Wine
  { id: 'w-small',       cat: 'wine', name: 'Wine (small)',     abv: 12,  ml: 125 },
  { id: 'w-medium',      cat: 'wine', name: 'Wine (medium)',    abv: 12,  ml: 175 },
  { id: 'w-large',       cat: 'wine', name: 'Wine (large)',     abv: 12,  ml: 250 },
  { id: 'w-prosecco',    cat: 'wine', name: 'Prosecco',         abv: 11,  ml: 125 },
  { id: 'w-bottle',      cat: 'wine', name: 'Bottle of wine',   abv: 12,  ml: 750 },

  // Shots
  { id: 's-tequila',     cat: 'shots', name: 'Tequila',         abv: 38,   ml: 25 },
  { id: 's-jagerbomb',   cat: 'shots', name: 'Jägerbomb',       abv: 35,   ml: 25 },
  { id: 's-sambuca',     cat: 'shots', name: 'Sambuca',         abv: 38,   ml: 25 },
  { id: 's-vodka',       cat: 'shots', name: 'Vodka shot',      abv: 37.5, ml: 25 },
  { id: 's-fireball',    cat: 'shots', name: 'Fireball',        abv: 33,   ml: 25 },
  { id: 's-baby',        cat: 'shots', name: 'Baby Guinness',   abv: 20,   ml: 25 },

  // Spirits & mixers
  { id: 'x-vodka1',      cat: 'spirits', name: 'Vodka & mixer',   abv: 37.5, ml: 25 },
  { id: 'x-vodka2',      cat: 'spirits', name: 'Double vodka',    abv: 37.5, ml: 50 },
  { id: 'x-gin1',        cat: 'spirits', name: 'Gin & tonic',     abv: 37.5, ml: 25 },
  { id: 'x-gin2',        cat: 'spirits', name: 'Double G&T',      abv: 37.5, ml: 50 },
  { id: 'x-rum',         cat: 'spirits', name: 'Rum & coke',      abv: 37.5, ml: 25 },
  { id: 'x-jd',          cat: 'spirits', name: 'JD & coke',       abv: 40,   ml: 25 },
  { id: 'x-whisky',      cat: 'spirits', name: 'Whisky',          abv: 40,   ml: 25 },

  // Cocktails (whole drink, approximate)
  { id: 'c-pornstar',    cat: 'cocktails', name: 'Pornstar martini', abv: 15,  ml: 150, size: 'Cocktail' },
  { id: 'c-espresso',    cat: 'cocktails', name: 'Espresso martini', abv: 20,  ml: 100, size: 'Cocktail' },
  { id: 'c-mojito',      cat: 'cocktails', name: 'Mojito',           abv: 9,   ml: 200, size: 'Cocktail' },
  { id: 'c-margarita',   cat: 'cocktails', name: 'Margarita',        abv: 20,  ml: 100, size: 'Cocktail' },
  { id: 'c-aperol',      cat: 'cocktails', name: 'Aperol spritz',    abv: 5.6, ml: 250, size: 'Cocktail' },
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
    catch (e) { alert('Could not save — storage may be full or blocked.'); }
  },
};

const state = {
  library: [],
  log: [],
  cat: null,
  editing: false,
  view: 'add',
  sheet: null,        // { mode: 'new'|'edit', id, ml, cat }
  lastAddedId: null,
  toastTimer: null,
};

function loadData() {
  state.log = store.get('log', []);
  let library = store.get('library', null);
  const seen = new Set(store.get('seenDefaults', []));

  if (!library) library = [];
  // Add any built-in drinks we haven't offered before (lets us grow the
  // library in future versions without resurrecting ones you removed).
  for (const d of DEFAULT_LIBRARY) {
    if (!seen.has(d.id)) {
      if (!library.some(x => x.id === d.id)) library.push({ ...d });
      seen.add(d.id);
    }
  }
  state.library = library;
  store.set('library', library);
  store.set('seenDefaults', [...seen]);
  store.set('version', DB_VERSION);
}

const saveLibrary = () => store.set('library', state.library);
const saveLog = () => store.set('log', state.log);

/* ---------------- Helpers ---------------- */

const $ = id => document.getElementById(id);
const unitsOf = (ml, abv) => (ml * abv) / 1000;
const fmtUnits = u => (Math.round(u * 10) / 10).toFixed(1);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function sizeLabel(item) {
  if (item.size) return item.size;
  const s = SIZES.find(s => s.ml === item.ml);
  if (s) return s.label;
  return item.ml + 'ml';
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function nightKey(ts) {
  const d = new Date(ts - NIGHT_ROLLOVER_HOUR * 3600e3);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function fmtNight(key) {
  return keyToDate(key).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function fmtAgo(ms) {
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + ' min ago';
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h + 'h' + (r ? ' ' + r + 'm' : '') + ' ago';
}

function tonightEntries() {
  const k = nightKey(Date.now());
  return state.log.filter(e => nightKey(e.ts) === k).sort((a, b) => a.ts - b.ts);
}

function usualDrinks() {
  const counts = new Map();
  for (const e of state.log) counts.set(e.drinkId, (counts.get(e.drinkId) || 0) + 1);
  return state.library
    .filter(d => counts.has(d.id))
    .sort((a, b) => counts.get(b.id) - counts.get(a.id))
    .slice(0, 8);
}

/* ---------------- Logging ---------------- */

function logDrink(drink, btn) {
  const entry = {
    id: uid(),
    drinkId: drink.id,
    name: drink.name,
    abv: drink.abv,
    ml: drink.ml,
    size: sizeLabel(drink),
    units: unitsOf(drink.ml, drink.abv),
    ts: Date.now(),
  };
  state.log.push(entry);
  saveLog();
  state.lastAddedId = entry.id;

  if (btn) {
    btn.classList.remove('flash');
    void btn.offsetWidth;
    btn.classList.add('flash');
  }
  const stats = $('stats');
  stats.classList.remove('bump');
  void stats.offsetWidth;
  stats.classList.add('bump');

  showToast(drink.name + ' added');
  renderStats();
  if (state.view !== 'add') renderView();
}

function removeEntry(id) {
  state.log = state.log.filter(e => e.id !== id);
  saveLog();
  renderStats();
  renderView();
}

function showToast(text) {
  $('toastText').textContent = text;
  $('toast').hidden = false;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(hideToast, 5000);
}

function hideToast() {
  $('toast').hidden = true;
  state.lastAddedId = null;
}

/* ---------------- Rendering ---------------- */

function renderStats() {
  const entries = tonightEntries();
  const units = entries.reduce((s, e) => s + e.units, 0);
  $('statDrinks').textContent = entries.length;
  $('statUnits').textContent = fmtUnits(units);
  $('nightLabel').textContent = 'Tonight · ' + fmtNight(nightKey(Date.now()));

  const badge = $('tonightBadge');
  badge.hidden = entries.length === 0;
  badge.textContent = entries.length;

  if (!entries.length) {
    $('statSub').textContent = 'Nothing logged yet';
  } else {
    const first = entries[0].ts;
    const last = entries[entries.length - 1].ts;
    $('statSub').textContent = 'Last drink ' + fmtAgo(Date.now() - last) + ' · started ' + fmtTime(first);
  }
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
        <span class="drink-meta">${esc(sizeLabel(d))} · ${d.abv}%</span>
      </button>`).join('') +
    `<button class="drink add" data-add="1"><span class="plus">+</span>Add your own</button>`;
  $('editHint').hidden = !state.editing;
}

function entryRow(e, withDelete) {
  return `
    <li>
      <span class="log-time">${fmtTime(e.ts)}</span>
      <span class="log-main">
        <div class="log-name">${esc(e.name)}</div>
        <div class="log-meta">${esc(e.size)} · ${e.abv}%</div>
      </span>
      <span class="log-units">${fmtUnits(e.units)}u</span>
      ${withDelete ? `<button class="log-del" data-del="${esc(e.id)}" aria-label="Remove">✕</button>` : ''}
    </li>`;
}

function renderTonight() {
  const entries = tonightEntries().reverse();
  $('tonightList').innerHTML = entries.map(e => entryRow(e, true)).join('');
  $('tonightEmpty').hidden = entries.length > 0;
}

function renderHistory() {
  const nights = new Map();
  for (const e of state.log) {
    const k = nightKey(e.ts);
    if (!nights.has(k)) nights.set(k, []);
    nights.get(k).push(e);
  }
  const keys = [...nights.keys()].sort().reverse();

  // This week, Monday → Sunday (by night)
  const today = keyToDate(nightKey(Date.now()));
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  let wkDrinks = 0, wkUnits = 0, wkNights = 0;
  for (const k of keys) {
    if (keyToDate(k) >= monday) {
      wkNights++;
      for (const e of nights.get(k)) { wkDrinks++; wkUnits += e.units; }
    }
  }
  $('weekSummary').innerHTML = `
    <div class="week-label">This week (from Mon)</div>
    <div class="week-nums"><b>${fmtUnits(wkUnits)}</b> units · ${wkDrinks} drinks · ${wkNights} ${wkNights === 1 ? 'day' : 'days'}</div>
    <div class="week-note">UK guideline: no more than 14 units a week, spread over 3+ days.</div>`;

  $('historyList').innerHTML = keys.map(k => {
    const es = nights.get(k).sort((a, b) => a.ts - b.ts);
    const u = es.reduce((s, e) => s + e.units, 0);
    return `
      <li class="night">
        <button class="night-head" data-night="${k}">
          <span class="night-date">${fmtNight(k)}</span>
          <span class="night-sum">${es.length} drinks · <b>${fmtUnits(u)}u</b></span>
        </button>
        <ul class="night-drinks" hidden>${es.map(e => entryRow(e, true)).join('')}</ul>
      </li>`;
  }).join('');
  $('historyEmpty').hidden = keys.length > 0;
}

function renderView() {
  for (const v of ['add', 'tonight', 'history']) $('view-' + v).hidden = v !== state.view;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === state.view));
  if (state.view === 'add') { renderCats(); renderGrid(); }
  if (state.view === 'tonight') renderTonight();
  if (state.view === 'history') renderHistory();
}

/* ---------------- Drink sheet (add / edit) ---------------- */

function openSheet(mode, drink) {
  const d = drink || { name: '', abv: '', ml: 568, cat: CATS.some(c => c.id === state.cat) ? state.cat : 'pints' };
  state.sheet = { mode, id: drink ? drink.id : null, ml: d.ml, cat: d.cat, catChosen: mode === 'edit', otherMl: !SIZES.some(s => s.ml === d.ml) };

  $('sheetTitle').textContent = mode === 'edit' ? 'Edit drink' : 'Add your own';
  $('fName').value = d.name;
  $('fAbv').value = d.abv;
  $('fMl').value = state.sheet.otherMl ? d.ml : '';
  $('saveLogBtn').hidden = mode === 'edit';
  $('saveBtn').textContent = mode === 'edit' ? 'Save changes' : 'Save to library';
  $('deleteBtn').hidden = mode !== 'edit';

  renderSheetChips();
  updatePreview();
  $('sheetBackdrop').hidden = false;
  if (mode === 'new') setTimeout(() => $('fName').focus(), 250);
}

function closeSheet() {
  $('sheetBackdrop').hidden = true;
  state.sheet = null;
  document.activeElement && document.activeElement.blur();
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

function readForm() {
  const name = $('fName').value.trim();
  const abv = parseFloat($('fAbv').value.replace(',', '.'));
  const ml = state.sheet.otherMl ? parseFloat($('fMl').value) : state.sheet.ml;
  return { name, abv, ml };
}

function updatePreview() {
  const { abv, ml } = readForm();
  $('unitPreview').textContent = abv > 0 && ml > 0 ? fmtUnits(unitsOf(ml, abv)) + ' units each' : '— units';
}

function submitSheet(action) {
  const { name, abv, ml } = readForm();
  if (!name) return $('fName').focus();
  if (!(abv > 0 && abv < 100)) return $('fAbv').focus();
  if (!(ml > 0 && ml < 5000)) return $('fMl').focus();

  const s = state.sheet;
  let drink;
  if (s.mode === 'edit') {
    drink = state.library.find(d => d.id === s.id);
    const keepSize = drink.size && drink.ml === ml;
    Object.assign(drink, { name, abv, ml, cat: s.cat });
    if (!keepSize) delete drink.size;
  } else {
    drink = { id: 'u-' + uid(), cat: s.cat, name, abv, ml, custom: true };
    state.library.push(drink);
  }
  saveLibrary();
  closeSheet();
  if (action === 'savelog') logDrink(drink);
  else showToast(s.mode === 'edit' ? 'Saved' : name + ' saved to library');
  renderView();
}

/* ---------------- Backup ---------------- */

async function exportData() {
  const data = JSON.stringify({ app: 'drink-tracker', version: DB_VERSION, exported: new Date().toISOString(), library: state.library, log: state.log }, null, 2);
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
      const logIds = new Set(state.log.map(e => e.id));
      const libIds = new Set(state.library.map(d => d.id));
      let added = 0;
      for (const e of data.log) if (e && e.id && !logIds.has(e.id)) { state.log.push(e); added++; }
      for (const d of data.library) if (d && d.id && !libIds.has(d.id)) state.library.push(d);
      saveLog(); saveLibrary();
      showToast('Imported ' + added + ' drinks');
      renderStats(); renderView();
    } catch {
      alert("That file doesn't look like a Drink Tracker backup.");
    }
  };
  reader.readAsText(file);
}

/* ---------------- Events ---------------- */

function bind() {
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
    if (b.dataset.add) return openSheet('new');
    const drink = state.library.find(d => d.id === b.dataset.id);
    if (!drink) return;
    if (state.editing) openSheet('edit', drink);
    else logDrink(drink, b);
  });

  $('toastUndo').addEventListener('click', () => {
    if (state.lastAddedId) removeEntry(state.lastAddedId);
    hideToast();
  });

  document.querySelector('.tabs').addEventListener('click', e => {
    const b = e.target.closest('.tab');
    if (!b) return;
    state.view = b.dataset.view;
    window.scrollTo(0, 0);
    renderView();
  });

  const onListClick = e => {
    const del = e.target.closest('[data-del]');
    if (del) {
      const entry = state.log.find(x => x.id === del.dataset.del);
      if (entry && confirm('Remove ' + entry.name + ' (' + fmtTime(entry.ts) + ')?')) removeEntry(entry.id);
      return;
    }
    const head = e.target.closest('.night-head');
    if (head) head.nextElementSibling.hidden = !head.nextElementSibling.hidden;
  };
  $('tonightList').addEventListener('click', onListClick);
  $('historyList').addEventListener('click', onListClick);

  // Sheet
  $('sheetClose').addEventListener('click', closeSheet);
  $('sheetBackdrop').addEventListener('click', e => { if (e.target === $('sheetBackdrop')) closeSheet(); });
  $('sizeChips').addEventListener('click', e => {
    const b = e.target.closest('[data-ml]');
    if (!b) return;
    if (b.dataset.ml === 'other') { state.sheet.otherMl = true; renderSheetChips(); $('fMl').focus(); }
    else {
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
  });
  ['fAbv', 'fMl'].forEach(id => $(id).addEventListener('input', updatePreview));
  $('drinkForm').addEventListener('submit', e => {
    e.preventDefault();
    const action = (e.submitter && e.submitter.dataset.action) || (state.sheet.mode === 'edit' ? 'save' : 'savelog');
    submitSheet(action);
  });
  $('deleteBtn').addEventListener('click', () => {
    const d = state.library.find(x => x.id === state.sheet.id);
    if (!d || !confirm('Remove ' + d.name + ' from your library? Past drinks stay in your history.')) return;
    state.library = state.library.filter(x => x.id !== d.id);
    saveLibrary();
    closeSheet();
    renderView();
  });

  // Backup
  $('exportBtn').addEventListener('click', exportData);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', e => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });

  // Keep "x min ago" fresh, and catch the 6am rollover
  setInterval(renderStats, 30000);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { renderStats(); renderView(); }
  });
}

/* ---------------- Boot ---------------- */

loadData();
bind();
renderStats();
renderView();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
