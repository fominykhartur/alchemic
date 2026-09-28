import { ELEMENTS, ELEMENT_IDS, ELEMENT_CATS, LEGENDARY_IDS, FINAL_IDS, CATEGORIES, RECIPES, ACHIEVEMENTS, VARIANTS, recipeKey, CAT_ORDER, TREE_MAX_DEPTH, DEPTH_GROUPS, MAX_DEPTH } from './data.js';
import { buildIconSVG, ICON_DESIGNS, TIER, textSafeColor } from './icons.js';
import { state, saveGame, getPlayMs } from './state.js';
import { notebook, saveNotebook, renderWhisperText, revealRecipe, pickSacrificeRecipe, getRecipeProgressForOutput, getRemainingRecipes, getRevealCost, canSacrifice, getRequiredAmount, getCategoryHint, getCategoryLabel } from './notebook.js';
import { playDrop, playAchievement, playDiscover } from './audio.js';

function hexRgba(hex, alpha) {
  return `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${alpha})`;
}

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

const invSearch = document.getElementById('inv-search');
if (invSearch && typeof invSearch.addEventListener === 'function') {
  invSearch.addEventListener('input', () => renderInventory());
  invSearch.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { invSearch.value = ''; invSearch.blur(); renderInventory(); }
  });
}
const invSearchClear = document.getElementById('inv-search-clear');
if (invSearch && invSearchClear && typeof invSearchClear.addEventListener === 'function') {
  invSearchClear.addEventListener('click', () => {
    invSearch.value = '';
    // Фокус — только на десктопе: на таче он дёргает вьюпорт и поднимает клавиатуру
    if (window.matchMedia('(pointer: fine)').matches) invSearch.focus();
    else invSearch.blur();
    renderInventory();
  });
}

