import { ELEMENTS, RECIPES, recipeKey, ELEMENT_DEPTHS, ELEMENT_CATS } from './data.js';
import { state } from './state.js';

const NOTEBOOK_KEY = 'alchemic_notebook_v1';

export const notebook = {
  entries: [],
  knownRecipes: [],
  hasUnseen: false,
};

// ─── Persistence ───

export function saveNotebook() {
  try {
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify({
      v: 1,
      entries: notebook.entries,
      knownRecipes: notebook.knownRecipes,
      hasUnseen: notebook.hasUnseen,
    }));
  } catch {}
}

export function loadNotebook() {
  try {
    const raw = localStorage.getItem(NOTEBOOK_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    notebook.entries = Array.isArray(data.entries) ? data.entries : [];
    notebook.knownRecipes = Array.isArray(data.knownRecipes) ? data.knownRecipes : [];
    notebook.hasUnseen = !!data.hasUnseen;
    return true;
  } catch {
    return false;
  }
}

// ─── Whispers ───

const PAIR_TEMPLATES = [
  (a) => `...показалось, что ${a} тянется к чему-то одному, но незнакомому`,
  (a) => `...в сущности ${a} я уловил тягу к единственному недостающему союзу`,
  (a) => `...${a} шепчет ровно об одном сочетании, которого я ещё не пробовал`,
];

const DUPLICATE_TEMPLATES = [
  (a) => `...мне показалось мало одной порции ${a} — быть может, нужна не одна`,
  (a) => `...${a}, встреченное с самим собой, будто бы удваивает силу`,
  (a) => `...в старых записях говорится: ${a} нужно не в единственном числе`,
];

const TRIPLE_TEMPLATES = [
  (a, cat) => `...${a} — лишь одна из нитей, остальные ведут в сторону ${cat}`,
  (a, cat) => `...чтобы завершить союз с ${a}, нужно ещё больше одного — и что-то из мира ${cat}`,
  (a, cat) => `...${a} слишком одинок для такой реакции; ищи компанию среди ${cat}`,
];

const GRAND_TEMPLATES = [
  () => `...это не рецепт из двух вещей — тут нужно собрать вместе то, чего я уже достиг`,
  () => `...величайшие союзы рождаются не из простого, а из уже пройденного пути`,
  () => `...чувствую: ответ не в новом ингредиенте, а в том, что я уже держал в руках раньше`,
];

const CATEGORY_HINTS = {
  nature: 'природы', metal: 'металла', artifact: 'рукотворного',
  magic: 'магии', entities: 'иных существ', spirit: 'духа',
  chronomancy: 'времени', illusion: 'иллюзий', cosmos: 'космоса',
  alchemy: 'алхимии', state: 'стихийных состояний', legendary: 'легенд',
};

export function getReachableRecipes() {
  return RECIPES.filter(r =>
    r.inputs.every(i => state.discovered.has(i.id)) &&
    !state.discovered.has(r.output)
  );
}

function pickNotableIngredient(recipe) {
  return [...recipe.inputs].sort((a, b) =>
    (ELEMENT_DEPTHS[b.id] ?? 0) - (ELEMENT_DEPTHS[a.id] ?? 0)
  )[0];
}

function buildWhisperText(recipe) {
  const distinct = [...new Set(recipe.inputs.map(i => i.id))];

  if (distinct.length === 1) {
    const name = (ELEMENTS[distinct[0]]?.name || distinct[0]).toLowerCase();
    const t = DUPLICATE_TEMPLATES[Math.floor(Math.random() * DUPLICATE_TEMPLATES.length)];
    return t(name);
  }

  const notable = pickNotableIngredient(recipe);
  const name = (ELEMENTS[notable.id]?.name || notable.id).toLowerCase();

  if (recipe.inputs.length === 2) {
    const t = PAIR_TEMPLATES[Math.floor(Math.random() * PAIR_TEMPLATES.length)];
    return t(name);
  }

  if (recipe.inputs.length === 3) {
    const others = recipe.inputs.filter(i => i.id !== notable.id);
    const hintCat = ELEMENT_CATS[others[0].id];
    const catLabel = CATEGORY_HINTS[hintCat] || 'чего-то ещё';
    const t = TRIPLE_TEMPLATES[Math.floor(Math.random() * TRIPLE_TEMPLATES.length)];
    return t(name, catLabel);
  }

  const t = GRAND_TEMPLATES[Math.floor(Math.random() * GRAND_TEMPLATES.length)];
  return t();
}

export function maybeAddWhisper() {
  if (state.stats.mixCount % 7 !== 0) return;
  const reachable = getReachableRecipes();
  if (reachable.length === 0) return;
  const alreadyHinted = new Set(
    notebook.entries
      .filter(e => e.type === 'whisper' && !e.resolved)
      .map(e => e.pointsTo)
  );
  const candidates = reachable.filter(r => !alreadyHinted.has(r.output));
  if (candidates.length === 0) return;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  addWhisper({
    text: buildWhisperText(pick),
    pointsTo: pick.output,
    source: 'ambient',
  });
}

function addWhisper({ text, pointsTo, source }) {
  notebook.entries.push({
    id: `w_${Date.now()}`,
    type: 'whisper',
    text,
    pointsTo,
    source,
    resolved: false,
    createdAt: Date.now(),
  });
  notebook.hasUnseen = true;
  saveNotebook();
}

export function resolveWhispers(outputId) {
  let resolvedCount = 0;
  notebook.entries.forEach(e => {
    if (e.type === 'whisper' && !e.resolved && e.pointsTo === outputId) {
      e.resolved = true;
      e.resolvedAt = Date.now();
      resolvedCount++;
    }
  });
  if (resolvedCount > 0) {
    notebook.hasUnseen = true;
    saveNotebook();
  }
  return resolvedCount;
}

// ─── Lore ───

export function addLore(elementId) {
  if (notebook.entries.some(e => e.type === 'lore' && e.elementId === elementId)) return;
  const el = ELEMENTS[elementId];
  if (!el) return;
  notebook.entries.push({
    id: `l_${elementId}`,
    type: 'lore',
    elementId,
    text: el.desc || '',
    unlockedAt: Date.now(),
  });
  saveNotebook();
}

// ─── Recipe reveal (sacrifice, Phase C) ───

export function isRecipeKnown(recipe) {
  return notebook.knownRecipes.includes(recipeKey(recipe));
}
