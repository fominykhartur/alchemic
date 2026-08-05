import { ELEMENTS, ELEMENT_IDS, ELEMENT_CATS, LEGENDARY_IDS, CATEGORIES, RECIPES, ACHIEVEMENTS, VARIANTS, recipeKey, CAT_ORDER, TREE_MAX_DEPTH, DEPTH_GROUPS, MAX_DEPTH } from './data.js';
import { buildIconSVG, ICON_DESIGNS, TIER, textSafeColor } from './icons.js';
import { state, saveGame } from './state.js';
import { notebook, saveNotebook, renderWhisperText, revealRecipe, pickSacrificeRecipe, getRecipeProgressForOutput, getRemainingRecipes, getRevealCost, canSacrifice, getRequiredAmount, getCategoryHint, getCategoryLabel } from './notebook.js';
import { playDrop, playAchievement } from './audio.js';

// ─── Drag & gesture state (Pointer Events) ───
const DRAG_THRESHOLD = 8;
const LONG_PRESS_MS = 500;
const DOUBLE_TAP_MS = 300;

let activeGesture = null;
let ghostEl = null;
let tapTimer = null;
let lastTap = null;
let touchDoubleTapFired = false;
let pausedTab = null;

function isOverCanvas(x, y) {
  const open = document.querySelector('.mobile-visible');
  if (open) {
    const pr = open.getBoundingClientRect();
    if (x >= pr.left && x <= pr.right && y >= pr.top && y <= pr.bottom) return false;
  }
  const r = document.getElementById('game-canvas').getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

export function isDraggingElement() {
  return !!(activeGesture && activeGesture.dragging);
}

function createGhost(id) {
  ghostEl = document.createElement('div');
  ghostEl.className = 'drag-ghost';
  ghostEl.innerHTML = buildIconSVG(id, 40);
  document.body.appendChild(ghostEl);
}

function moveGhost(x, y) {
  if (ghostEl) {
    ghostEl.style.left = x + 'px';
    ghostEl.style.top = y + 'px';
  }
}

function removeGhost() {
  if (ghostEl) { ghostEl.remove(); ghostEl = null; }
}

export function onItemPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  touchDoubleTapFired = false;
  const item = e.target.closest('.inv-item');
  if (!item) return;
  const id = item.dataset.elementId;
  if (!id || !state.discovered.has(id)) return;
  const el = ELEMENTS[id];
  if (!el) return;

  if (e.pointerType === 'mouse' && e.shiftKey) {
    e.preventDefault();
    showQtyPopup(e, id);
    return;
  }

  activeGesture = {
    pointerId: e.pointerId,
    id,
    item,
    addable: !!(el.starter || el.infinite || (state.inventory[id] || 0) > 0),
    startX: e.clientX,
    startY: e.clientY,
    dragging: false,
    moved: false,
    longPressDone: false,
  };

  if (e.pointerType !== 'mouse') {
    activeGesture.longPressTimer = setTimeout(() => {
      const g = activeGesture;
      if (g && g.pointerId === e.pointerId && !g.dragging) {
        g.longPressDone = true;
        showQtyPopup(e, id);
      }
    }, LONG_PRESS_MS);
  }
}

document.addEventListener('pointermove', (e) => {
  const g = activeGesture;
  if (!g || e.pointerId !== g.pointerId) return;
  const dx = e.clientX - g.startX;
  const dy = e.clientY - g.startY;
  if (!g.dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
    g.moved = true;
    if (!g.addable) return;
    g.dragging = true;
    clearTimeout(g.longPressTimer);
    try { g.item.setPointerCapture(e.pointerId); } catch {}
    e.preventDefault();
    createGhost(g.id);
    g.item.classList.add('dragging');

    const openPanel = document.querySelector('.mobile-visible');
    if (openPanel && window.innerWidth <= 767) {
      pausedTab = openPanel.id.replace('-panel', '');
      openPanel.classList.remove('mobile-visible');
    }
  }
  if (g.dragging) {
    e.preventDefault();
    moveGhost(e.clientX, e.clientY);
    document.getElementById('game-canvas').classList.toggle('drop-active', isOverCanvas(e.clientX, e.clientY));
  }
});

document.addEventListener('pointerup', (e) => {
  const g = activeGesture;
  if (!g || e.pointerId !== g.pointerId) return;
  clearTimeout(g.longPressTimer);
  const wasDrag = g.dragging;
  const droppedOnCanvas = wasDrag && isOverCanvas(e.clientX, e.clientY);
  g.item.classList.remove('dragging');
  removeGhost();
  document.getElementById('game-canvas').classList.remove('drop-active');
  activeGesture = null;

  if (wasDrag) {
    if (droppedOnCanvas) addToCauldron(g.id, 1);
    if (pausedTab) { switchTab(pausedTab); pausedTab = null; }
    return;
  }

  if (g.longPressDone || g.moved) return;

  // Mouse: single click → info, native dblclick → add 1
  if (e.pointerType === 'mouse') {
    showElementInfo(g.id);
    return;
  }

  // Touch: single tap → info (delayed for double-tap), double tap → add 1
  const now = performance.now();
  if (lastTap && lastTap.id === g.id && now - lastTap.time < DOUBLE_TAP_MS) {
    clearTimeout(tapTimer);
    lastTap = null;
    touchDoubleTapFired = true;
    addToCauldron(g.id, 1);
  } else {
    lastTap = { id: g.id, time: now };
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => {
      lastTap = null;
      showElementInfo(g.id);
    }, DOUBLE_TAP_MS);
  }
});

document.addEventListener('pointercancel', (e) => {
  const g = activeGesture;
  if (!g || e.pointerId !== g.pointerId) return;
  clearTimeout(g.longPressTimer);
  g.item.classList.remove('dragging');
  removeGhost();
  document.getElementById('game-canvas').classList.remove('drop-active');
  activeGesture = null;
  if (pausedTab) { switchTab(pausedTab); pausedTab = null; }
});

