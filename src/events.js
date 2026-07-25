import { ELEMENTS } from './data.js';
import { state } from './state.js';
import { playDrop } from './audio.js';
import { performMix, canvas, CX, CY, RADIUS } from './canvas.js';
import { log, updateUI, hideElementInfo, closeAchievements, closeTree } from './ui.js';

export function setupEventListeners() {
  // Canvas drop zone
  canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    let data;
    try { data = JSON.parse(e.dataTransfer.getData('text/plain')); } catch { data = null; }
    if (!data || !data.id) return;
    const id = data.id;
    const amount = data.amount || 1;
    if (!state.discovered.has(id)) return;
    const el = ELEMENTS[id];
    if (!el) return;
    if (!el.starter && (!state.inventory[id] || state.inventory[id] < amount)) return;
    state.cauldron[id] = (state.cauldron[id] || 0) + amount;
    if (!el.starter) state.inventory[id] -= amount;
    playDrop();
    updateUI();
  });

  // Canvas click — remove one unit
  canvas.addEventListener('click', (e) => {
    if (state.animating) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = mx * scaleX;
    const cy = my * scaleY;
    const entries = Object.entries(state.cauldron);
    const count = entries.length;
    if (count === 0) return;
    entries.forEach(([id, qty], i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const dist = RADIUS * 0.4;
      const ox = CX + Math.cos(angle) * dist;
      const oy = CY + Math.sin(angle) * dist;
      const dx = cx - ox;
      const dy = cy - oy;
      if (dx * dx + dy * dy < 20 * 20) {
        const amt = state.cauldron[id];
        if (amt > 0) {
          state.cauldron[id]--;
          if (ELEMENTS[id]?.starter) {
            log(`↩ ${ELEMENTS[id].name} возвращён (бесконечный)`, 'info');
          } else {
            state.inventory[id] = (state.inventory[id] || 0) + 1;
            log(`↩ ${ELEMENTS[id].name} возвращён в инвентарь`, 'info');
          }
          if (state.cauldron[id] <= 0) delete state.cauldron[id];
          updateUI();
        }
      }
    });
  });

  // Right-click — remove all of one element
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (state.animating) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = mx * scaleX;
    const cy = my * scaleY;
    const entries = Object.entries(state.cauldron);
    const count = entries.length;
    if (count === 0) return;
    let closest = null;
    let closestDist = 400;
    entries.forEach(([id, qty], i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const dist = RADIUS * 0.4;
      const ox = CX + Math.cos(angle) * dist;
      const oy = CY + Math.sin(angle) * dist;
      const d = (cx - ox) ** 2 + (cy - oy) ** 2;
      if (d < closestDist) { closestDist = d; closest = { id, qty, ox, oy }; }
    });
    if (closest && closestDist < 25 * 25) {
      const { id, qty } = closest;
      delete state.cauldron[id];
      if (ELEMENTS[id]?.starter) {
        log(`↩ ${ELEMENTS[id].name} ×${qty} возвращён (бесконечный)`, 'info');
      } else {
        state.inventory[id] = (state.inventory[id] || 0) + qty;
        log(`↩ ${ELEMENTS[id].name} ×${qty} возвращён в инвентарь`, 'info');
      }
      updateUI();
    }
  });

  // Mix button
  document.getElementById('mix-btn').addEventListener('click', performMix);

  // Clear button
  document.getElementById('clear-btn').addEventListener('click', () => {
    if (state.animating) return;
    const entries = Object.entries(state.cauldron);
    entries.forEach(([id, qty]) => {
      if (!ELEMENTS[id]?.starter) state.inventory[id] = (state.inventory[id] || 0) + qty;
    });
    const total = entries.reduce((s, [,v]) => s + v, 0);
    state.cauldron = {};
    if (total > 0) log(`↩ ${total} ед. возвращено в инвентарь`, 'info');
    updateUI();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) performMix();
    if (e.key === 'Escape') {
      hideElementInfo();
      closeAchievements();
      closeTree();
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
