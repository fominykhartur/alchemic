import { ELEMENTS, STARTER_IDS, SAVE_KEY } from './data.js';

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

export function saveGame() {
  const discovered = [...state.discovered].filter(id => !ELEMENTS[id]?.starter);
  const foundRecipes = [...state.foundRecipes];
  const inventory = {};
  Object.entries(state.inventory).forEach(([id, qty]) => {
    if (!ELEMENTS[id]?.starter) inventory[id] = qty;
  });
  const achievements = [...state.achievements];
  const stats = { ...state.stats, elementCreatedCount: { ...state.stats.elementCreatedCount } };
  const data = { v: 1, discovered, foundRecipes, inventory, achievements, stats };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  } catch {}
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (data.v !== 1) return false;
    (data.discovered || []).forEach(id => state.discovered.add(id));
    (data.foundRecipes || []).forEach(r => state.foundRecipes.add(r));
    Object.entries(data.inventory || {}).forEach(([id, qty]) => {
      if (!ELEMENTS[id]?.starter) state.inventory[id] = qty;
    });
    (data.achievements || []).forEach(id => state.achievements.add(id));
    if (data.stats) {
      Object.assign(state.stats, data.stats);
      if (!data.stats.elementCreatedCount) state.stats.elementCreatedCount = {};
    }
    return true;
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
