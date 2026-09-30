import { ELEMENTS, RECIPES, recipeKey, ELEMENT_DEPTHS, LEGENDARY_IDS, FINAL_IDS } from './data.js';
import { state, saveGame } from './state.js';
import { notebook } from './notebook.js';
import { log, updateUI, checkAchievements, checkLegendProgress, openModalAnimated, closeModalAnimated } from './ui.js';
import { buildIconSVG, textSafeColor } from './icons.js';
import { playDiscover } from './audio.js';

export const FUEL_VALUE = { coal: 1, briquette: 4, aetherCore: 12 };
export const FUEL_ORDER = ['coal', 'briquette', 'aetherCore'];

export const FURNACE_LEVELS = {
  1: { slots: 1, maxDepth: 3, intervalMs: 20000 },
  2: { slots: 3, maxDepth: 6, intervalMs: 12000 },
  3: { slots: 5, maxDepth: Infinity, intervalMs: 8000 },
};

export const UPGRADE_COST = {
  2: [{ id: 'brick', a: 5 }, { id: 'iron', a: 3 }],
  3: [{ id: 'steel', a: 5 }, { id: 'crystal', a: 3 }, { id: 'gold', a: 1 }],
};

let lastCraft = Date.now();

export function furnaceLevel() {
  return state.furnace?.level || 0;
}

export function furnaceConfig() {
  return FURNACE_LEVELS[furnaceLevel()] || null;
}

export function isRecipeKnownForFurnace(recipe) {
  const key = recipeKey(recipe);
  return state.foundRecipes.has(key) || notebook.knownRecipes.includes(key);
}

export function furnaceRejectReason(recipe) {
  const cfg = furnaceConfig();
  if (!cfg) return 'Постройте Печь';
  if (!isRecipeKnownForFurnace(recipe)) return 'Рецепт неизвестен';
  if (LEGENDARY_IDS.includes(recipe.output)) return 'Легендарное — только руками';
  if (FINAL_IDS.includes(recipe.output)) return 'Финалы — только руками';
  const depth = ELEMENT_DEPTHS[recipe.output] ?? 0;
  if (depth > cfg.maxDepth) return `Нужно улучшить печь (глубина ${depth})`;
  return null;
}

export function addToQueue(key, count = 1) {
  const recipe = RECIPES.find(r => recipeKey(r) === key);
  if (!recipe) return 'Нет такого рецепта';
  const bad = furnaceRejectReason(recipe);
  if (bad) return bad;
  const cfg = furnaceConfig();
  const n = Math.max(1, Math.min(99, Math.floor(count) || 1));
  const existing = state.furnace.queue.find(q => q.key === key);
  if (existing) {
    existing.left = Math.min(99, existing.left + n);
  } else {
    if (state.furnace.queue.length >= cfg.slots) return 'Очередь полна — улучшите печь';
    state.furnace.queue.push({ key, output: recipe.output, left: n, progress: 0 });
  }
  saveGame();
  return null;
}

export function cancelQueue(index) {
  state.furnace.queue.splice(index, 1);
  saveGame();
}

export function loadFuel(fuelId, amount = 1) {
  if (!FUEL_VALUE[fuelId]) return 'Не топливо';
  const have = state.inventory[fuelId] || 0;
  const n = Math.max(1, Math.min(have, Math.floor(amount) || 1));
  if (n <= 0) return 'Нет топлива в инвентаре';
  state.inventory[fuelId] = have - n;
  state.furnace.fuel[fuelId] = (state.furnace.fuel[fuelId] || 0) + n;
  state.furnace.charges = (state.furnace.charges || 0) + n * FUEL_VALUE[fuelId];
  saveGame();
  updateUI();
  return null;
}

export function canUpgrade() {
  const next = furnaceLevel() + 1;
  const cost = UPGRADE_COST[next];
  if (!cost) return null;
  return cost.every(c => (state.inventory[c.id] || 0) >= c.a) ? cost : null;
}

export function upgradeFurnace() {
  const cost = canUpgrade();
  if (!cost) return false;
  cost.forEach(c => { state.inventory[c.id] -= c.a; });
  state.furnace.level += 1;
  log(`🏭 Печь улучшена до уровня ${state.furnace.level}!`, 'discovery');
  saveGame();
  updateUI();
  return true;
}