// ─── Quantity popup ───
let qtyPopupElement = null;

export function showQtyPopup(e, elementId) {
  const popup = document.getElementById('qty-popup');
  const btnContainer = popup.querySelector('.qty-buttons');
  btnContainer.innerHTML = '';
  const el = ELEMENTS[elementId];
  const maxQty = el?.starter || el?.infinite ? 9 : Math.min(state.inventory[elementId] || 0, 9);
  if (maxQty <= 0) return;
  for (let i = 1; i <= maxQty; i++) {
    const btn = document.createElement('button');
    btn.className = 'qty-btn';
    btn.textContent = i;
    btn.addEventListener('click', () => { addToCauldron(elementId, i); closeQtyPopup(); });
    btnContainer.appendChild(btn);
  }
  popup.style.display = 'block';
  popup.style.left = Math.min(e.clientX, window.innerWidth - 180) + 'px';
  popup.style.top = Math.min(e.clientY - 60, window.innerHeight - 140) + 'px';
  qtyPopupElement = elementId;
}

export function closeQtyPopup() {
  document.getElementById('qty-popup').style.display = 'none';
  qtyPopupElement = null;
}

export function addToCauldron(id, amount) {
  if (!state.discovered.has(id)) return;
  const el = ELEMENTS[id];
  if (!el) return;
  if (!el.starter && !el.infinite && (!state.inventory[id] || state.inventory[id] < amount)) return;
  const currentTotal = Object.values(state.cauldron).reduce((s, v) => s + v, 0);
  const space = 10 - currentTotal;
  if (space <= 0) {
    log('⚠ Котёл полон (10/10)!', 'info');
    return;
  }
  const addAmt = Math.min(amount, space);
  state.cauldron[id] = (state.cauldron[id] || 0) + addAmt;
  state.cauldronEntryTime[id] = performance.now();
  if (!el.starter && !el.infinite) state.inventory[id] -= addAmt;
  playDrop();
  updateUI();
}

// ─── Inventory ───
let elementInfoActive = null;

export function renderInventory() {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';

  if (!window._sortMode) window._sortMode = 'category';
  const sortToggle = document.createElement('div');
  sortToggle.style.cssText = 'width:100%;text-align:center;margin-bottom:4px;font-size:9px;color:#555;cursor:pointer';
  sortToggle.textContent = window._sortMode === 'category' ? '🔽 По категориям' : '🔤 По алфавиту';
  sortToggle.addEventListener('click', () => {
    window._sortMode = window._sortMode === 'category' ? 'alpha' : 'category';
    renderInventory();
  });
  grid.appendChild(sortToggle);

  const discovered = ELEMENT_IDS.filter(id => state.discovered.has(id));
  const undiscovered = ELEMENT_IDS.filter(id => !state.discovered.has(id));

  if (window._sortMode === 'category') {
    CAT_ORDER.forEach(cat => {
      const ids = discovered.filter(id => ELEMENT_CATS[id] === cat);
      if (ids.length === 0) return;
      const catInfo = CATEGORIES[cat];
      const header = document.createElement('div');
      header.style.cssText = `width:100%;font-size:9px;color:${catInfo.color};padding:4px 2px 2px;border-bottom:1px solid ${catInfo.color}22;margin-top:2px;text-transform:uppercase;letter-spacing:1px`;
      header.textContent = catInfo.label;
      grid.appendChild(header);
      ids.forEach(id => renderItem(grid, id));
    });
  } else {
    discovered.sort((a, b) => ELEMENTS[a].name.localeCompare(ELEMENTS[b].name));
    discovered.forEach(id => renderItem(grid, id));
  }

  if (undiscovered.length > 0) {
    const sep = document.createElement('div');
    sep.style.cssText = 'width:100%;font-size:9px;color:#2a2a4e;padding:4px 2px 2px;border-bottom:1px solid #1a1a2e;margin-top:4px;text-transform:uppercase;letter-spacing:1px';
    sep.textContent = '❓ Неоткрыто';
    grid.appendChild(sep);
    undiscovered.forEach(id => renderItem(grid, id));
  }
}

// ─── Tooltip ───
let tooltipTimer = null;

function showTooltip(id, e) {
  const el = ELEMENTS[id];
  if (!el || !state.discovered.has(id)) return;
  clearTimeout(tooltipTimer);
  const tip = document.getElementById('tooltip');
  const cat = ELEMENT_CATS[id];
  const catInfo = CATEGORIES[cat];
  const qty = state.inventory[id] || 0;
  tip.innerHTML = `
    <div class="tt-header">
      ${buildIconSVG(id, 16)}
      <span class="tt-name">${el.name}</span>
    </div>
    <div class="tt-cat">${catInfo ? catInfo.label : ''}</div>
    <div class="tt-desc">${el.desc}</div>
    <div class="tt-qty">${el.starter || el.infinite ? '∞ в запасе' : 'В наличии: ' + qty}</div>
  `;
  tip.style.display = 'block';
  positionTooltip(e);
}

function hideTooltip() {
  clearTimeout(tooltipTimer);
  document.getElementById('tooltip').style.display = 'none';
}

function positionTooltip(e) {
  const tip = document.getElementById('tooltip');
  let x = e.clientX + 14;
  let y = e.clientY + 14;
  const rect = tip.getBoundingClientRect();
  if (x + rect.width > window.innerWidth - 10) x = e.clientX - rect.width - 14;
  if (y + rect.height > window.innerHeight - 10) y = e.clientY - rect.height - 14;
  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
}

