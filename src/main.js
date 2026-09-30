import { state, loadGame, resetGame } from './state.js';
import { resizeCanvas, gameLoop } from './canvas.js';
import { log, updateUI, openAchievements, closeAchievements, openTree, closeTree, hideElementInfo, closeQtyPopup, openStats, closeStats, openCraftRoadmap, closeCraftRoadmap, switchTab, openGrimoire, closeGrimoire, updateNotebookBadge, initLegendSnapshot, openModalAnimated, closeModalAnimated } from './ui.js';
import { setupEventListeners } from './events.js';
import { loadNotebook } from './notebook.js';
import { initSync } from './sync.js';
import { startFurnaceLoop, openFurnace, closeFurnace, refreshFurnaceBadge } from './furnace.js';
import { maybeShowWelcome, finishWelcome, showWelcome } from './welcome.js';
import { isMuted, toggleMute } from './audio.js';

// Expose to window for onclick="" attributes in HTML
window.openAchievements = openAchievements;
window.closeAchievements = closeAchievements;
window.openTree = openTree;
window.closeTree = closeTree;
window.hideElementInfo = hideElementInfo;
window.closeQtyPopup = closeQtyPopup;
window.resetGame = resetGame;
window.openStats = openStats;
window.closeStats = closeStats;
window.openCraftRoadmap = openCraftRoadmap;
window.closeCraftRoadmap = closeCraftRoadmap;
window.switchTab = switchTab;
window.openGrimoire = openGrimoire;
window.closeGrimoire = closeGrimoire;
window.openModalAnimated = openModalAnimated;
window.closeModalAnimated = closeModalAnimated;
window.openFurnace = openFurnace;
window.closeFurnace = closeFurnace;
window.finishWelcome = finishWelcome;
window.replayHelp = () => showWelcome();
window.toggleSound = () => {
  const muted = toggleMute();
  const btn = document.getElementById('mute-btn');
  if (btn) { btn.textContent = muted ? '🔇' : '🔊'; btn.title = muted ? 'Включить звук' : 'Выключить звук'; }
};

function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  setupEventListeners();

  const loaded = loadGame();
  loadNotebook();
  initLegendSnapshot();
  initSync();
  updateNotebookBadge();

  window.addEventListener('alchemy:cloud-applied', () => {
    updateUI();
    initLegendSnapshot();
    updateNotebookBadge();
    log('☁ Облачный прогресс применён', 'info');
  });

  const muteBtn = document.getElementById('mute-btn');
  if (muteBtn && isMuted()) { muteBtn.textContent = '🔇'; muteBtn.title = 'Включить звук'; }

  if (!state.stats.startTime) state.stats.startTime = Date.now();
  state.stats.sessionStart = Date.now();
  if (typeof state.stats.totalPlayMs !== 'number') state.stats.totalPlayMs = 0;
  // Периодически фиксируем наигранное время, чтобы не терять при краше
  setInterval(() => { try { state.stats.totalPlayMs = (state.stats.totalPlayMs || 0) + Math.max(0, Date.now() - state.stats.sessionStart); state.stats.sessionStart = Date.now(); } catch {} }, 30000);
  window.addEventListener('beforeunload', () => { try { const s = state.stats; if (s.sessionStart) { s.totalPlayMs = (s.totalPlayMs || 0) + Math.max(0, Date.now() - s.sessionStart); s.sessionStart = Date.now(); } } catch {} });

  updateUI();
  startFurnaceLoop();
  refreshFurnaceBadge();
  setInterval(() => { try { refreshFurnaceBadge(); } catch {} }, 2000);

  maybeShowWelcome();

  if (loaded) {
    log('📥 Прогресс загружен', 'info');
  } else {
    log('✧ Добро пожаловать в Алхимию!', 'discovery');
  }
  log('  Перетаскивайте элементы в круг и смешивайте их', 'info');
  log('  Провалы ведут к взрывам, но могут открыть новое', 'info');
  log('  Клик по элементу в котле — вернуть 1 в инвентарь', 'info');
  log('  ПКМ по элементу — вернуть всё количество', 'info');

  gameLoop();
}

init();