export function unlockFurnace() {
  if (state.furnace.level !== 0) return false;
  state.furnace.level = 1;
  state.furnace.introSeen = false;
  state.furnace.hasUnseen = true;
  log('🏭 Построена Печь! Откройте её кнопкой 🏭 в шапке.', 'discovery');
  saveGame();
  refreshFurnaceBadge();
  return true;
}

// Самолечение: печь могли добыть до появления кода анлока (уровень остался 0
// при открытой Печи) — уровень выводим из факта открытия, а не только из события крафта.
export function ensureFurnaceUnlocked() {
  if (state.furnace.level === 0 && state.discovered.has('furnace')) {
    const ok = unlockFurnace();
    if (ok) log('🏭 Печь переподключена после обновления — механика активна.', 'info');
    return ok;
  }
  return false;
}

function recipeInputsAvailable(recipe) {
  return recipe.inputs.every(i => {
    const el = ELEMENTS[i.id];
    if (el?.starter || el?.infinite) return true;
    return (state.inventory[i.id] || 0) >= i.a;
  });
}

function consumeInputs(recipe) {
  recipe.inputs.forEach(i => {
    const el = ELEMENTS[i.id];
    if (el?.starter || el?.infinite) return;
    state.inventory[i.id] = Math.max(0, (state.inventory[i.id] || 0) - i.a);
  });
}

export function furnaceProgress() {
  const cfg = furnaceConfig();
  const head = state.furnace.queue[0];
  if (!cfg || !head) return 0;
  return Math.min(1, (Date.now() - lastCraft) / cfg.intervalMs);
}

export function furnaceTick() {
  ensureFurnaceUnlocked();
  const cfg = furnaceConfig();
  const head = state.furnace.queue[0];
  if (!cfg || !head) {
    lastCraft = Date.now();
    return;
  }
  const recipe = RECIPES.find(r => recipeKey(r) === head.key);
  if (!recipe) {
    state.furnace.queue.shift();
    saveGame();
    return;
  }
  // Пауза: нет топлива или входов — прогресс заморожен
  if ((state.furnace.charges || 0) <= 0 || !recipeInputsAvailable(recipe)) {
    lastCraft = Date.now();
    return;
  }
  if (Date.now() - lastCraft < cfg.intervalMs) return;
  lastCraft = Date.now();

  consumeInputs(recipe);
  state.furnace.charges -= 1;
  const out = recipe.output;
  const isNew = !state.discovered.has(out);
  if (isNew) {
    state.discovered.add(out);
    state.inventory[out] = (state.inventory[out] || 0) + 3;
    log(`🏭 Печь создала новое: ${ELEMENTS[out]?.name || out}!`, 'discovery');
    checkLegendProgress();
  } else {
    state.inventory[out] = (state.inventory[out] || 0) + 3;
  }
  state.stats.totalCreated += 3;
  state.stats.autoCreated = (state.stats.autoCreated || 0) + 3;
  state.stats.elementCreatedCount[out] = (state.stats.elementCreatedCount[out] || 0) + 3;
  head.left -= 1;
  if (head.left <= 0) state.furnace.queue.shift();
  checkAchievements();
  // Очередь полностью отработана — уведомление (модалку можно было закрывать)
  if (state.furnace.queue.length === 0) {
    state.furnace.hasUnseen = true;
    log('🏭 Печь отработала очередь!', 'discovery');
    playDiscover();
    furnaceToastDone();
    refreshFurnaceBadge();
  }
  updateUI();
  saveGame();
}

export function startFurnaceLoop() {
  lastCraft = Date.now();
  setInterval(() => {
    try { furnaceTick(); } catch {}
  }, 1000);
}

// ─── UI ───
let furnaceTimer = null;
let furnaceAddError = '';

function formulaText(recipe) {
  return recipe.inputs.map(i => `${ELEMENTS[i.id]?.name || i.id}${i.a > 1 ? '×' + i.a : ''}`).join(' + ') +
    ` → ${ELEMENTS[recipe.output]?.name || recipe.output}`;
}

export function refreshFurnaceBadge() {
  ensureFurnaceUnlocked();
  const btn = document.getElementById('furnace-btn');
  const badge = document.getElementById('furnace-badge');
  if (!btn) return;
  const lvl = furnaceLevel();
  btn.classList.toggle('furnace-locked', lvl === 0);
  btn.title = lvl === 0 ? 'Алхимическая печь: постройте (кирпич + сталь + глина + инферно)' : `Алхимическая печь ур. ${lvl} — автокрафт`;
  if (badge) badge.style.display = (lvl > 0 && state.furnace.hasUnseen) ? '' : 'none';
}