function renderItem(grid, id) {
  const el = ELEMENTS[id];
  const discovered = state.discovered.has(id);
  const qty = state.inventory[id] || 0;
  const item = document.createElement('div');
  item.className = 'inv-item' + (discovered ? '' : ' undiscovered');
  item.dataset.elementId = id;

  if (discovered) {
    item.style.background = `linear-gradient(135deg, ${el.color}44, ${el.color}11)`;
    item.style.borderColor = el.color + '66';
    if (id === 'void') {
      item.style.borderColor = '#9B5FCF';
      item.style.boxShadow = '0 0 12px rgba(123,63,175,0.4), inset 0 0 8px rgba(123,63,175,0.15)';
    }
    if (id === 'abyss') {
      item.style.borderColor = '#4A00AA';
      item.style.boxShadow = '0 0 10px rgba(74,0,170,0.3)';
    }
    const tier = TIER[id] || 'normal';
    if (tier !== 'normal') item.classList.add('tier-' + tier);
    const iconDiv = document.createElement('div');
    iconDiv.className = 'icon-container';
    iconDiv.innerHTML = buildIconSVG(id);
    item.appendChild(iconDiv);
    const qtyEl = document.createElement('div');
    qtyEl.className = 'quantity';
    qtyEl.textContent = el.starter || el.infinite ? '∞' : qty;
    if (qty > 0 || el.starter || el.infinite) item.appendChild(qtyEl);
    const label = document.createElement('div');
    label.className = 'name-label';
    label.textContent = el.name;
    item.appendChild(label);
    item.addEventListener('pointerdown', onItemPointerDown);
    item.addEventListener('dblclick', (e) => {
      if (touchDoubleTapFired) { touchDoubleTapFired = false; return; }
      e.preventDefault();
      addToCauldron(id, 1);
    });
    item.addEventListener('mouseenter', (e) => { showTooltip(id, e); });
    item.addEventListener('mouseleave', hideTooltip);
    item.addEventListener('mousemove', positionTooltip);
  } else {
    const q = document.createElement('div');
    q.textContent = '?';
    q.style.cssText = 'font-size:20px;color:#2a2a4e;';
    item.appendChild(q);
  }
  grid.appendChild(item);
}

// ─── Element Info / Recipe Book ───
export function showElementInfo(id) {
  const el = ELEMENTS[id];
  if (!el || !state.discovered.has(id)) return;
  if (window.innerWidth <= 767) switchTab('recipes');
  elementInfoActive = id;

  const list = document.getElementById('recipes-list');
  list.innerHTML = '';
  const panelTitle = document.querySelector('#recipes-panel .panel-title');
  panelTitle.innerHTML = `<a href="#" onclick="hideElementInfo();return false" style="color:#ffd700;text-decoration:none;margin-right:6px">←</a> ${el.name}`;

  const header = document.createElement('div');
  header.style.cssText = 'text-align:center;padding:8px;margin-bottom:6px;border-bottom:1px solid #2a2a4e44';
  header.innerHTML = `<div style="text-align:center;margin:0 auto 6px">${buildIconSVG(id, 44)}</div><div style="font-size:13px;font-weight:bold;color:#fff">${el.name}</div><div style="font-size:10px;color:#888;margin-top:2px">${el.desc}</div>`;
  list.appendChild(header);

  const knownKeys = new Set(notebook.knownRecipes);
  const producing = RECIPES.filter(r => r.output === id && (state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r))));
  if (producing.length > 0) {
    const title = document.createElement('div');
    title.style.cssText = 'font-size:10px;color:#ffd70088;margin:6px 0 4px;text-transform:uppercase;letter-spacing:1px';
    title.textContent = '🧪 Получается из:';
    list.appendChild(title);
    producing.forEach(r => {
      const key = recipeKey(r);
      const isFound = state.foundRecipes.has(key);
      const isKnown = !isFound && knownKeys.has(key);
      const formula = r.inputs.map(i => `<span style="color:${textSafeColor(ELEMENTS[i.id]?.color || '#888')}">${ELEMENTS[i.id]?.name || i.id}</span>${i.a > 1 ? '×' + i.a : ''}`).join(' + ');
      const entry = document.createElement('div');
      entry.className = 'recipe-entry ' + (isFound ? 'found' : 'known');
      entry.style.marginBottom = '2px';
      entry.innerHTML = `${isKnown ? '<span class="recipe-reveal-mark" title="Раскрыто жертвой">🔮</span>' : ''}<span class="recipe-formula">${formula}</span>`;
      list.appendChild(entry);
    });
  } else if (!el.starter) {
    const none = document.createElement('div');
    none.style.cssText = 'font-size:10px;color:#555;margin:4px 0';
    none.textContent = '🔒 Рецепт ещё не открыт';
    list.appendChild(none);
    const gBtn = document.createElement('button');
    gBtn.style.cssText = 'margin-top:6px;width:100%;background:#1a1a2e;border:1px solid #ffd70055;border-radius:4px;color:#ffd700;padding:5px;font-size:11px;cursor:pointer';
    gBtn.textContent = '🔮 Узнать в Гримуаре';
    gBtn.addEventListener('click', openGrimoire);
    list.appendChild(gBtn);
  }

  const usedIn = RECIPES.filter(r => r.inputs.some(i => i.id === id) && (state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r))));
  if (usedIn.length > 0) {
    const title = document.createElement('div');
    title.style.cssText = 'font-size:10px;color:#ffd70088;margin:8px 0 4px;text-transform:uppercase;letter-spacing:1px';
    title.textContent = '🔗 Можно создать:';
    list.appendChild(title);
    usedIn.forEach(r => {
      const key = recipeKey(r);
      const isFound = state.foundRecipes.has(key);
      const isKnown = !isFound && knownKeys.has(key);
      const output = ELEMENTS[r.output];
      const entry = document.createElement('div');
      entry.className = 'recipe-entry ' + (isFound ? 'found' : 'known');
      entry.style.marginBottom = '2px';
      entry.innerHTML = `${isKnown ? '<span class="recipe-reveal-mark" title="Раскрыто жертвой">🔮</span>' : ''}<span class="recipe-arrow" style="margin:0">→</span> <span class="recipe-result" style="color:${textSafeColor(output ? output.color : '#888')}">${output ? output.name : r.output}</span>`;
      list.appendChild(entry);
    });
  }

  if (producing.length === 0 && usedIn.length === 0 && !el.starter) {
    const none = document.createElement('div');
    none.style.cssText = 'font-size:10px;color:#555;text-align:center;padding:10px';
    none.textContent = '🔒 Нет открытых рецептов';
    list.appendChild(none);
  }

  const maxAdd = el.starter || el.infinite ? 9 : Math.min(state.inventory[id] || 0, 9);
  if (maxAdd > 0) {
    const addSection = document.createElement('div');
    addSection.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid #2a2a4e44';
    const addLabel = document.createElement('div');
    addLabel.style.cssText = 'font-size:10px;color:#888;margin-bottom:4px';
    addLabel.textContent = '📥 Добавить в котёл:';
    addSection.appendChild(addLabel);
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:3px;flex-wrap:wrap';
    for (let i = 1; i <= maxAdd && i <= 5; i++) {
      const btn = document.createElement('button');
      btn.style.cssText = 'background:#1a1a2e;border:1px solid #3a2a5e;border-radius:4px;color:#ccc;padding:3px 8px;font-size:11px;cursor:pointer';
      btn.textContent = `×${i}`;
      btn.addEventListener('click', () => { addToCauldron(id, i); hideElementInfo(); });
      btnRow.appendChild(btn);
    }
    addSection.appendChild(btnRow);
    list.appendChild(addSection);
  }

  const treeBtn = document.createElement('button');
  treeBtn.style.cssText = 'margin-top:8px;width:100%;background:#1a1a2e;border:1px solid #3a2a5e;border-radius:4px;color:#ccc;padding:5px;font-size:11px;cursor:pointer';
  treeBtn.textContent = '🌳 Древо рецептов';
  treeBtn.addEventListener('click', () => { openTree(id); });
  list.appendChild(treeBtn);
}

