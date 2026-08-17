import { state, loadGame, resetGame } from './state.js';
import { resizeCanvas, gameLoop } from './canvas.js';
import { log, updateUI, openAchievements, closeAchievements, openTree, closeTree, hideElementInfo, closeQtyPopup, openStats, closeStats, openCraftRoadmap, closeCraftRoadmap, switchTab, openGrimoire, closeGrimoire, updateNotebookBadge, initLegendSnapshot } from './ui.js';
import { setupEventListeners } from './events.js';
import { loadNotebook } from './notebook.js';
import { initSync } from './sync.js';
import { maybeShowWelcome, finishWelcome } from './welcome.js';

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
window.finishWelcome = finishWelcome;

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

  if (!state.stats.startTime) state.stats.startTime = Date.now();

  updateUI();

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
