import { ELEMENTS, ELEMENT_IDS, ELEMENT_CATS, CATEGORIES, RECIPES, ACHIEVEMENTS, VARIANTS, recipeKey, CAT_ORDER, TREE_MAX_DEPTH } from './data.js';
import { buildIconSVG, ICON_DESIGNS, TIER } from './icons.js';
import { state, saveGame } from './state.js';
import { playDrop, playAchievement } from './audio.js';

// ─── Drag state ───
export let dragData = null;

export function onDragStart(e) {
  const id = e.target.closest('.inv-item')?.dataset.elementId;
  if (!id || !state.discovered.has(id)) { e.preventDefault(); return; }
  const el = ELEMENTS[id];
  if (!el) { e.preventDefault(); return; }
  if (!el.starter && (!state.inventory[id] || state.inventory[id] <= 0)) { e.preventDefault(); return; }
  dragData = { id, amount: 1 };
  e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  e.dataTransfer.effectAllowed = 'copy';
  e.target.classList.add('dragging');
}

export function onDragEnd(e) {
  e.target.classList.remove('dragging');
}

// ─── Quantity popup ───
let qtyPopupElement = null;

export function showQtyPopup(e, elementId) {
  const popup = document.getElementById('qty-popup');
  const btnContainer = popup.querySelector('.qty-buttons');
  btnContainer.innerHTML = '';
  const el = ELEMENTS[elementId];
  const maxQty = el?.starter ? 9 : Math.min(state.inventory[elementId] || 0, 9);
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
  if (!el.starter && (!state.inventory[id] || state.inventory[id] < amount)) return;
  state.cauldron[id] = (state.cauldron[id] || 0) + amount;
  if (!el.starter) state.inventory[id] -= amount;
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
    <div class="tt-qty">${el.starter ? '∞ в запасе' : 'В наличии: ' + qty}</div>
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
    qtyEl.textContent = el.starter ? '∞' : qty;
    if (qty > 0 || el.starter) item.appendChild(qtyEl);
    const label = document.createElement('div');
    label.className = 'name-label';
    label.textContent = el.name;
    item.appendChild(label);
    item.draggable = qty > 0 || el.starter;
    item.addEventListener('dragstart', onDragStart);
    item.addEventListener('dragend', onDragEnd);
    item.addEventListener('click', (e) => { if (qty > 0 || el.starter) showElementInfo(id); });
    item.addEventListener('mousedown', (e) => {
      if (e.shiftKey && (qty > 0 || el.starter)) { e.preventDefault(); showQtyPopup(e, id); }
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
  elementInfoActive = id;

  const list = document.getElementById('recipes-list');
  list.innerHTML = '';
  const panelTitle = document.querySelector('#recipes-panel .panel-title');
  panelTitle.innerHTML = `<a href="#" onclick="hideElementInfo();return false" style="color:#ffd700;text-decoration:none;margin-right:6px">←</a> ${el.name}`;

  const header = document.createElement('div');
  header.style.cssText = 'text-align:center;padding:8px;margin-bottom:6px;border-bottom:1px solid #2a2a4e44';
  header.innerHTML = `<div style="text-align:center;margin:0 auto 6px">${buildIconSVG(id, 44)}</div><div style="font-size:13px;font-weight:bold;color:#fff">${el.name}</div><div style="font-size:10px;color:#888;margin-top:2px">${el.desc}</div>`;
  list.appendChild(header);

  const producing = RECIPES.filter(r => r.output === id && state.foundRecipes.has(recipeKey(r)));
  if (producing.length > 0) {
    const title = document.createElement('div');
    title.style.cssText = 'font-size:10px;color:#ffd70088;margin:6px 0 4px;text-transform:uppercase;letter-spacing:1px';
    title.textContent = '🧪 Получается из:';
    list.appendChild(title);
    producing.forEach(r => {
      const formula = r.inputs.map(i => `<span style="color:${ELEMENTS[i.id]?.color || '#888'}">${ELEMENTS[i.id]?.name || i.id}</span>${i.a > 1 ? '×' + i.a : ''}`).join(' + ');
      const entry = document.createElement('div');
      entry.className = 'recipe-entry found';
      entry.style.marginBottom = '2px';
      entry.innerHTML = `<span class="recipe-formula">${formula}</span>`;
      list.appendChild(entry);
    });
  } else if (!el.starter) {
    const none = document.createElement('div');
    none.style.cssText = 'font-size:10px;color:#555;margin:4px 0';
    none.textContent = '🔒 Рецепт ещё не открыт';
    list.appendChild(none);
  }

  const usedIn = RECIPES.filter(r => r.inputs.some(i => i.id === id) && state.foundRecipes.has(recipeKey(r)));
  if (usedIn.length > 0) {
    const title = document.createElement('div');
    title.style.cssText = 'font-size:10px;color:#ffd70088;margin:8px 0 4px;text-transform:uppercase;letter-spacing:1px';
    title.textContent = '🔗 Можно создать:';
    list.appendChild(title);
    usedIn.forEach(r => {
      const output = ELEMENTS[r.output];
      const entry = document.createElement('div');
      entry.className = 'recipe-entry found';
      entry.style.marginBottom = '2px';
      entry.innerHTML = `<span class="recipe-arrow" style="margin:0">→</span> <span class="recipe-result" style="color:${output ? output.color : '#888'}">${output ? output.name : r.output}</span>`;
      list.appendChild(entry);
    });
  }

  if (producing.length === 0 && usedIn.length === 0 && !el.starter) {
    const none = document.createElement('div');
    none.style.cssText = 'font-size:10px;color:#555;text-align:center;padding:10px';
    none.textContent = '🔒 Нет открытых рецептов';
    list.appendChild(none);
  }

  const addSection = document.createElement('div');
  addSection.style.cssText = 'margin-top:10px;padding-top:8px;border-top:1px solid #2a2a4e44';
  const addLabel = document.createElement('div');
  addLabel.style.cssText = 'font-size:10px;color:#888;margin-bottom:4px';
  addLabel.textContent = '📥 Добавить в котёл:';
  addSection.appendChild(addLabel);
  const btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:3px;flex-wrap:wrap';
  const maxAdd = el.starter ? 9 : Math.min(state.inventory[id] || 0, 9);
  for (let i = 1; i <= maxAdd && i <= 5; i++) {
    const btn = document.createElement('button');
    btn.style.cssText = 'background:#1a1a2e;border:1px solid #3a2a5e;border-radius:4px;color:#ccc;padding:3px 8px;font-size:11px;cursor:pointer';
    btn.textContent = `×${i}`;
    btn.addEventListener('click', () => { addToCauldron(id, i); hideElementInfo(); });
    btnRow.appendChild(btn);
  }
  addSection.appendChild(btnRow);
  list.appendChild(addSection);

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
  const foundAny = RECIPES.some(r => state.foundRecipes.has(recipeKey(r)));
  if (!foundAny) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:#555;text-align:center;padding:20px;font-size:13px;';
    empty.textContent = '🔒 Рецепты будут открываться по мере смешивания';
    list.appendChild(empty);
    return;
  }
  RECIPES.forEach(r => {
    if (!state.foundRecipes.has(recipeKey(r))) return;
    const output = ELEMENTS[r.output];
    const entry = document.createElement('div');
    entry.className = 'recipe-entry found';
    const formula = r.inputs.map(i => `<span style="color:${ELEMENTS[i.id]?.color || '#888'}">${ELEMENTS[i.id]?.name || i.id}</span>${i.a > 1 ? '×' + i.a : ''}`).join(' + ');
    entry.innerHTML = `<span class="recipe-formula">${formula}</span><span class="recipe-arrow">→</span><span class="recipe-result" style="color:${output ? output.color : '#888'}">${output ? output.name : r.output}</span>${r.ratio ? `<div class="recipe-dominance-hint">${ELEMENTS[r.ratio.id]?.name || r.ratio.id} преобладает</div>` : ''}`;
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
  }
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
    const producing = RECIPES.filter(r => r.output === id && state.foundRecipes.has(recipeKey(r)));
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

  const usedIn = RECIPES.filter(r => r.inputs.some(i => i.id === id) && state.foundRecipes.has(recipeKey(r)));
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