export function hideElementInfo() {
  elementInfoActive = null;
  const panelTitle = document.querySelector('#recipes-panel .panel-title');
  panelTitle.textContent = 'Книга рецептов';
  renderRecipes();
}

export function renderRecipes() {
  const list = document.getElementById('recipes-list');
  list.innerHTML = '';
  const knownKeys = new Set(notebook.knownRecipes);
  const foundAny = RECIPES.some(r => state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r)));
  if (!foundAny) {
    const empty = document.createElement('div');
    empty.className = 'recipes-empty';
    empty.textContent = '🔒 Рецепты будут открываться по мере смешивания';
    list.appendChild(empty);
    return;
  }
  RECIPES.forEach(r => {
    const key = recipeKey(r);
    const isFound = state.foundRecipes.has(key);
    const isKnown = !isFound && knownKeys.has(key);
    if (!isFound && !isKnown) return;
    const output = ELEMENTS[r.output];
    const entry = document.createElement('div');
    entry.className = 'recipe-entry ' + (isFound ? 'found' : 'known');
    const formula = r.inputs.map(i => `<span style="color:${textSafeColor(ELEMENTS[i.id]?.color || '#888')}">${ELEMENTS[i.id]?.name || i.id}</span>${i.a > 1 ? '×' + i.a : ''}`).join(' + ');
    entry.innerHTML = `${isKnown ? '<span class="recipe-reveal-mark" title="Раскрыто жертвой">🔮</span>' : ''}<span class="recipe-formula">${formula}</span><span class="recipe-arrow">→</span><span class="recipe-result" style="color:${textSafeColor(output ? output.color : '#888')}">${output ? output.name : r.output}</span>${r.ratio ? `<div class="recipe-dominance-hint">${ELEMENTS[r.ratio.id]?.name || r.ratio.id} преобладает</div>` : ''}`;
    list.appendChild(entry);
  });
}

// ─── Log ───
export function log(text, type = 'info') {
  state.messages.push({ text, type, time: Date.now() });
  const content = document.getElementById('log-content');
  const entry = document.createElement('div');
  entry.className = 'log-entry ' + type;
  entry.textContent = text;
  content.appendChild(entry);
  content.scrollTop = content.scrollHeight;
  if (state.messages.length > 100) { state.messages.shift(); if (content.children.length > 100) content.removeChild(content.firstChild); }
}

// ─── UI Update ───
export function updateUI() {
  renderInventory();
  if (!elementInfoActive) renderRecipes();
  updateStats();
  updateCauldronIndicator();
  saveGame();
}

function updateStats() {
  document.getElementById('discovered-count').textContent = state.discovered.size;
  document.getElementById('total-count').textContent = ELEMENT_IDS.length;
  document.getElementById('recipe-count').textContent = state.foundRecipes.size;
  document.getElementById('ach-count').textContent = state.achievements.size;
}

function updateCauldronIndicator() {
  const indicator = document.getElementById('cauldron-indicator');
  const entries = Object.entries(state.cauldron);
  if (entries.length === 0) {
    indicator.innerHTML = 'Перетащите элементы в круг';
  } else {
    const parts = entries.map(([id, qty]) => `<span class="cauldron-item-qty">${buildIconSVG(id, 14)} ${ELEMENTS[id].name} <b>×${qty}</b></span>`);
    indicator.innerHTML = parts.join(' ');
    const types = Object.keys(state.cauldron).sort();
    if (types.length > 1 && state.triedPairs.has(types.join('+'))) {
      const warn = document.createElement('span');
      warn.className = 'tried-warning';
      warn.textContent = '⚠ Эту комбинацию уже пробовали — возможен взрыв';
      indicator.appendChild(warn);
    }
  }
}

// ─── Whisper toast ───
let whisperToastTimer = null;

