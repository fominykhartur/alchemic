import { ELEMENTS } from './data.js';
import { state } from './state.js';
import { performMix, canvas, W, H, CX, CY, RADIUS } from './canvas.js';
import { log, updateUI, hideElementInfo, closeAchievements, closeTree, closeGrimoire, isDraggingElement } from './ui.js';
import { finishWelcome } from './welcome.js';

const CANVAS_LONG_PRESS_MS = 500;
let canvasPress = null;

function canvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    cx: (e.clientX - rect.left) * (W / rect.width),
    cy: (e.clientY - rect.top) * (H / rect.height),
  };
}

function getEntryAt(cx, cy) {
  const entries = Object.entries(state.cauldron);
  const count = entries.length;
  if (count === 0) return null;
  let best = null;
  let bestDist = 400;
  entries.forEach(([id, qty], i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const dist = RADIUS * 0.4;
    const ox = CX + Math.cos(angle) * dist;
    const oy = CY + Math.sin(angle) * dist;
    const d = (cx - ox) ** 2 + (cy - oy) ** 2;
    if (d < bestDist) { bestDist = d; best = { id, qty }; }
  });
  return best && bestDist < 25 * 25 ? best : null;
}

function returnOne(id) {
  const amt = state.cauldron[id];
  if (!amt || amt <= 0) return;
  state.cauldron[id]--;
  if (ELEMENTS[id]?.starter || ELEMENTS[id]?.infinite) {
    log(`↩ ${ELEMENTS[id].name} возвращён (бесконечный)`, 'info');
  } else {
    state.inventory[id] = (state.inventory[id] || 0) + 1;
    log(`↩ ${ELEMENTS[id].name} возвращён в инвентарь`, 'info');
  }
  if (state.cauldron[id] <= 0) delete state.cauldron[id];
  updateUI();
}

function returnAll(id) {
  const qty = state.cauldron[id] || 0;
  if (!qty) return;
  delete state.cauldron[id];
  if (ELEMENTS[id]?.starter || ELEMENTS[id]?.infinite) {
    log(`↩ ${ELEMENTS[id].name} ×${qty} возвращён (бесконечный)`, 'info');
  } else {
    state.inventory[id] = (state.inventory[id] || 0) + qty;
    log(`↩ ${ELEMENTS[id].name} ×${qty} возвращён в инвентарь`, 'info');
  }
  updateUI();
}

export function setupEventListeners() {
  // Canvas: tap → return 1, long-press → return all, right-click → return all
  canvas.addEventListener('pointerdown', (e) => {
    if (state.animating || isDraggingElement()) return;
    if (e.pointerType === 'mouse' && e.button === 2) return;
    canvasPress = {
      pointerId: e.pointerId,
      done: false,
      event: e,
      timer: setTimeout(() => {
        if (!canvasPress || canvasPress.done) return;
        canvasPress.done = true;
        const { cx, cy } = canvasCoords(canvasPress.event);
        const entry = getEntryAt(cx, cy);
        if (entry) returnAll(entry.id);
      }, CANVAS_LONG_PRESS_MS),
    };
  });

  canvas.addEventListener('pointerup', (e) => {
    if (canvasPress && e.pointerId === canvasPress.pointerId) {
      clearTimeout(canvasPress.timer);
      const press = canvasPress;
      canvasPress = null;
      if (press.done || state.animating) return;
      const { cx, cy } = canvasCoords(e);
      const entry = getEntryAt(cx, cy);
      if (entry) returnOne(entry.id);
    }
  });

  canvas.addEventListener('pointercancel', () => {
    if (canvasPress) { clearTimeout(canvasPress.timer); canvasPress = null; }
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (state.animating) return;
    const { cx, cy } = canvasCoords(e);
    const entry = getEntryAt(cx, cy);
    if (entry) returnAll(entry.id);
  });

  // Mix button
  document.getElementById('mix-btn').addEventListener('click', performMix);

  // Clear button
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (state.animating) return;
    const entries = Object.entries(state.cauldron);
    entries.forEach(([id, qty]) => {
      if (!ELEMENTS[id]?.starter && !ELEMENTS[id]?.infinite) state.inventory[id] = (state.inventory[id] || 0) + qty;
    });
    const total = entries.reduce((s, [,v]) => s + v, 0);
    state.cauldron = {};
    state.cauldronEntryTime = {};
    if (total > 0) log(`↩ ${total} ед. возвращено в инвентарь`, 'info');
    updateUI();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const welcomeOpen = document.getElementById('welcome-modal')?.style.display !== 'none';
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey && !welcomeOpen) performMix();
    if (e.key === 'Escape') {
      if (welcomeOpen) { finishWelcome(); return; }
      hideElementInfo();
      closeAchievements();
      closeTree();
      closeGrimoire();
    }
  });

  // Close qty-popup on outside click
  document.addEventListener('click', (e) => {
    const popup = document.getElementById('qty-popup');
    if (popup.style.display === 'block' && !popup.contains(e.target)) {
      document.getElementById('qty-popup').style.display = 'none';
    }
  });
}
