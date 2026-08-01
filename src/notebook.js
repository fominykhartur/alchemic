import { ELEMENTS, RECIPES, recipeKey, ELEMENT_DEPTHS, ELEMENT_CATS } from './data.js';
import { TIER } from './icons.js';
import { state } from './state.js';

const NOTEBOOK_KEY = 'alchemic_notebook_v1';
const MAX_ENTRIES = 200;

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

const ORACLE_PAIR_TEMPLATES = [
  (a, cat) => `...${a} тянется к чему-то из мира ${cat}`,
  (a, cat) => `...союз с ${a} следует искать среди ${cat}`,
];

const ORACLE_TRIPLE_TEMPLATES = [
  (a, cat1, cat2) => `...${a} сплетается с нитью из ${cat1} и ещё одной из ${cat2}`,
];

const ORACLE_GRAND_TEMPLATES = [
  (cat) => `...одна из нитей грядущего тянется из мира ${cat}`,
];

const PROPHECY_PAIR_TEMPLATES = [
  (a, cat) => `...почти вижу: ${a} сойдётся с чем-то из ${cat}`,
  (a, cat) => `...Хрономант молвит: ${a} ждёт своего из мира ${cat}`,
];

const PROPHECY_TRIPLE_TEMPLATES = [
  (a, cat1, cat2) => `...нить ясна: ${a}, затем ${cat1}, и наконец ${cat2}`,
];

const PROPHECY_GRAND_TEMPLATES = [
  (a, cat) => `...${a} — лишь часть; другая лежит в мире ${cat}`,
];

const CATEGORY_HINTS = {
  nature: 'природы', metal: 'металла', artifact: 'рукотворного',
  magic: 'магии', entities: 'иных существ', spirit: 'духа',
  chronomancy: 'времени', illusion: 'иллюзий', cosmos: 'космоса',
  alchemy: 'алхимии', state: 'стихийных состояний', legendary: 'легенд',
};

const ORACLE_ELEMENT = 'mirror';
const PROPHECY_ELEMENT = 'chronomancer';

export function getOracleLevel() {
  if (state.discovered.has(PROPHECY_ELEMENT)) return 'prophecy';
  if (state.discovered.has(ORACLE_ELEMENT)) return 'oracle';
  return 'ambient';
}

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

function getCategoryHint(id) {
  return CATEGORY_HINTS[ELEMENT_CATS[id]] || 'чего-то ещё';
}

function buildWhisperText(recipe, level = 'ambient') {
  const distinct = [...new Set(recipe.inputs.map(i => i.id))];

  if (distinct.length === 1) {
    const name = (ELEMENTS[distinct[0]]?.name || distinct[0]).toLowerCase();
    const t = DUPLICATE_TEMPLATES[Math.floor(Math.random() * DUPLICATE_TEMPLATES.length)];
    return t(name);
  }

  const notable = pickNotableIngredient(recipe);
  const name = (ELEMENTS[notable.id]?.name || notable.id).toLowerCase();
  const others = distinct.filter(id => id !== notable.id);

  if (distinct.length === 2) {
    const cat = getCategoryHint(others[0]);
    const set = level === 'prophecy' ? PROPHECY_PAIR_TEMPLATES
      : level === 'oracle' ? ORACLE_PAIR_TEMPLATES
      : PAIR_TEMPLATES;
    const t = set[Math.floor(Math.random() * set.length)];
    return t(name, cat);
  }

  if (distinct.length === 3) {
    const set = level === 'prophecy' ? PROPHECY_TRIPLE_TEMPLATES
      : level === 'oracle' ? ORACLE_TRIPLE_TEMPLATES
      : TRIPLE_TEMPLATES;
    const t = set[Math.floor(Math.random() * set.length)];
    if (level === 'ambient') return t(name, getCategoryHint(others[0]));
    return t(name, getCategoryHint(others[0]), getCategoryHint(others[1]));
  }

  const cat = getCategoryHint(others[0]);
  const set = level === 'prophecy' ? PROPHECY_GRAND_TEMPLATES
    : level === 'oracle' ? ORACLE_GRAND_TEMPLATES
    : GRAND_TEMPLATES;
  const t = set[Math.floor(Math.random() * set.length)];
  return t(name, cat);
}

function pickWhisperTarget() {
  const reachable = getReachableRecipes();
  if (reachable.length === 0) return null;
  const alreadyHinted = new Set(
    notebook.entries
      .filter(e => e.type === 'whisper' && !e.resolved)
      .map(e => e.pointsTo)
  );
  const candidates = reachable.filter(r => !alreadyHinted.has(r.output));
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function maybeAddWhisper() {
  const level = getOracleLevel();
  const every = level === 'prophecy' ? 3 : level === 'oracle' ? 5 : 7;
  if (state.stats.mixCount % every !== 0) return;
  const target = pickWhisperTarget();
  if (!target) return;
  addWhisper({
    text: buildWhisperText(target, level),
    pointsTo: target.output,
    source: level,
  });
}

export function onOracleUnlocked(level) {
  if (notebook.entries.some(e => e.type === 'whisper' && !e.resolved)) return;
  const target = pickWhisperTarget();
  if (!target) return;
  addWhisper({
    text: buildWhisperText(target, level),
    pointsTo: target.output,
    source: level,
  });
}

function pruneEntries() {
  if (notebook.entries.length <= MAX_ENTRIES) return;
  let overflow = notebook.entries.length - MAX_ENTRIES;
  notebook.entries = notebook.entries.filter(e => {
    if (overflow <= 0) return true;
    if (e.type === 'lore' || (e.type === 'whisper' && e.resolved)) {
      overflow--;
      return false;
    }
    return true;
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
  pruneEntries();
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
  pruneEntries();
  saveNotebook();
}

// ─── Sacrifice economy ───

export function getRevealCost(recipe) {
  const outputDepth = ELEMENT_DEPTHS[recipe.output] ?? 0;
  const distinct = new Set(recipe.inputs.map(i => i.id)).size;
  const totalAmount = recipe.inputs.reduce((sum, i) => sum + i.a, 0);
  return Math.ceil(outputDepth * 1.5 + distinct * 2 + totalAmount * 0.5);
}

export function getRevealCostForOutput(outputId) {
  let total = 0;
  RECIPES.forEach(r => {
    if (r.output === outputId && !notebook.knownRecipes.includes(recipeKey(r))) total += getRevealCost(r);
  });
  return total;
}

export function getSacrificeValue(elementId) {
  return 1 + (ELEMENT_DEPTHS[elementId] ?? 0);
}

export function canSacrifice(elementId) {
  const el = ELEMENTS[elementId];
  if (!el) return false;
  if (el.starter) return false;
  if (el.infinite) return false;
  if (TIER[elementId] === 'legendary') return false;
  return true;
}

export function getRequiredAmount(outputId, sacrificeId) {
  if (!canSacrifice(sacrificeId)) return null;
  const cost = getRevealCostForOutput(outputId);
  if (cost <= 0) return 0;
  return Math.ceil(cost / getSacrificeValue(sacrificeId));
}

// ─── Recipe reveal (sacrifice) ───

export function isRecipeKnown(recipe) {
  return notebook.knownRecipes.includes(recipeKey(recipe));
}

export function revealRecipesForOutput(outputId) {
  let revealed = 0;
  RECIPES.forEach(r => {
    if (r.output !== outputId) return;
    const key = recipeKey(r);
    if (!notebook.knownRecipes.includes(key)) {
      notebook.knownRecipes.push(key);
      revealed++;
    }
  });
  if (revealed > 0) {
    notebook.hasUnseen = true;
    saveNotebook();
  }
  return revealed;
}