export function showWhisperToast() {
  const toast = document.getElementById('whisper-toast');
  if (!toast) return;
  toast.classList.add('show');
  clearTimeout(whisperToastTimer);
  whisperToastTimer = setTimeout(() => toast.classList.remove('show'), 4000);
}

// ─── Grimoire (notebook) ───
export function updateNotebookBadge() {
  const badge = document.getElementById('notebook-badge');
  if (!badge) return;
  badge.style.display = notebook.hasUnseen ? '' : 'none';
}

export function openGrimoire() {
  renderNotebook();
  notebook.hasUnseen = false;
  saveNotebook();
  updateNotebookBadge();
  document.getElementById('grimoire-modal').style.display = '';
}

export function closeGrimoire(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('grimoire-modal').style.display = 'none';
}

const SOURCE_ICONS = { ambient: '❓', oracle: '🔮', prophecy: '✨' };

function renderNotebook() {
  const content = document.getElementById('notebook-content');
  content.innerHTML = '';
  const unresolved = notebook.entries.filter(e => e.type === 'whisper' && !e.resolved);

  if (unresolved.length > 0) {
    const title = document.createElement('div');
    title.className = 'nb-section-title';
    title.textContent = '❓ Неразгаданные шёпоты';
    content.appendChild(title);
    unresolved.forEach(e => {
      const row = document.createElement('div');
      row.className = `nb-entry nb-whisper unresolved ${e.source}`;
      row.innerHTML = `<span class="nb-icon">${SOURCE_ICONS[e.source] || '❓'}</span><span class="nb-text">${renderWhisperText(e)}</span>`;
      content.appendChild(row);
    });
  }

  renderLegendarySection(content);

  renderSacrificeSection(content);
}

// ─── Legendary section ───
const NAME_REVEAL_THRESHOLD = 0.6;
const MAX_CHAIN_HINTS = 4;
let legendSnapshot = null;

