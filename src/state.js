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
  pendingReveal: null,
  achievements: new Set(),
  triedPairs: new Set(),
  stats: {
    mixCount: 0,
    explosionCount: 0,
    discoveryFromExplosion: 0,
    totalCreated: 0,
    startTime: null,
    totalPlayMs: 0,
    sessionStart: null,
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
  const { sessionStart: _sess, ...persistStats } = state.stats;
  const stats = { ...persistStats, elementCreatedCount: { ...state.stats.elementCreatedCount } };
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
    const { sessionStart: _sess, ...rest } = data.stats;
    Object.assign(state.stats, rest);
    if (!data.stats.elementCreatedCount) state.stats.elementCreatedCount = {};
    // Миграция со старого подсчёта (Date.now - startTime считал офлайн): не даём абсурдным значениям перетечь
    if (typeof state.stats.totalPlayMs !== 'number') {
      const mixCount = state.stats.mixCount || 0;
      const rough = mixCount * 45 * 1000 + 5 * 60 * 1000;
      const sinceStart = state.stats.startTime ? Date.now() - state.stats.startTime : 0;
      state.stats.totalPlayMs = Math.max(0, Math.min(sinceStart, rough, 12 * 3600 * 1000));
    }
  }
  return true;
}

export function flushPlayTime() {
  const s = state.stats;
  if (s.sessionStart) {
    s.totalPlayMs = (s.totalPlayMs || 0) + Math.max(0, Date.now() - s.sessionStart);
    s.sessionStart = Date.now();
  }
}

export function getPlayMs() {
  const s = state.stats;
  const base = s.totalPlayMs || 0;
  if (s.sessionStart) return base + Math.max(0, Date.now() - s.sessionStart);
  return base;
}

export function saveGame() {
  try {
    flushPlayTime();
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
    localStorage.removeItem('alchemic_welcome_seen');
    location.reload();
  }
}