document.addEventListener('pointermove', (e) => {
  const g = activeGesture;
  if (!g || e.pointerId !== g.pointerId) return;
  // Ручной скролл: палец шёл вертикально — крутим сетку вместо перетаскивания
  if (g.scrolling) {
    const grid = document.getElementById('inventory-grid');
    if (grid) grid.scrollTop -= e.clientY - g.startY;
    g.startX = e.clientX;
    g.startY = e.clientY;
    e.preventDefault();
    return;
  }
  const dx = e.clientX - g.startX;
  const dy = e.clientY - g.startY;
  const threshold = e.pointerType === 'mouse' ? DRAG_THRESHOLD : DRAG_THRESHOLD * 2;
  if (!g.dragging && Math.hypot(dx, dy) > threshold) {
    g.moved = true;
    // Тач идёт строго вертикально — это скролл инвентаря, а не drag
    if (e.pointerType !== 'mouse' && Math.abs(dy) > Math.abs(dx) * 1.4) {
      g.scrolling = true;
      clearTimeout(g.longPressTimer);
      e.preventDefault();
      return;
    }
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
  sortToggle.className = 'inv-full-row';
  sortToggle.style.cssText = 'width:100%;text-align:center;margin-bottom:4px;font-size:10px;color:#77779a;cursor:pointer;padding:2px;border-radius:4px';
  sortToggle.title = 'Переключить сортировку';
  sortToggle.textContent = window._sortMode === 'category' ? '🔽 По категориям' : '🔤 По алфавиту';
  sortToggle.addEventListener('click', () => {
    window._sortMode = window._sortMode === 'category' ? 'alpha' : 'category';
    renderInventory();
  });
  grid.appendChild(sortToggle);

  const discovered = ELEMENT_IDS.filter(id => state.discovered.has(id));
  const undiscovered = ELEMENT_IDS.filter(id => !state.discovered.has(id));
  const searchInput = document.getElementById('inv-search');
  const q = (searchInput && searchInput.value || '').trim().toLowerCase();

  if (q) {
    discovered.sort((a, b) => ELEMENTS[a].name.localeCompare(ELEMENTS[b].name));
    discovered.filter(id => ELEMENTS[id].name.toLowerCase().includes(q)).forEach(id => renderItem(grid, id));
    return;
  }

  if (window._sortMode === 'category') {
    CAT_ORDER.forEach(cat => {
      const ids = discovered.filter(id => ELEMENT_CATS[id] === cat);
      if (ids.length === 0) return;
      const catInfo = CATEGORIES[cat];
      const header = document.createElement('div');
      header.className = 'inv-full-row inv-cat-header';
      header.style.cssText = `width:100%;font-size:9px;color:${catInfo.color};padding:4px 2px 2px;border-bottom:1px solid ${hexRgba(catInfo.color, 0.13)};margin-top:2px;text-transform:uppercase;letter-spacing:1px`;
      header.textContent = catInfo.label;
      grid.appendChild(header);
      ids.forEach(id => renderItem(grid, id));
    });
  } else {
    discovered.sort((a, b) => ELEMENTS[a].name.localeCompare(ELEMENTS[b].name));
    discovered.forEach(id => renderItem(grid, id));
  }

  // Пустышки «?» больше не рисуем: 300+ слотов давали огромный скролл и лаги на мобилке.
  // Вместо них — фиксированный подвал панели (всегда виден, вне скролла сетки).
  const bar = document.getElementById('inv-undiscovered-bar');
  if (bar) {
    if (undiscovered.length > 0 && !q) {
      bar.style.display = '';
      bar.textContent = `❓ Неоткрыто: ${undiscovered.length} — смешивай элементы`;
      bar.title = 'Новые элементы откроются смешиванием';
    } else {
      bar.style.display = 'none';
    }
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
  const isFinal = FINAL_IDS.includes(id);
  tip.innerHTML = `
    <div class="tt-header">
      ${buildIconSVG(id, 16)}
      <span class="tt-name">${el.name}</span>
    </div>
    <div class="tt-cat">${catInfo ? catInfo.label : ''}${isFinal ? ' · 🏁 финал' : ''}</div>
    <div class="tt-desc">${el.desc}</div>
    ${isFinal ? '<div class="tt-final" title="Из этого элемента ничего не крафтится — можно не пробовать">🏁 Финальный: ни во что не входит</div>' : ''}
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
    if (id === state.pendingReveal) {
      item.style.background = 'linear-gradient(135deg, rgba(90,90,130,0.25), rgba(60,60,90,0.08))';
      item.style.borderColor = 'rgba(160,160,190,0.35)';
      const iconDiv = document.createElement('div');
      iconDiv.className = 'icon-container';
      iconDiv.textContent = '❔';
      iconDiv.style.fontSize = '28px';
      iconDiv.style.lineHeight = '32px';
      item.appendChild(iconDiv);
      const label = document.createElement('div');
      label.className = 'name-label';
      label.textContent = '???';
      item.appendChild(label);
      grid.appendChild(item);
      return;
    }
    item.style.background = `linear-gradient(135deg, ${hexRgba(el.color, 0.27)}, ${hexRgba(el.color, 0.07)})`;
    item.style.borderColor = hexRgba(el.color, 0.4);
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
    if (FINAL_IDS.includes(id)) {
      const fin = document.createElement('div');
      fin.className = 'final-mark';
      fin.textContent = '🏁';
      fin.title = 'Финальный элемент — ни во что не входит';
      item.appendChild(fin);
    }
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
  header.style.cssText = 'text-align:center;padding:8px;margin-bottom:6px;border-bottom:1px solid rgba(42,42,78,0.27)';
  const wrapCls = 'card-icon-wrap' + (id === 'void' ? ' void' : id === 'abyss' ? ' abyss' : '');
  const wrapStyle = `background:linear-gradient(135deg, ${hexRgba(el.color, 0.27)}, ${hexRgba(el.color, 0.07)});` + (id === 'void' || id === 'abyss' ? '' : `border-color:${hexRgba(el.color, 0.4)}`);
  const cat = ELEMENT_CATS[id];
  const catInfo = CATEGORIES[cat];
  const qtyHave = el.starter || el.infinite ? '∞ в запасе' : `×${state.inventory[id] || 0} в наличии`;
  header.innerHTML = `<div style="text-align:center;margin:0 auto 6px"><span class="${wrapCls}" style="${wrapStyle}">${buildIconSVG(id, 44)}</span></div><div style="font-size:13.5px;font-weight:bold;color:#fff">${el.name}</div><div style="font-size:11px;color:#a8a8c2;margin-top:2px">${el.desc}</div><div style="font-size:10.5px;color:#ffd700aa;margin-top:3px">${catInfo ? catInfo.label : ''} · ${qtyHave}</div>`;
  list.appendChild(header);

  const knownKeys = new Set(notebook.knownRecipes);
  const producing = RECIPES.filter(r => r.output === id && (state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r))));
  if (producing.length > 0) {
    const title = document.createElement('div');
    title.style.cssText = 'font-size:10px;color:#ffd70088;margin:6px 0 4px;text-transform:uppercase;letter-spacing:1px';
    title.textContent = `🧪 Получается из: ${producing.length}`;
    list.appendChild(title);
    producing.forEach(r => {
      const key = recipeKey(r);
      const isFound = state.foundRecipes.has(key);
      const isKnown = !isFound && knownKeys.has(key);
      const formula = r.inputs.map(i => `<span class="recipe-ing" style="color:${textSafeColor(ELEMENTS[i.id]?.color || '#888')}">${buildIconSVG(i.id, 13)}${ELEMENTS[i.id]?.name || i.id}</span>${i.a > 1 ? '×' + i.a : ''}`).join(' + ');
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
    gBtn.title = `Открыть ритуал для «${el.name}»`;
    gBtn.addEventListener('click', () => openGrimoire(id));
    list.appendChild(gBtn);
  }

  const usedIn = RECIPES.filter(r => r.inputs.some(i => i.id === id) && (state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r))));
  if (usedIn.length > 0) {
    const title = document.createElement('div');
    title.style.cssText = 'font-size:10px;color:#ffd70088;margin:8px 0 4px;text-transform:uppercase;letter-spacing:1px';
    title.textContent = `🔗 Можно создать: ${usedIn.length}`;
    list.appendChild(title);
    usedIn.forEach(r => {
      const key = recipeKey(r);
      const isFound = state.foundRecipes.has(key);
      const isKnown = !isFound && knownKeys.has(key);
      const output = ELEMENTS[r.output];
      const others = r.inputs.filter(i => i.id !== id);
      const coFormula = others.length > 0
        ? others.map(i => `<span style="color:${textSafeColor(ELEMENTS[i.id]?.color || '#888')}">${ELEMENTS[i.id]?.name || i.id}</span>${i.a > 1 ? '×' + i.a : ''}`).join(' + ') + ' + '
        : '';
      const entry = document.createElement('div');
      entry.className = 'recipe-entry clickable ' + (isFound ? 'found' : 'known');
      entry.style.marginBottom = '2px';
      entry.title = state.discovered.has(r.output) ? `Открыть: ${output ? output.name : r.output}` : '';
      entry.innerHTML = `${buildIconSVG(r.output, 18)}<span class="recipe-formula">${coFormula}</span><span class="recipe-arrow">→</span> <span class="recipe-result" style="color:${textSafeColor(output ? output.color : '#888')}">${output ? output.name : r.output}</span>${isKnown ? ' <span class="recipe-reveal-mark" title="Раскрыто жертвой">🔮</span>' : ''}`;
      if (state.discovered.has(r.output)) {
        entry.addEventListener('click', () => showElementInfo(r.output));
      }
      list.appendChild(entry);
    });
  }

  if (FINAL_IDS.includes(id)) {
    const fin = document.createElement('div');
    fin.className = 'final-note';
    fin.title = 'Из этого элемента ничего не крафтится — можно не пробовать';
    fin.textContent = '🏁 Финальный элемент — ни во что не входит, время на пробы не тратьте';
    list.appendChild(fin);
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
    addLabel.style.cssText = 'font-size:10px;color:#a8a8c2;margin-bottom:6px;text-transform:uppercase;letter-spacing:1px';
    addLabel.textContent = '📥 Добавить в котёл:';
    addSection.appendChild(addLabel);
    const btnRow = document.createElement('div');
    btnRow.className = 'el-add-row';
    for (let i = 1; i <= maxAdd && i <= 5; i++) {
      const btn = document.createElement('button');
      btn.textContent = `×${i}`;
      btn.title = `Добавить ${i} шт. в котёл`;
      btn.addEventListener('click', () => { addToCauldron(id, i); hideElementInfo(); });
      btnRow.appendChild(btn);
    }
    addSection.appendChild(btnRow);
    list.appendChild(addSection);
  }

  const treeBtn = document.createElement('button');
  treeBtn.className = 'el-tree-btn';
  treeBtn.textContent = '🌳 Древо рецептов';
  treeBtn.title = `Открыть древо: ${el.name}`;
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
  const fill = document.getElementById('hprog-fill');
  if (fill) fill.style.width = (ELEMENT_IDS.length ? Math.round((state.discovered.size / ELEMENT_IDS.length) * 100) : 0) + '%';
}

export function updateCauldronIndicator() {
  const indicator = document.getElementById('cauldron-indicator');
  const entries = Object.entries(state.cauldron);
  if (entries.length === 0) {
    indicator.innerHTML = 'Перетащите элементы в круг';
  } else {
    const parts = entries.map(([id, qty]) => `<span class="cauldron-item-qty">${id === state.pendingReveal ? '❔' : buildIconSVG(id, 14)} ${id === state.pendingReveal ? '???' : ELEMENTS[id].name} <b>×${qty}</b></span>`);
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

export function showWhisperToast(mode = 'solved') {
  const toast = document.getElementById('whisper-toast');
  if (!toast) return;
  const title = toast.querySelector('.whisper-toast-title');
  const desc = toast.querySelector('.whisper-toast-desc');
  if (mode === 'new') {
    if (title) title.textContent = '📖 Новый шёпот';
    if (desc) desc.textContent = 'Хаос шепчет — откройте Гримуар, чтобы прочесть намёк';
  } else {
    if (title) title.textContent = '📖 Загадка из книжки разгадана';
    if (desc) desc.textContent = 'Откройте Гримуар, чтобы прочесть намёк';
  }
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

export function openGrimoire(presetTargetId = null) {
  lastSacrificeReveal = null;
  grimoirePresetTarget = presetTargetId;
  renderNotebook();
  notebook.hasUnseen = false;
  saveNotebook();
  updateNotebookBadge();
  openModalAnimated(document.getElementById('grimoire-modal'));
  if (presetTargetId) {
    requestAnimationFrame(() => {
      const box = document.querySelector('#notebook-content .sacrifice-box');
      if (box) box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

export function closeGrimoire(e) {
  if (e && e.target !== e.currentTarget) return;
  lastSacrificeReveal = null;
  closeModalAnimated('grimoire-modal');
}

const SOURCE_ICONS = { ambient: '❓', oracle: '🔮', prophecy: '✨' };

function renderNotebook() {
  const content = document.getElementById('notebook-content');
  content.innerHTML = '';
  const unresolved = notebook.entries.filter(e => e.type === 'whisper' && !e.resolved);

  if (unresolved.length > 0) {
    const title = document.createElement('div');
    title.className = 'nb-section-title';
    title.textContent = `❓ Неразгаданные шёпоты (${unresolved.length}/4)`;
    content.appendChild(title);
    if (unresolved.length >= 4) {
      const cap = document.createElement('div');
      cap.className = 'sacrifice-hint';
      cap.textContent = 'Новых шёпотов не будет, пока не разгадаешь старые — старые со временем становятся точнее.';
      content.appendChild(cap);
    }
    const SOURCE_LABEL = { ambient: 'шёпот', oracle: 'оракул', prophecy: 'пророчество' };
    const STAGE_ROMAN = ['I', 'II', 'III'];
    unresolved.forEach(e => {
      const row = document.createElement('div');
      row.className = `nb-entry nb-whisper unresolved ${e.source || 'ambient'}`;
      const stage = STAGE_ROMAN[Math.min(Math.max(e.stage || 1, 1), 3) - 1];
      row.innerHTML = `<span class="nb-icon nb-seal nb-seal-whisper">${SOURCE_ICONS[e.source] || '❓'}</span>` +
        `<span class="nb-lore-body"><span class="nb-meta"><span class="nb-tier">${SOURCE_LABEL[e.source] || 'шёпот'} · ${stage} ступень</span></span>` +
        `<span class="nb-text">${renderWhisperText(e)}</span></span>`;
      row.title = 'Разгадай — смешай то, на что намекает шёпот';
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
  if (recipes.length === 0) return { lines: ['Тайна откроется по мере ваших открытий'], progress: null, tier: 1, total: 0, knownCount: 0, ratio: 0 };
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
    lines.push(`Нужны редкие составляющие (${total}). Открывайте новые элементы — подсказки появятся сами`);
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
        lines.push(`${ELEMENTS[i].name}: создаётся из «${subCats.join('», «')}»`);
      });
    }
  }

  const progress = ratio > 0 && ratio < 1 ? `${knownCount}/${total}` : null;
  return { lines, progress, tier, total, knownCount, ratio };
}

const LEGEND_TIER_LABEL = { 1: 'тайна', 2: 'след', 3: 'близко', 4: 'готово' };

function renderLegendarySection(content) {
  const foundCount = LEGENDARY_IDS.filter(id => state.discovered.has(id)).length;
  const title = document.createElement('div');
  title.className = 'nb-section-title';
  title.innerHTML = `👑 Легенды <span class="nb-count">${foundCount}/${LEGENDARY_IDS.length}</span>`;
  content.appendChild(title);

  // Ближайшие к открытию — сверху, найденные — первыми
  const ordered = [...LEGENDARY_IDS].sort((a, b) => {
    const fa = state.discovered.has(a) ? 1 : 0, fb = state.discovered.has(b) ? 1 : 0;
    if (fa !== fb) return fb - fa;
    const ia = getLegendProgressInfo(a), ib = getLegendProgressInfo(b);
    if (ia.tier !== ib.tier) return ib.tier - ia.tier;
    return (ib.ratio || 0) - (ia.ratio || 0);
  });

  ordered.forEach(id => {
    const el = ELEMENTS[id];
    if (!el) return;
    const found = state.discovered.has(id);
    const row = document.createElement('div');
    if (found) {
      row.className = 'nb-entry nb-legend found';
      row.innerHTML = `<span class="nb-icon nb-seal">${buildIconSVG(id, 22)}</span>
        <span class="nb-lore-body"><span class="nb-lore-name">${el.name} <span class="nb-stars">★★★</span></span><span class="nb-lore-desc">${el.desc}</span></span>
        <span class="nb-target">✔</span>`;
    } else {
      const { lines, progress, tier, total, ratio } = getLegendProgressInfo(id);
      row.className = `nb-entry nb-legend locked t${tier}` + (tier >= 3 ? ' near' : '');
      const hintHtml = lines.map(l => `<span class="nb-hint">${l}</span>`).join('');
      const pct = Math.round((ratio || 0) * 100);
      const icon = tier >= 4 ? '🗝' : tier === 3 ? '🔍' : '🔒';
      row.innerHTML = `<span class="nb-icon nb-seal">${icon}</span>
        <span class="nb-lore-body"><span class="nb-lore-name">${el.name}</span><span class="nb-meta"><span class="nb-tier">${LEGEND_TIER_LABEL[tier] || ''}</span>${total ? `<span class="nb-need">◆ ${total}</span>` : ''}</span>${hintHtml}<span class="nb-bar"><i style="width:${pct}%"></i></span></span>
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
let lastSacrificeReveal = null;
let grimoirePresetTarget = null;

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

  // Алтарь-превью: цель 🔥 жертва + прогресс цели
  const altar = document.createElement('div');
  altar.className = 'sacrifice-altar';
  const tSide = document.createElement('div');
  tSide.className = 'sacrifice-side s-target';
  const dSide = document.createElement('div');
  dSide.className = 'sacrifice-side s-donor';
  const fire = document.createElement('div');
  fire.className = 'sacrifice-fire';
  fire.textContent = '🔥';
  altar.appendChild(tSide);
  altar.appendChild(fire);
  altar.appendChild(dSide);
  box.appendChild(altar);

  if (lastSacrificeReveal && lastSacrificeReveal.recipe) {
    const rev = lastSacrificeReveal;
    const r = rev.recipe;
    const formula = r.inputs.map(i => `${ELEMENTS[i.id]?.name || i.id}${i.a > 1 ? '×' + i.a : ''}`).join(' + ') +
      ` → ${ELEMENTS[r.output]?.name || r.output}`;
    const revBox = document.createElement('div');
    revBox.className = 'sacrifice-reveal' + (rev.fresh ? ' fresh' : '');
    revBox.innerHTML = `<div class="rev-fire">🔥</div><div class="rev-title">Жертва принята!</div><div class="rev-formula">${formula}</div>`;
    for (let i = 0; i < 14; i++) {
      const em = document.createElement('span');
      em.className = 'ember';
      em.style.left = (4 + Math.random() * 92) + '%';
      em.style.animationDelay = (Math.random() * 0.9).toFixed(2) + 's';
      em.style.animationDuration = (1.4 + Math.random() * 1.2).toFixed(2) + 's';
      const sz = 3 + Math.round(Math.random() * 3);
      em.style.width = sz + 'px';
      em.style.height = sz + 'px';
      revBox.appendChild(em);
    }
    box.appendChild(revBox);
    rev.fresh = false;
  }

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
  // Переход из инфо-панели: подставляем нужный элемент целью ритуала
  if (grimoirePresetTarget && targets.includes(grimoirePresetTarget)) {
    targetSelect.value = grimoirePresetTarget;
  }
  grimoirePresetTarget = null;
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

  const updateAltar = () => {
    const tId = targetSelect.value, dId = donorSelect.value;
    const tEl = tId ? ELEMENTS[tId] : null, dEl = dId ? ELEMENTS[dId] : null;
    const p = tId ? getRecipeProgressForOutput(tId) : null;
    const pct = p && p.total > 0 ? Math.round((p.revealed / p.total) * 100) : 0;
    tSide.innerHTML = tEl
      ? `<div class="s-icon">${buildIconSVG(tId, 28)}</div><div class="s-name">${tEl.name}</div><div class="s-sub">раскрыто ${p.revealed}/${p.total}</div><div class="sacrifice-progress"><i style="width:${pct}%"></i></div>`
      : `<div class="s-icon">?</div>`;
    const dQty = dId ? (state.inventory[dId] || 0) : 0;
    dSide.innerHTML = dEl
      ? `<div class="s-icon">${buildIconSVG(dId, 28)}</div><div class="s-name">${dEl.name}</div><div class="s-sub">в наличии ×${dQty}</div>`
      : `<div class="s-icon">?</div>`;
  };

  const updateDeductNote = () => {
    const donorId = donorSelect.value;
    const donor = donorId ? ELEMENTS[donorId] : null;
    if (!donor || !sacrificeRolledRecipe) {
      deductNote.textContent = 'Спишется: —';
      deductNote.classList.remove('bad');
      btn.disabled = true;
      updateAltar();
      return;
    }
    const required = getRequiredAmount(sacrificeRolledRecipe, donorId);
    const qty = state.inventory[donorId] || 0;
    const bad = required > qty;
    deductNote.textContent = bad
      ? `🔥 Спишется: ${required} × ${donor.name} — не хватает (есть ${qty})`
      : `🔥 Спишется: ${required} × ${donor.name}`;
    deductNote.classList.toggle('bad', bad);
    btn.disabled = bad || !targetSelect.value || !donorId;
    btn.textContent = bad ? 'Не хватает жертвы' : '🔥 Пожертвовать и узнать';
    updateAltar();
  };
  donorSelect.addEventListener('change', updateDeductNote);

  const rollRecipe = () => {
    sacrificeRolledRecipe = targetSelect.value ? pickSacrificeRecipe(targetSelect.value) : null;
    const cost = buildSacrificeDonors(donorSelect, sacrificeRolledRecipe);
    costNote.textContent = `✨ Стоимость рецепта: ${cost > 0 ? cost + ' очков силы' : '—'}`;
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
    lastSacrificeReveal = { recipe: sacrificeRolledRecipe, targetId, fresh: true };
    playDiscover();
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

function achEmoji(a) {
  const m = /^(\p{Extended_Pictographic}\uFE0F?|\p{Emoji_Presentation}|\S)/u.exec(a.name.trim());
  return m ? m[1] : '🏆';
}

function achText(a) {
  return a.name.replace(/^\S+\s+/, '');
}

function getAchProgress(a) {
  const s = state;
  const num = (cur, max) => ({ cur: Math.min(cur, max), max });
  switch (a.id) {
    case 'firstMix': return num(s.stats.mixCount, 1);
    case 'discover10': return num(s.discovered.size, 10);
    case 'discover25': return num(s.discovered.size, 25);
    case 'discover40': return num(s.discovered.size, 40);
    case 'discoverAll': return num(s.discovered.size, ELEMENT_IDS.length);
    case 'recipes10': return num(s.foundRecipes.size, 10);
    case 'recipes25': return num(s.foundRecipes.size, 25);
    case 'recipes50': return num(s.foundRecipes.size, 50);
    case 'recipesAll': return num(s.foundRecipes.size, RECIPES.length);
    case 'firstBoom': return num(s.stats.explosionCount, 1);
    case 'boom10': return num(s.stats.explosionCount, 10);
    case 'fromAshes': return num(s.stats.discoveryFromExplosion, 1);
    case 'massProd': return num(s.stats.totalCreated, 500);
    case 'allVariants': return num(VARIANTS.filter(v => s.discovered.has(v)).length, VARIANTS.length);
    default: {
      // Общий случай: вытаскиваем все has('id') из check и считаем долю
      try {
        const ids = [...new Set([...a.check.toString().matchAll(/has\('([^']+)'\)/g)].map(m => m[1]))];
        if (ids.length > 0) return num(ids.filter(id => s.discovered.has(id)).length, ids.length);
      } catch {}
      return null;
    }
  }
}

function renderAchievements() {
  const list = document.getElementById('achievement-list');
  list.innerHTML = '';
  const total = ACHIEVEMENTS.length;
  const got = state.achievements.size;
  const head = document.createElement('div');
  head.className = 'ach-summary';
  const pct = total ? Math.round((got / total) * 100) : 0;
  head.innerHTML = `<div class="ach-summary-top"><span>Открыто <b>${got}/${total}</b></span><span>${pct}%</span></div><div class="ach-summary-bar"><i style="width:${pct}%"></i></div>`;
  list.appendChild(head);
  ACHIEVEMENTS.forEach(a => {
    const unlocked = state.achievements.has(a.id);
    const p = !unlocked ? getAchProgress(a) : null;
    const item = document.createElement('div');
    item.className = 'ach-item ' + (unlocked ? 'unlocked' : 'locked') + (p && p.max > 1 && p.cur >= p.max - 1 && p.cur < p.max ? ' near' : '');
    const icon = unlocked ? achEmoji(a) : `<span class="ach-lock-emoji">${achEmoji(a)}</span>`;
    const bar = (!unlocked && p && p.max > 1)
      ? `<div class="ach-bar"><i style="width:${Math.round((p.cur / p.max) * 100)}%"></i></div><div class="ach-prog">${p.cur}/${p.max}</div>`
      : ((!unlocked && p && p.max === 1) ? '' : '');
    item.innerHTML = `<div class="ach-icon">${icon}</div><div class="ach-info"><div class="ach-name">${achText(a)}</div><div class="ach-desc">${unlocked ? a.desc : (p && p.max > 1 ? `${a.desc} · ${p.cur}/${p.max}` : '???')}</div>${bar}</div><div class="ach-check">${unlocked ? '✅' : '🔒'}</div>`;
    item.title = unlocked ? a.desc : (p ? `${a.desc} — ${p.cur}/${p.max}` : '???');
    list.appendChild(item);
  });
}

export function openAchievements() {
  renderAchievements();
  openModalAnimated(document.getElementById('achievement-modal'));
}

export function closeAchievements(e) {
  if (e && e.target !== e.currentTarget) return;
  closeModalAnimated('achievement-modal');
}

// ─── Recipe Tree ───
const TREE_MAX_ITEMS = 10;

function bringModalToFront(modal) {
  // Дерево всегда выше roadmap (фикс «модалка под модалкой»)
  const base = modal.id === 'tree-modal' ? 1200 : modal.id === 'roadmap-modal' ? 1050 : modal.id === 'welcome-modal' ? 1300 : 1000;
  modal.style.zIndex = String(base);
  modal.classList.remove('modal-closing');
  const t = modal._closeTimer;
  if (t) { clearTimeout(t); modal._closeTimer = null; }
}

const MODAL_CLOSE_MS = 160;

export function openModalAnimated(modal) {
  bringModalToFront(modal);
  modal.style.display = '';
  // Перезапуск open-анимации при быстром переоткрытии
  const box = modal.querySelector('.modal-box');
  if (box) {
    box.style.animation = 'none';
    // eslint-disable-next-line no-unused-expressions
    box.offsetHeight;
    box.style.animation = '';
  }
}

export function closeModalAnimated(idOrEl) {
  const modal = typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl;
  if (!modal || modal.style.display === 'none' || modal.classList.contains('modal-closing')) return;
  modal.classList.add('modal-closing');
  modal._closeTimer = setTimeout(() => {
    modal.style.display = 'none';
    modal.classList.remove('modal-closing');
    modal._closeTimer = null;
  }, MODAL_CLOSE_MS);
}

export function openTree(id) {
  const modal = document.getElementById('tree-modal');
  const content = document.getElementById('tree-content');
  content.innerHTML = '';
  const el = ELEMENTS[id];
  if (!el) return;
  const header = modal.querySelector('.modal-header span');
  header.textContent = `🌳 Древо: ${el.name}`;
  renderTreeNode(id, 0, new Set([id]), content, true);
  openModalAnimated(modal);
  content.parentElement.scrollTop = 0;
}

export function closeTree(e) {
  if (e && e.target !== e.currentTarget) return;
  closeModalAnimated('tree-modal');
}

function treeCycleBadge(name) {
  const d = document.createElement('div');
  d.className = 'tree-leaf tree-cycle';
  d.textContent = `${name} · уже выше`;
  d.title = 'Уже показано выше, чтобы не зацикливать древо';
  return d;
}

function treeFormulaRow(r) {
  const div = document.createElement('div');
  div.className = 'tree-formula';
  const formula = r.inputs.map(i => `${ELEMENTS[i.id]?.name || i.id}${i.a > 1 ? '×' + i.a : ''}`).join(' + ');
  div.textContent = formula + ` → ${ELEMENTS[r.output]?.name || r.output}`;
  div.title = formula + ` → ${ELEMENTS[r.output]?.name || r.output}`;
  return div;
}

function renderTreeNode(id, depth, visited, container, isRoot = false) {
  if (depth > 2) {
    const div = document.createElement('div');
    div.className = 'tree-more';
    div.textContent = '··· глубже — откройте карточку элемента';
    container.appendChild(div);
    return;
  }
  const el = ELEMENTS[id];
  if (!el) return;
  const knownKeys = new Set(notebook.knownRecipes);
  const isKnownRecipe = (r) => state.foundRecipes.has(recipeKey(r)) || knownKeys.has(recipeKey(r));
  const node = document.createElement('div');
  node.className = 'tree-node';
  const content = document.createElement('div');
  content.className = 'tree-node-content' + (isRoot ? ' tree-root' : '');
  content.innerHTML = `${buildIconSVG(id, 18)}<span style="color:#fff">${el.name}</span>`;
  content.title = isRoot ? el.name : `Открыть древо: ${el.name}`;
  if (!isRoot) content.addEventListener('click', () => openTree(id));
  node.appendChild(content);
  container.appendChild(node);

  const children = document.createElement('div');
  children.className = 'tree-children';

  if (!el.starter) {
    const producing = RECIPES.filter(r => r.output === id && isKnownRecipe(r)).slice(0, TREE_MAX_ITEMS);
    const producingAll = RECIPES.filter(r => r.output === id && isKnownRecipe(r)).length;
    if (producing.length > 0) {
      const title = document.createElement('div');
      title.className = 'tree-section-title';
      title.textContent = '🧪 Получается из:';
      children.appendChild(title);
      producing.forEach(r => {
        children.appendChild(treeFormulaRow(r));
        r.inputs.forEach(inp => {
          if (visited.has(inp.id)) {
            children.appendChild(treeCycleBadge(ELEMENTS[inp.id]?.name || inp.id));
          } else {
            const nextVisited = new Set(visited);
            nextVisited.add(inp.id);
            renderTreeNode(inp.id, depth + 1, nextVisited, children);
          }
        });
      });
      if (producingAll > producing.length) {
        const more = document.createElement('div');
        more.className = 'tree-more';
        more.textContent = `+ ещё ${producingAll - producing.length} рецептов`;
        children.appendChild(more);
      }
    }
  }

  const usedInAll = RECIPES.filter(r => r.inputs.some(i => i.id === id) && isKnownRecipe(r));
  const usedIn = usedInAll.slice(0, TREE_MAX_ITEMS);
  if (usedIn.length > 0) {
    const title = document.createElement('div');
    title.className = 'tree-section-title';
    title.textContent = '🔗 Создаёт:';
    children.appendChild(title);
    usedIn.forEach(r => {
      children.appendChild(treeFormulaRow(r));
      if (visited.has(r.output)) {
        children.appendChild(treeCycleBadge(ELEMENTS[r.output]?.name || r.output));
      } else {
        const nextVisited = new Set(visited);
        nextVisited.add(r.output);
        renderTreeNode(r.output, depth + 1, nextVisited, children);
      }
    });
    if (usedInAll.length > usedIn.length) {
      const more = document.createElement('div');
      more.className = 'tree-more';
      more.textContent = `+ ещё ${usedInAll.length - usedIn.length} рецептов`;
      children.appendChild(more);
    }
  }

  if (children.children.length > 0) container.appendChild(children);
}

// ─── Statistics ───
function formatTime(msOrStart) {
  // Новый режим: msOrStart — это уже миллисекунды наигранного времени.
  // Старый режим (timestamp старта) поддерживаем для совместимости, но режем офлайн-накрутку.
  let playMs;
  if (typeof msOrStart === 'number' && msOrStart > 100000000000) {
    // Похоже на timestamp → считаем как раньше, но кап 24ч, чтобы не было «1532ч»
    playMs = Math.min(Date.now() - msOrStart, 24 * 3600 * 1000);
  } else {
    playMs = msOrStart || 0;
  }
  if (!playMs || playMs < 60000) return playMs > 0 ? 'меньше минуты' : '—';
  const totalMin = Math.floor(playMs / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h >= 100) return `${h}ч`;
  if (h > 0) return `${h}ч ${m}м`;
  return `${m}м`;
}

function renderStats() {
  const s = state.stats;
  const mostCreated = Object.entries(s.elementCreatedCount).sort((a, b) => b[1] - a[1]);
  const top = mostCreated.length > 0 && mostCreated[0][1] > 0 ? `${ELEMENTS[mostCreated[0][0]]?.name || mostCreated[0][0]} (${mostCreated[0][1]})` : '—';
  document.getElementById('stats-time').textContent = formatTime(getPlayMs());
  document.getElementById('stats-discovered').textContent = `${state.discovered.size} / ${ELEMENT_IDS.length}`;
  document.getElementById('stats-recipes').textContent = `${state.foundRecipes.size} / ${RECIPES.length}`;
  document.getElementById('stats-mixes').textContent = s.mixCount;
  document.getElementById('stats-explosions').textContent = s.explosionCount;
  document.getElementById('stats-from-ashes').textContent = s.discoveryFromExplosion;
  document.getElementById('stats-created').textContent = s.totalCreated;
  document.getElementById('stats-achievements').textContent = `${state.achievements.size} / ${ACHIEVEMENTS.length}`;
  const topEl = document.getElementById('stats-top-element');
  const topId = mostCreated.length > 0 && mostCreated[0][1] > 0 ? mostCreated[0][0] : null;
  topEl.innerHTML = topId ? `${buildIconSVG(topId, 20)}<span>${top}</span>` : top;
  const setBar = (id, cur, max) => {
    const b = document.getElementById(id);
    if (b) b.style.width = (max ? Math.min(100, Math.round((cur / max) * 100)) : 0) + '%';
  };
  setBar('bar-discovered', state.discovered.size, ELEMENT_IDS.length);
  setBar('bar-recipes', state.foundRecipes.size, RECIPES.length);
  setBar('bar-achievements', state.achievements.size, ACHIEVEMENTS.length);
  const sess = document.getElementById('stats-session');
  if (sess) {
    const sessMs = s.sessionStart ? Math.max(0, Date.now() - s.sessionStart) : 0;
    sess.textContent = sessMs >= 60000 ? `сессия ${formatTime(sessMs)}` : '';
  }
}

export function openStats() {
  renderStats();
  openModalAnimated(document.getElementById('stats-modal'));
}

export function closeStats(e) {
  if (e && e.target !== e.currentTarget) return;
  closeModalAnimated('stats-modal');
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
    const parentNames = parents.map(pid => ELEMENTS[pid]?.name || pid).join(' + ');
    card.title = parentNames ? `${el.name} ← ${parentNames}` : el.name;
    card.innerHTML = `${buildIconSVG(id, 22)}<span class="roadmap-name" title="${el.name}">${el.name}</span>`;
    if (parents.length > 0) {
      const parentDots = document.createElement('div');
      parentDots.className = 'roadmap-parents';
      parentDots.title = `Из: ${parentNames}`;
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
    card.title = 'Не открыт — смешивайте элементы, чтобы открыть';
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
    label.innerHTML = `Ур.${d}`;
    label.title = d === 0 ? 'Базовые стихии' : `Глубина крафта ${d}`;
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

  if (content.children.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'nb-empty';
    empty.textContent = 'Пока ничего не открыто на этой глубине. Включите «Показать всё», чтобы увидеть спойлеры.';
    content.appendChild(empty);
  } else {
    const legend = document.createElement('div');
    legend.className = 'roadmap-legend';
    legend.innerHTML = '● — цвет точки = родительский элемент (наведите, чтобы увидеть имя). Клик по карточке — древо рецепта.';
    content.appendChild(legend);
  }

}

export function openCraftRoadmap() {
  const modal = document.getElementById('roadmap-modal');
  const content = document.getElementById('roadmap-content');
  content.innerHTML = '';
  const checkbox = document.getElementById('roadmap-spoiler');
  checkbox.onchange = renderCraftRoadmap;
  renderCraftRoadmap();
  openModalAnimated(modal);
  content.scrollTop = 0;
}

export function closeCraftRoadmap(e) {
  if (e && e.target !== e.currentTarget) return;
  closeModalAnimated('roadmap-modal');
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