function getLegendProgressInfo(id) {
  const recipes = RECIPES.filter(r => r.output === id);
  if (recipes.length === 0) return { lines: ['Тайна откроется в глубине Делания'], progress: null, tier: 1 };
  let best = null;
  for (const r of recipes) {
    const distinct = [...new Set(r.inputs.map(i => i.id))];
    const known = distinct.filter(i => state.discovered.has(i));
    const progress = known.length / distinct.length;
    if (!best || progress > best.progress) best = { distinct, known, progress };
  }
  const total = best.distinct.length;
  const knownCount = best.known.length;
  const ratio = knownCount / total;
  const lines = [];
  let tier;

  if (ratio >= 1) {
    tier = 4;
    lines.push('Все составляющие собраны — отправляйтесь к котлу');
  } else if (ratio === 0) {
    tier = 1;
    lines.push('Тайна откроется в глубине Делания');
  } else {
    tier = 2;
    const counts = {};
    best.distinct.forEach(i => {
      const cat = ELEMENT_CATS[i];
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const summary = Object.entries(counts)
      .map(([cat, n]) => `${getCategoryLabel(cat)} ×${n}`)
      .join(', ');
    lines.push(`Требуется ${total} составляющих: ${summary}`);
    if (ratio >= NAME_REVEAL_THRESHOLD || total - knownCount <= 1) {
      tier = 3;
      const missing = best.distinct.filter(i => !state.discovered.has(i));
      lines.push(`Не хватает: ${missing.map(i => ELEMENTS[i].name).join(', ')}`);
      missing.slice(0, MAX_CHAIN_HINTS).forEach(i => {
        const sub = RECIPES.find(r => r.output === i);
        if (!sub) return;
        const subCats = [...new Set(sub.inputs.map(inp => getCategoryHint(inp.id)))];
        lines.push(`${ELEMENTS[i].name}: создаётся из ${subCats.join(' и ')}`);
      });
    }
  }

  const progress = ratio > 0 && ratio < 1 ? `${knownCount}/${total}` : null;
  return { lines, progress, tier };
}

function renderLegendarySection(content) {
  const title = document.createElement('div');
  title.className = 'nb-section-title';
  title.textContent = '👑 Легенды';
  content.appendChild(title);

  LEGENDARY_IDS.forEach(id => {
    const el = ELEMENTS[id];
    if (!el) return;
    const found = state.discovered.has(id);
    const row = document.createElement('div');
    row.className = `nb-entry nb-legend ${found ? 'found' : 'locked'}`;
    if (found) {
      row.innerHTML = `<span class="nb-icon">${buildIconSVG(id, 18)}</span>
        <span class="nb-lore-body"><span class="nb-lore-name">${el.name}</span><span class="nb-lore-desc">${el.desc}</span></span>
        <span class="nb-target">✔</span>`;
    } else {
      const { lines, progress } = getLegendProgressInfo(id);
      const hintHtml = lines.map(l => `<span class="nb-hint">${l}</span>`).join('');
      row.innerHTML = `<span class="nb-icon">🔒</span>
        <span class="nb-lore-body"><span class="nb-lore-name">${el.name}</span>${hintHtml}</span>
        ${progress !== null ? `<span class="nb-progress">${progress}</span>` : ''}`;
    }
    content.appendChild(row);
  });
}

// ─── Legend progress toasts ───
export function initLegendSnapshot() {
  const snap = {};
  LEGENDARY_IDS.forEach(id => {
    if (state.discovered.has(id)) return;
    const info = getLegendProgressInfo(id);
    snap[id] = info.tier + ':' + (info.progress || 'done');
  });
  legendSnapshot = snap;
}

export function checkLegendProgress() {
  if (!legendSnapshot) initLegendSnapshot();
  const improved = [];
  LEGENDARY_IDS.forEach(id => {
    if (state.discovered.has(id)) return;
    const info = getLegendProgressInfo(id);
    const sig = info.tier + ':' + (info.progress || 'done');
    if (legendSnapshot[id] !== undefined && legendSnapshot[id] !== sig) {
      improved.push({ id, info });
    }
    legendSnapshot[id] = sig;
  });
  if (improved.length === 0) return;
  improved
    .sort((a, b) => b.info.tier - a.info.tier)
    .slice(0, 2)
    .forEach((item, i) => setTimeout(() => showLegendToast(item), i * 300));
}

let legendToastTimer = null;

function showLegendToast({ id, info }) {
  const el = ELEMENTS[id];
  const toast = document.getElementById('legend-toast');
  if (!toast || !el) return;
  const title = toast.querySelector('.legend-toast-title');
  const desc = toast.querySelector('.legend-toast-desc');
  if (title) title.textContent = `⚗ Шаг к ${el.name}`;
  if (desc) {
    desc.textContent = info.tier >= 3
      ? (info.lines.find(l => l.startsWith('Не хватает')) || info.lines[0])
      : (info.progress ? `Открыто ${info.progress} составляющих` : info.lines[0]);
  }
  toast.classList.add('show');
  clearTimeout(legendToastTimer);
  legendToastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── Sacrifice ritual ───
let sacrificeRolledRecipe = null;

function getSacrificeTargets() {
  return ELEMENT_IDS.filter(id => {
    const el = ELEMENTS[id];
    if (!el || el.starter || el.infinite) return false;
    if (!state.discovered.has(id)) return false;
    return getRemainingRecipes(id).length > 0;
  });
}

function getSacrificeDonors() {
  return ELEMENT_IDS.filter(id => {
    const el = ELEMENTS[id];
    if (!el) return false;
    if (!state.discovered.has(id)) return false;
    if (!canSacrifice(id)) return false;
    return (state.inventory[id] || 0) >= 1;
  });
}

function buildSacrificeDonors(donorSelect, recipe) {
  donorSelect.innerHTML = '';
  const donors = getSacrificeDonors();
  donors.sort((a, b) => ELEMENTS[a].name.localeCompare(ELEMENTS[b].name));
  const cost = recipe ? getRevealCost(recipe) : 0;
  donors.forEach(id => {
    const el = ELEMENTS[id];
    const qty = state.inventory[id] || 0;
    const required = recipe ? getRequiredAmount(recipe, id) : 0;
    const opt = document.createElement('option');
    opt.value = id;
    const enough = !recipe || required <= qty;
    opt.textContent = enough
      ? `${el.name} ×${qty}`
      : `${el.name} ×${qty} (нужно ${required})`;
    opt.disabled = !enough;
    donorSelect.appendChild(opt);
  });
  if (donors.length === 0) {
    const opt = document.createElement('option');
    opt.textContent = '— нет доноров —';
    opt.disabled = true;
    donorSelect.appendChild(opt);
  }
  return cost;
}

function renderSacrificeSection(content) {
  const title = document.createElement('div');
  title.className = 'nb-section-title';
  title.textContent = '🔥 Жертвенный ритуал';
  content.appendChild(title);

  const targets = getSacrificeTargets();
  const donors = getSacrificeDonors();

  if (targets.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'sacrifice-hint';
    hint.textContent = 'Нет целей: все известные вам элементы уже раскрыты в книге рецептов.';
    content.appendChild(hint);
    return;
  }
  if (donors.length === 0) {
    const hint = document.createElement('div');
    hint.className = 'sacrifice-hint';
    hint.textContent = 'Нечего принести в жертву — нужно не менее двух единиц какого-либо элемента.';
    content.appendChild(hint);
    return;
  }

  const box = document.createElement('div');
  box.className = 'sacrifice-box';

  const targetRow = document.createElement('div');
  targetRow.className = 'sacrifice-row';
  const targetLabel = document.createElement('label');
  targetLabel.textContent = 'Цель:';
  const targetSelect = document.createElement('select');
  targetSelect.id = 'sacrifice-target';
  targets.sort((a, b) => ELEMENTS[a].name.localeCompare(ELEMENTS[b].name));
  targets.forEach(id => {
    const opt = document.createElement('option');
    opt.value = id;
    const p = getRecipeProgressForOutput(id);
    opt.textContent = `${ELEMENTS[id].name} (${p.revealed}/${p.total} рецептов)`;
    targetSelect.appendChild(opt);
  });
  targetRow.appendChild(targetLabel);
  targetRow.appendChild(targetSelect);
  box.appendChild(targetRow);

  const donorRow = document.createElement('div');
  donorRow.className = 'sacrifice-row';
  const donorLabel = document.createElement('label');
  donorLabel.textContent = 'Жертва:';
  const donorSelect = document.createElement('select');
  donorSelect.id = 'sacrifice-donor';
  donorRow.appendChild(donorLabel);
  donorRow.appendChild(donorSelect);
  box.appendChild(donorRow);

  const costNote = document.createElement('div');
  costNote.className = 'sacrifice-cost';
  costNote.textContent = 'Стоимость рецепта: —';
  box.appendChild(costNote);

  const deductNote = document.createElement('div');
  deductNote.className = 'sacrifice-cost';
  deductNote.textContent = 'Спишется: —';
  box.appendChild(deductNote);

  const btn = document.createElement('button');
  btn.className = 'sacrifice-btn';
  btn.textContent = 'Пожертвовать и узнать';
  btn.addEventListener('click', () => {
    const target = targetSelect.value;
    const donor = donorSelect.value;
    if (!target || !donor) return;
    const required = getRequiredAmount(sacrificeRolledRecipe, donor);
    if (required > (state.inventory[donor] || 0)) return;
    performSacrifice(target, donor, required);
  });
  box.appendChild(btn);

  const note = document.createElement('div');
  note.className = 'sacrifice-hint';
  note.textContent = 'Каждая жертва раскрывает один случайный рецепт — приносите жертвы повторно, чтобы раскрыть остальные. Рецепт появится в Книге рецептов, но засчитается только после реального крафта.';
  box.appendChild(note);

  const updateDeductNote = () => {
    const donorId = donorSelect.value;
    const donor = donorId ? ELEMENTS[donorId] : null;
    if (!donor || !sacrificeRolledRecipe) {
      deductNote.textContent = 'Спишется: —';
      return;
    }
    const required = getRequiredAmount(sacrificeRolledRecipe, donorId);
    const qty = state.inventory[donorId] || 0;
    deductNote.textContent = required > qty
      ? `Спишется: ${required} × ${donor.name} (недостаточно, есть ${qty})`
      : `Спишется: ${required} × ${donor.name}`;
  };
  donorSelect.addEventListener('change', updateDeductNote);

  const rollRecipe = () => {
    sacrificeRolledRecipe = targetSelect.value ? pickSacrificeRecipe(targetSelect.value) : null;
    const cost = buildSacrificeDonors(donorSelect, sacrificeRolledRecipe);
    costNote.textContent = `Стоимость рецепта: ${cost > 0 ? cost + ' очков силы' : '—'}`;
    updateDeductNote();
  };
  targetSelect.addEventListener('change', rollRecipe);
  rollRecipe();

  content.appendChild(box);
}

function performSacrifice(targetId, donorId, amount) {
  const donor = ELEMENTS[donorId];
  if (!donor) return;
  if (!donor.starter && !donor.infinite) {
    const qty = state.inventory[donorId] || 0;
    if (qty < amount) return;
    state.inventory[donorId] = qty - amount;
  }
  const revealed = revealRecipe(sacrificeRolledRecipe);
  const target = ELEMENTS[targetId];
  if (revealed) {
    const p = getRecipeProgressForOutput(targetId);
    log(`🔥 Жертва принесена: раскрыт ${p.revealed} из ${p.total} рецептов «${target?.name || targetId}»`, 'info');
  }
  updateUI();
  renderNotebook();
}

// ─── Achievements ───
export function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (state.achievements.has(a.id)) return;
    if (a.check(state)) {
      state.achievements.add(a.id);
      log(`🏆 Достижение: ${a.name}`, 'discovery');
      showAchievementToast(a);
      playAchievement();
    }
  });
}