function furnaceToastDone() {
  const toast = document.getElementById('legend-toast');
  if (!toast) return;
  const title = toast.querySelector('.legend-toast-title');
  const desc = toast.querySelector('.legend-toast-desc');
  if (title) title.textContent = '🏭 Печь отработала очередь';
  if (desc) desc.textContent = 'Загляните в печь — можно закрывать вкладку спокойно';
  toast.classList.add('show');
  clearTimeout(toast._furnTimer);
  toast._furnTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

export function openFurnace() {
  if (!document.getElementById('furnace-modal')) return;
  ensureFurnaceUnlocked();
  renderFurnace();
  state.furnace.hasUnseen = false;
  saveGame();
  refreshFurnaceBadge();
  openModalAnimated(document.getElementById('furnace-modal'));
  clearInterval(furnaceTimer);
  furnaceTimer = setInterval(() => {
    const m = document.getElementById('furnace-modal');
    if (!m || m.style.display === 'none') return clearInterval(furnaceTimer);
    refreshFurnaceDyn();
  }, 1000);
}

export function closeFurnace(e) {
  if (e && e.target !== e.currentTarget) return;
  clearInterval(furnaceTimer);
  closeModalAnimated('furnace-modal');
}

function refreshFurnaceDyn() {
  const ch = document.getElementById('furn-charges');
  if (ch) ch.textContent = state.furnace.charges || 0;
  document.querySelectorAll('#furnace-content .fprog').forEach((bar, i) => {
    const fill = bar.querySelector('i');
    if (!fill) return;
    fill.style.width = (i === 0 ? Math.round(furnaceProgress() * 100) : 0) + '%';
  });
}

export function renderFurnace() {
  const content = document.getElementById('furnace-content');
  if (!content) return;
  content.innerHTML = '';
  const lvl = furnaceLevel();

  if (lvl === 0) {
    const lock = document.createElement('div');
    lock.className = 'nb-empty';
    lock.textContent = '🔒 Постройте Печь: кирпич + сталь + глина + инферно — и она будет крафтить за вас.';
    content.appendChild(lock);
    return;
  }

  if (!state.furnace.introSeen) {
    const intro = document.createElement('div');
    intro.className = 'sacrifice-box';
    intro.innerHTML = `<div style="text-align:center;font-size:15px;font-weight:bold;color:#ffd700">🏭 Печь построена!</div>
      <div style="font-size:12.5px;color:#c8c8e8;line-height:1.6">1. Загрузите топливо (уголь, брикеты, ядра).<br>2. Выберите известный рецепт в очередь.<br>3. Печь работает сама — вкладку можно закрывать, о готовности сообщим.</div>`;
    const ok = document.createElement('button');
    ok.className = 'sacrifice-btn';
    ok.textContent = 'Понятно!';
    ok.addEventListener('click', () => {
      state.furnace.introSeen = true;
      saveGame();
      renderFurnace();
    });
    intro.appendChild(ok);
    content.appendChild(intro);
  }

  const cfg = furnaceConfig();
  const status = document.createElement('div');
  status.className = 'furn-status';
  const speed = Math.round(cfg.intervalMs / 1000);
  status.innerHTML = `Уровень <b>${lvl}</b> · ⚡ зарядов: <b id="furn-charges">${state.furnace.charges || 0}</b> · крафт / ${speed}с · очередь ${state.furnace.queue.length}/${cfg.slots}`;
  content.appendChild(status);

  // Топливо
  const fTitle = document.createElement('div');
  fTitle.className = 'nb-section-title';
  fTitle.textContent = '🔥 Топливо';
  content.appendChild(fTitle);
  FUEL_ORDER.forEach(fid => {
    const el = ELEMENTS[fid];
    if (!el) return;
    const row = document.createElement('div');
    row.className = 'sacrifice-row furn-fuel-row';
    const inv = state.inventory[fid] || 0;
    const inF = state.furnace.fuel[fid] || 0;
    row.innerHTML = `<span>${buildIconSVG(fid, 20)}</span><span class="furn-fuel-name">${el.name} <span class="furn-fuel-val">(+${FUEL_VALUE[fid]}⚡)</span></span><span class="furn-fuel-count">в печи ${inF} · рюкзак ${inv}</span>`;
    [1, 5].forEach(n => {
      const b = document.createElement('button');
      b.className = 'sync-btn';
      b.textContent = `+${n}`;
      b.title = `Загрузить ${n} шт.`;
      b.disabled = inv < 1;
      b.addEventListener('click', () => {
        const err = loadFuel(fid, Math.min(n, state.inventory[fid] || 0));
        if (!err) renderFurnace();
      });
      row.appendChild(b);
    });
    content.appendChild(row);
  });

  // Улучшение
  if (lvl < 3) {
    const upTitle = document.createElement('div');
    upTitle.className = 'nb-section-title';
    upTitle.textContent = `⬆ Улучшение до ${lvl + 1}`;
    content.appendChild(upTitle);
    const cost = UPGRADE_COST[lvl + 1];
    const upRow = document.createElement('div');
    upRow.className = 'sacrifice-row';
    upRow.innerHTML = `<span class="furn-cost">${cost.map(c => `${ELEMENTS[c.id]?.name || c.id} ×${c.a} (есть ${state.inventory[c.id] || 0})`).join(' · ')}</span>`;
    const ub = document.createElement('button');
    ub.className = 'sacrifice-btn';
    ub.textContent = 'Улучшить';
    ub.disabled = !canUpgrade();
    ub.addEventListener('click', () => { if (upgradeFurnace()) renderFurnace(); });
    upRow.appendChild(ub);
    content.appendChild(upRow);
  }

  // Очередь
  const qTitle = document.createElement('div');
  qTitle.className = 'nb-section-title';
  qTitle.textContent = '📋 Очередь';
  content.appendChild(qTitle);
  if (state.furnace.queue.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sacrifice-hint';
    empty.textContent = 'Пусто — добавьте рецепт ниже.';
    content.appendChild(empty);
  }
  state.furnace.queue.forEach((q, i) => {
    const recipe = RECIPES.find(r => recipeKey(r) === q.key);
    if (!recipe) return;
    const row = document.createElement('div');
    row.className = 'furn-qrow';
    const okFuel = (state.furnace.charges || 0) > 0;
    const top = document.createElement('div');
    top.className = 'furn-qtop';
    top.innerHTML = `<span class="furn-qname">${formulaText(recipe)} <b>×${q.left}</b></span>`;
    const x = document.createElement('button');
    x.className = 'sync-btn danger';
    x.textContent = '✕';
    x.title = 'Убрать из очереди';
    x.addEventListener('click', () => { cancelQueue(i); renderFurnace(); });
    top.appendChild(x);
    if (!okFuel) {
      const st = document.createElement('span');
      st.className = 'furn-qstate';
      st.textContent = 'нет топлива — загрузите уголь, брикеты или ядра';
      top.appendChild(st);
    }
    row.appendChild(top);
    const prog = document.createElement('div');
    prog.className = 'fprog';
    prog.innerHTML = `<i style="width:${i === 0 ? Math.round(furnaceProgress() * 100) : 0}%"></i>`;
    row.appendChild(prog);
    content.appendChild(row);
  });

  // Добавление
  const addRow = document.createElement('div');
  addRow.className = 'sacrifice-row';
  const sel = document.createElement('select');
  sel.id = 'furn-add-select';
  const eligible = RECIPES.filter(r => !furnaceRejectReason(r));
  if (eligible.length === 0) {
    const o = document.createElement('option');
    o.textContent = '— нет доступных (уровень/глубина) —';
    o.disabled = true;
    sel.appendChild(o);
  }
  eligible.slice(0, 300).forEach(r => {
    const o = document.createElement('option');
    o.value = recipeKey(r);
    o.textContent = formulaText(r);
    sel.appendChild(o);
  });
  const cnt = document.createElement('input');
  cnt.type = 'number';
  cnt.min = '1';
  cnt.max = '20';
  cnt.value = '1';
  cnt.className = 'sync-key-input';
  cnt.style.width = '56px';
  cnt.title = 'Сколько скрафтить';
  const addB = document.createElement('button');
  addB.className = 'sync-btn';
  addB.textContent = 'В очередь';
  const errLine = document.createElement('div');
  errLine.className = 'sacrifice-hint';
  addB.addEventListener('click', () => {
    const err = addToQueue(sel.value, parseInt(cnt.value, 10) || 1);
    if (err) { errLine.textContent = '⚠ ' + err; return; }
    renderFurnace();
  });
  addRow.appendChild(sel);
  addRow.appendChild(cnt);
  addRow.appendChild(addB);
  content.appendChild(addRow);
  content.appendChild(errLine);
}
