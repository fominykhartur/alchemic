import { ELEMENTS, STARTER_IDS, SAVE_KEY, UNLOCKABLE_STARTERS } from './data.js';

export const MAX_TRIED_PAIRS = 500;

export const state = {
  inventory: {},
  discovered: new Set(),
  foundRecipes: new Set(),
  cauldron: {},
  messages: [],
  particles: [],
  cauldronEntryTime: {},
  animating: false,
  pendingAction: null,
  achievements: new Set(),
  triedPairs: new Set(),
  stats: {
    mixCount: 0,
    explosionCount: 0,
    discoveryFromExplosion: 0,
    totalCreated: 0,
    startTime: null,
    elementCreatedCount: {},
  },
};

STARTER_IDS.forEach(id => {
  state.discovered.add(id);
  state.stats.elementCreatedCount[id] = 0;
});

export function exportGameData() {
  const discovered = [...state.discovered].filter(id => !ELEMENTS[id]?.starter);
  const foundRecipes = [...state.foundRecipes];
  const inventory = {};
  Object.entries(state.inventory).forEach(([id, qty]) => {
    if (!ELEMENTS[id]?.starter) inventory[id] = qty;
  });
  const achievements = [...state.achievements];
  const triedPairs = [...state.triedPairs].slice(-MAX_TRIED_PAIRS);
  const stats = { ...state.stats, elementCreatedCount: { ...state.stats.elementCreatedCount } };
  return { v: 1, discovered, foundRecipes, inventory, achievements, triedPairs, stats };
}

export function importGameData(data) {
  if (!data || data.v !== 1) return false;
  (data.discovered || []).forEach(id => state.discovered.add(id));
  // Восстановить стартеры за вратами, если врата открыты
  UNLOCKABLE_STARTERS.forEach(s => {
    if (state.discovered.has(s.unlockedBy)) state.discovered.add(s.id);
  });
  (data.foundRecipes || []).forEach(r => state.foundRecipes.add(r));
  Object.entries(data.inventory || {}).forEach(([id, qty]) => {
    if (!ELEMENTS[id]?.starter) state.inventory[id] = qty;
  });
  (data.achievements || []).forEach(id => state.achievements.add(id));
  (data.triedPairs || []).slice(-MAX_TRIED_PAIRS).forEach(p => state.triedPairs.add(p));
  if (state.triedPairs.size > MAX_TRIED_PAIRS) {
    state.triedPairs = new Set([...state.triedPairs].slice(-MAX_TRIED_PAIRS));
  }
  if (data.stats) {
    Object.assign(state.stats, data.stats);
    if (!data.stats.elementCreatedCount) state.stats.elementCreatedCount = {};
  }
  return true;
}

export function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(exportGameData()));
  } catch {}
  window.dispatchEvent(new CustomEvent('alchemy:saved'));
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    return importGameData(JSON.parse(raw));
  } catch {
    return false;
  }
}

export function resetGame() {
  if (confirm('Сбросить весь прогресс? Все открытые элементы и рецепты будут потеряны.')) {
    localStorage.removeItem(SAVE_KEY);
    location.reload();
  }
}