function showAchievementToast(a) {
  const toast = document.getElementById('ach-toast');
  toast.querySelector('.ach-toast-title').textContent = `🏆 ${a.name}`;
  toast.querySelector('.ach-toast-desc').textContent = a.desc;
  toast.classList.add('show');
  clearTimeout(toast._hideTimer);
  toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function renderAchievements() {
  const list = document.getElementById('achievement-list');
  list.innerHTML = '';
  ACHIEVEMENTS.forEach(a => {
    const unlocked = state.achievements.has(a.id);
    const item = document.createElement('div');
    item.className = 'ach-item ' + (unlocked ? 'unlocked' : 'locked');
    item.innerHTML = `<div class="ach-icon">🏆</div><div class="ach-info"><div class="ach-name">${a.name}</div><div class="ach-desc">${unlocked ? a.desc : '???'}</div></div><div class="ach-check">${unlocked ? '✅' : '🔒'}</div>`;
    list.appendChild(item);
  });
}

export function openAchievements() {
  renderAchievements();
  document.getElementById('achievement-modal').style.display = '';
}

export function closeAchievements(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('achievement-modal').style.display = 'none';
}

// ─── Recipe Tree ───
export function openTree(id) {
  const modal = document.getElementById('tree-modal');
  const content = document.getElementById('tree-content');
  content.innerHTML = '';
  const el = ELEMENTS[id];
  if (!el) return;
  const header = modal.querySelector('.modal-header span');
  header.textContent = `🌳 Древо: ${el.name}`;
  renderTreeNode(id, 0, new Set(), content);
  modal.style.display = '';
}

export function closeTree(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('tree-modal').style.display = 'none';
}

function renderTreeNode(id, depth, visited, container) {
  if (depth > TREE_MAX_DEPTH) {
    const div = document.createElement('div');
    div.className = 'tree-leaf';
    div.textContent = '···';
    container.appendChild(div);
    return;
  }
  const el = ELEMENTS[id];
  if (!el) return;
  const knownKeys = new Set(notebook.knownRecipes);
  const node = document.createElement('div');
  node.className = 'tree-node';
  const content = document.createElement('div');
  content.className = 'tree-node-content';
  content.innerHTML = `${buildIconSVG(id, 18)}<span style="color:#fff">${el.name}</span>`;
  content.addEventListener('click', () => openTree(id));
  node.appendChild(content);
  container.appendChild(node);

  const children = document.createElement('div');
  children.className = 'tree-children';

  if (!el.starter) {
    const producing = RECIPES.filter(r => r.output === id && (state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r))));
    if (producing.length > 0) {
      const title = document.createElement('div');
      title.className = 'tree-section-title';
      title.textContent = '🧪 Получается из:';
      children.appendChild(title);
      producing.forEach(r => r.inputs.forEach(inp => {
        if (!visited.has(inp.id)) {
          const nextVisited = new Set(visited);
          nextVisited.add(inp.id);
          renderTreeNode(inp.id, depth + 1, nextVisited, children);
        } else {
          const d = document.createElement('div');
          d.className = 'tree-leaf';
          d.textContent = `${ELEMENTS[inp.id]?.name || inp.id} (цикл)`;
          children.appendChild(d);
        }
      }));
    }
  }

  const usedIn = RECIPES.filter(r => r.inputs.some(i => i.id === id) && (state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r))));
  if (usedIn.length > 0) {
    const title = document.createElement('div');
    title.className = 'tree-section-title';
    title.textContent = '🔗 Создаёт:';
    children.appendChild(title);
    usedIn.forEach(r => {
      if (!visited.has(r.output)) {
        const nextVisited = new Set(visited);
        nextVisited.add(r.output);
        renderTreeNode(r.output, depth + 1, nextVisited, children);
      } else {
        const d = document.createElement('div');
        d.className = 'tree-leaf';
        d.textContent = `${ELEMENTS[r.output]?.name || r.output} (цикл)`;
        children.appendChild(d);
      }
    });
  }

  if (children.children.length > 0) container.appendChild(children);
}

// ─── Statistics ───
function formatTime(ms) {
  if (!ms) return '—';
  const totalSec = Math.floor((Date.now() - ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

function renderStats() {
  const s = state.stats;
  const mostCreated = Object.entries(s.elementCreatedCount).sort((a, b) => b[1] - a[1]);
  const top = mostCreated.length > 0 && mostCreated[0][1] > 0 ? `${ELEMENTS[mostCreated[0][0]]?.name || mostCreated[0][0]} (${mostCreated[0][1]})` : '—';
  document.getElementById('stats-time').textContent = formatTime(s.startTime);
  document.getElementById('stats-discovered').textContent = `${state.discovered.size} / ${ELEMENT_IDS.length}`;
  document.getElementById('stats-recipes').textContent = `${state.foundRecipes.size} / ${RECIPES.length}`;
  document.getElementById('stats-mixes').textContent = s.mixCount;
  document.getElementById('stats-explosions').textContent = s.explosionCount;
  document.getElementById('stats-from-ashes').textContent = s.discoveryFromExplosion;
  document.getElementById('stats-created').textContent = s.totalCreated;
  document.getElementById('stats-achievements').textContent = `${state.achievements.size} / ${ACHIEVEMENTS.length}`;
  document.getElementById('stats-top-element').textContent = top;
}

export function openStats() {
  renderStats();
  document.getElementById('stats-modal').style.display = '';
}

export function closeStats(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('stats-modal').style.display = 'none';
}

// ─── Craft Roadmap ───
function createRoadmapCard(id) {
  const el = ELEMENTS[id];
  if (!el) return null;
  const discovered = state.discovered.has(id);
  const cat = ELEMENT_CATS[id];
  const catColor = CATEGORIES[cat]?.color || '#888';
  const recipesFor = RECIPES.filter(r => r.output === id && state.foundRecipes.has(recipeKey(r)));
  const parents = recipesFor.length > 0 ? recipesFor[0].inputs.map(i => i.id) : [];

  const card = document.createElement('div');
  card.className = 'roadmap-card' + (discovered ? '' : ' roadmap-undiscovered');

  if (discovered) {
    card.style.borderColor = catColor;
    card.innerHTML = `${buildIconSVG(id, 20)}<span class="roadmap-name">${el.name}</span>`;
    if (parents.length > 0) {
      const parentDots = document.createElement('div');
      parentDots.className = 'roadmap-parents';
      parents.forEach(pid => {
        const pel = ELEMENTS[pid];
        if (!pel) return;
        const dot = document.createElement('span');
        dot.className = 'roadmap-parent-dot';
        dot.style.background = pel.color;
        dot.title = pel.name;
        parentDots.appendChild(dot);
      });
      card.appendChild(parentDots);
    }
    card.addEventListener('click', () => openTree(id));
  } else {
    card.innerHTML = `<div class="roadmap-unknown">?</div><span class="roadmap-name">???</span>`;
  }

  return card;
}

function renderCraftRoadmap() {
  const content = document.getElementById('roadmap-content');
  content.innerHTML = '';
  const showAll = document.getElementById('roadmap-spoiler').checked;

  for (let d = 0; d <= MAX_DEPTH; d++) {
    const ids = DEPTH_GROUPS[d];
    if (!ids || ids.length === 0) continue;

    const toShow = showAll ? ids : ids.filter(id => state.discovered.has(id));
    if (toShow.length === 0) continue;

    const row = document.createElement('div');
    row.className = 'roadmap-row';

    const label = document.createElement('div');
    label.className = 'roadmap-depth-label';
    label.textContent = `${d}`;
    const labelHint = document.createElement('div');
    labelHint.className = 'roadmap-depth-hint';
    labelHint.textContent = showAll ? `${ids.length} эл.` : `${toShow.length}/${ids.length}`;
    label.appendChild(labelHint);
    row.appendChild(label);

    const cards = document.createElement('div');
    cards.className = 'roadmap-cards';
    toShow.forEach(id => {
      const card = createRoadmapCard(id);
      if (card) cards.appendChild(card);
    });

    if (cards.children.length > 0) {
      row.appendChild(cards);
      content.appendChild(row);
    }
  }

}

export function openCraftRoadmap() {
  const modal = document.getElementById('roadmap-modal');
  const content = document.getElementById('roadmap-content');
  content.innerHTML = '';
  const checkbox = document.getElementById('roadmap-spoiler');
  checkbox.onchange = renderCraftRoadmap;
  renderCraftRoadmap();
  modal.style.display = '';
}

export function closeCraftRoadmap(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('roadmap-modal').style.display = 'none';
}

// ─── Mobile tab switching ───
export function switchTab(tab) {
  document.querySelectorAll('#tab-bar .tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('#inventory-panel, #recipes-panel, #log-panel').forEach(p => {
    p.classList.remove('mobile-visible');
  });
  if (tab === 'cauldron') return;
  const map = { inventory: 'inventory-panel', recipes: 'recipes-panel', log: 'log-panel' };
  const panel = document.getElementById(map[tab]);
  if (panel) panel.classList.add('mobile-visible');
}

// Close mobile panel on backdrop click
document.addEventListener('click', (e) => {
  const open = document.querySelector('.mobile-visible');
  if (!open) return;
  if (!open.contains(e.target) && !e.target.closest('#tab-bar')) {
    open.classList.remove('mobile-visible');
    document.querySelectorAll('#tab-bar .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === 'cauldron');
    });
  }
});
