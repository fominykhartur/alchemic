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

export function exportNotebookData() {
  return {
    v: 1,
    entries: notebook.entries,
    knownRecipes: notebook.knownRecipes,
    hasUnseen: notebook.hasUnseen,
  };
}

export function importNotebookData(data) {
  if (!data || data.v !== 1) return false;
  notebook.entries = (Array.isArray(data.entries) ? data.entries : [])
    .filter(e => e.type === 'whisper' && !e.resolved)
    .map(e => {
      const clean = { ...e };
      delete clean.text;
      delete clean.resolvedAt;
      return clean;
    });
  notebook.knownRecipes = Array.isArray(data.knownRecipes) ? data.knownRecipes : [];
  notebook.hasUnseen = !!data.hasUnseen;
  return true;
}

export function saveNotebook() {
  try {
    localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(exportNotebookData()));
  } catch {}
  window.dispatchEvent(new CustomEvent('alchemy:saved'));
}

export function loadNotebook() {
  try {
    const raw = localStorage.getItem(NOTEBOOK_KEY);
    if (!raw) return false;
    return importNotebookData(JSON.parse(raw));
  } catch {
    return false;
  }
}

// ─── Whispers ───

const PAIR_TEMPLATES = [
  (a) => `...показалось, что ${a} тянется к чему-то одному, но незнакомому`,
  (a) => `...в сущности ${a} я уловил тягу к единственному недостающему союзу`,
  (a) => `...${a} шепчет ровно об одном сочетании, которого я ещё не пробовал`,
  (a) => `...стоило поднести ${a} ближе к свече, и оно будто вздрогнуло — ждёт пары`,
  (a) => `...${a} не желает покоиться в одиночестве, я это чувствую всей рукой`,
  (a) => `...записал в дневнике: ${a} явно ищет спутника, только не пойму какого`,
  (a) => `...сон был короткий, но ясный: ${a} соединяется с чем-то, чего я ещё не держал`,
  (a) => `...${a} на столе будто указывает в сторону — но куда именно, не разобрать`,
  (a) => `...если верить старику из таверны, ${a} никогда не бывает завершено в одиночку`,
  (a) => `...${a} остывает медленнее обычного — верный знак, что жду ещё одну вещь`,
  (a, cat) => `...${a} будто зовёт нечто из мира ${cat}, но зов слишком тих, чтобы разобрать слова`,
  (a, cat) => `...между ${a} и чем-то из ${cat} есть связь — я почти касаюсь её пальцами`,
];

const DUPLICATE_TEMPLATES = [
  (a) => `...мне показалось мало одной порции ${a} — быть может, нужна не одна`,
  (a) => `...${a}, встреченное с самим собой, будто бы удваивает силу`,
  (a) => `...в старых записях говорится: ${a} нужно не в единственном числе`,
  (a) => `...одна щепоть ${a} — просто ${a}. Быть может, щедрость откроет иное`,
  (a) => `...чем больше ${a} собираю вместе, тем громче становится тишина в котле`,
  (a) => `...${a}, помноженное на себя же, будто становится другим веществом`,
  (a) => `...дважды взятое ${a} — не то же самое, что дважды повторённое; здесь кроется секрет`,
  (a) => `...учитель говорил: некоторые вещи открываются, только встретив самих себя`,
  (a) => `...если ${a} не хочет меняться в одиночку, возможно, стоит взять больше`,
  (a) => `...${a} рядом с ${a} — не просто сумма, здесь что-то множится`,
];

const TRIPLE_TEMPLATES = [
  (a, cat) => `...${a} — лишь одна из нитей, остальные ведут в сторону ${cat}`,
  (a, cat) => `...чтобы завершить союз с ${a}, нужно ещё больше одного — и что-то из мира ${cat}`,
  (a, cat) => `...${a} слишком одинок для такой реакции; ищи компанию среди ${cat}`,
  (a, cat) => `...${a} — только начало нити; чувствую ещё две, и одна ведёт в ${cat}`,
  (a, cat) => `...троица не сложится без ${a} и попутчика из ${cat} — но кто третий, не знаю`,
  (a, cat) => `...записал три пятна на полях: ${a}, что-то из ${cat}, и третье — совсем размыто`,
  (a, cat) => `...${a} тянет за собой цепочку; первое звено — точно из ${cat}`,
  (a, cat) => `...втроём они держатся крепче, чем поодиночке: ${a} и хотя бы одно из ${cat}`,
  (a, cat) => `...сложный узел: ${a} переплетается с ${cat}, а дальше нить теряется во тьме`,
  (a, cat) => `...${a} одно не устоит — нужна опора, и она где-то среди ${cat}`,
];

// ── Grand (4+ ингредиентов) — стадия 1: число частей + один названный ингредиент
const GRAND_TEMPLATES = [
  (a, n) => `...это не рецепт из двух вещей — тут нужно собрать вместе ${n} разных сущностей, и ${a} — одна из них`,
  (a, n) => `...величайшие союзы рождаются не из простого: чувствую ${n} нитей, и одна тянется от ${a}`,
  (a, n) => `...${a} — лишь одна из ${n} частей целого; остальные пока скрыты во тьме`,
  (a, n) => `...чувствую: нужно собрать ${n} вещей воедино, и ${a} среди них — первая, что я различил`,
  (a, n) => `...в глубокой ночи привиделось: ${n} моих находок сходятся в одной точке, и ${a} — одна из них`,
  (a, n) => `...это Великое Делание в миниатюре: нужно ${n} плодов многих трудов, и ${a} — первый из узнанных`,
  (a, n) => `...чую сложную вязь из ${n} нитей — не пара ингредиентов, а целое созвездие; ${a} светит в нём ярче прочих`,
  (a, n) => `...${a} тянет за собой ещё ${n - 1} нитей — слишком много, чтобы понять их разом`,
];

const ORACLE_GRAND_TEMPLATES = [
  (a, n) => `...зеркало показывает не единственный путь, а перекрёсток из ${n} дорог; ${a} — первая, что видна ясно`,
  (a, n) => `...в глубине стекла вижу россыпь из ${n} прежних находок — ${a} среди них, но не одна`,
  (a, n) => `...отражение слишком сложное для одного взгляда: там сплетены ${n} нитей, и ${a} — одна из них`,
  (a, n) => `...зеркало молчит о частностях, но ясно одно: нужно ${n} вещей, и ${a} — первая из узнанных`,
  (a, n) => `...в стекле мерцает созвездие из ${n} точек; ${a} — ярчайшая из них`,
  (a, n) => `...зеркало показывает ${a} в окружении ещё ${n - 1} спутников, но их лица размыты`,
];

const PROPHECY_GRAND_TEMPLATES = [
  (a, n) => `...${a} — лишь часть целого из ${n} вещей; остальные пока сокрыты во времени`,
  (a, n) => `...Хрономант видит не миг, а целую эпоху из ${n} знаков; ${a} — первый, что уже свершился`,
  (a, n) => `...будущее сплетено из ${n} нитей; я вижу лишь одну — ${a}`,
  (a, n) => `...пророчество не о новом, а о ${n} вещах, собранных воедино; ${a} — та, что уже в твоих руках`,
  (a, n) => `...песочные часы показывают ${n} песчинок сразу; ${a} среди них падает первой`,
  (a, n) => `...Хрономант молчит о деталях, но твёрдо знает число: ${n}. Одно из имён — ${a}`,
];

// ── Grand — стадия 2: раскрываем второй ингредиент (доступна только повторным "дозреванием")
const GRAND_STAGE2_TEMPLATES = [
  (a1, a2, n) => `...теперь яснее: среди ${n} частей узнаю ${a1} и ${a2} — но остальные всё ещё во мгле`,
  (a1, a2, n) => `...вторая нить проступила сквозь пелену: ${a1} и ${a2} точно входят в число ${n} составляющих`,
  (a1, a2, n) => `...записал уже два имени: ${a1}, ${a2}. Из ${n} нужных — эти два не вызывают сомнений`,
  (a1, a2, n) => `...сон повторился и стал отчётливее: ${a1} рядом с ${a2}, а вокруг ещё ${n - 2} безликих теней`,
];

const ORACLE_GRAND_STAGE2_TEMPLATES = [
  (a1, a2, n) => `...зеркало прояснилось: теперь вижу ${a1} и ${a2} среди ${n} нужных сущностей`,
  (a1, a2, n) => `...отражение отдало ещё одно имя: ${a2} встаёт рядом с ${a1}, но круг из ${n} ещё не полон`,
  (a1, a2, n) => `...стекло показало пару: ${a1} и ${a2}. Остальное из ${n} тонет в серебристой дымке`,
];

const PROPHECY_GRAND_STAGE2_TEMPLATES = [
  (a1, a2, n) => `...Хрономант добавил второе имя: ${a1} и ${a2} — оба точно среди ${n} нужных`,
  (a1, a2, n) => `...будущее приоткрылось чуть шире: ${a1}, затем ${a2}. Остальное из ${n} ещё не пришло`,
  (a1, a2, n) => `...пророчество уточнилось: ${a1} и ${a2} — два из ${n}, прочие пока молчат`,
];

// ── Grand — стадия 3 (только для 6+ ингредиентов): явный намёк на жертвоприношение
const GRAND_STAGE3_TEMPLATES = [
  () => `...эта тайна слишком велика для одних лишь снов и шёпотов — быть может, стоит принести жертву, чтобы узнать её наверняка`,
  () => `...сколько ни вглядываюсь, дальше двух нитей не вижу; здесь нужен не шёпот, а жертвоприношение`,
  () => `...чувствую предел своего дара: дальше эту связь откроет только жертва, а не прозрение`,
  () => `...записал на полях: "довольно гадать — время для ритуала жертвы"`,
];

const ORACLE_PAIR_TEMPLATES = [
  (a, cat) => `...${a} тянется к чему-то из мира ${cat}`,
  (a, cat) => `...союз с ${a} следует искать среди ${cat}`,
  (a, cat) => `...зеркало ясно показывает: ${a} соединится с чем-то из ${cat}`,
  (a, cat) => `...в отражении вижу пару: ${a} и спутника из мира ${cat}`,
  (a, cat) => `...зеркало не лжёт — ищи среди ${cat} то, что откликнется на ${a}`,
  (a, cat) => `...отражение подсказывает направление: от ${a} к ${cat}`,
  (a, cat) => `...стекло помутнело лишь на миг, но я успел разглядеть: ${a} и нечто из ${cat}`,
  (a, cat) => `...образ в зеркале держит ${a} рядом с чем-то из ${cat} — связь очевидна`,
];

const ORACLE_TRIPLE_TEMPLATES = [
  (a, cat1, cat2) => `...${a} сплетается с нитью из ${cat1} и ещё одной из ${cat2}`,
  (a, cat1, cat2) => `...зеркало показало три тени: ${a}, спутника из ${cat1} и ещё одного из ${cat2}`,
  (a, cat1, cat2) => `...в отражении три нити сходятся: ${a}, что-то из ${cat1}, и что-то из ${cat2}`,
  (a, cat1, cat2) => `...узор в стекле ясен: ${a} рядом с ${cat1} и ${cat2}`,
  (a, cat1, cat2) => `...зеркало держит образ дольше обычного: ${a}, ${cat1}, ${cat2} — все трое вместе`,
  (a, cat1, cat2) => `...вижу треугольник: в одном углу ${a}, в других — ${cat1} и ${cat2}`,
];

const PROPHECY_PAIR_TEMPLATES = [
  (a, cat) => `...почти вижу: ${a} сойдётся с чем-то из ${cat}`,
  (a, cat) => `...Хрономант молвит: ${a} ждёт своего из мира ${cat}`,
  (a, cat) => `...Хрономант видит нить времени: ${a} сойдётся с тем, что придёт из ${cat}`,
  (a, cat) => `...будущее уже решено: ${a} и спутник из мира ${cat}`,
  (a, cat) => `...песочные часы отмерили срок: жди союза ${a} с чем-то из ${cat}`,
  (a, cat) => `...в грядущем эта связь неизбежна — ${a} и нечто из ${cat}`,
  (a, cat) => `...Хрономант шепчет сквозь года: ${a} найдёт своё среди ${cat}`,
  (a, cat) => `...линия судьбы прямая, как стрела: от ${a} к ${cat}`,
];

const PROPHECY_TRIPLE_TEMPLATES = [
  (a, cat1, cat2) => `...нить ясна: ${a}, затем ${cat1}, и наконец ${cat2}`,
  (a, cat1, cat2) => `...Хрономант видит три витка: ${a}, затем ${cat1}, затем ${cat2}`,
  (a, cat1, cat2) => `...будущее сплетено из трёх нитей: ${a}, ${cat1} и ${cat2}`,
  (a, cat1, cat2) => `...пророчество гласит: ${a} встретит ${cat1}, а после — ${cat2}`,
  (a, cat1, cat2) => `...в грядущем вижу треугольник судьбы: ${a}, ${cat1}, ${cat2}`,
  (a, cat1, cat2) => `...песок в часах ложится в три слоя: ${a}, ${cat1}, ${cat2}`,
];

const CATEGORY_HINTS = {
  starter: 'первостихий',
  nature: 'природы', metal: 'металла', artifact: 'рукотворного',
  magic: 'магии', entities: 'иных существ', spirit: 'духа',
  chronomancy: 'времени', illusion: 'иллюзий', cosmos: 'космоса',
  alchemy: 'алхимии', state: 'стихийных состояний', legendary: 'легенд',
  emotion: 'чувств', sound: 'звука',
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

// Топ-N уникальных (по id) ингредиентов рецепта, отсортированных по глубине
function pickNotableIngredients(recipe, count) {
  const seen = new Set();
  const distinct = [];
  for (const inp of [...recipe.inputs].sort((a, b) =>
    (ELEMENT_DEPTHS[b.id] ?? 0) - (ELEMENT_DEPTHS[a.id] ?? 0)
  )) {
    if (seen.has(inp.id)) continue;
    seen.add(inp.id);
    distinct.push(inp);
    if (distinct.length >= count) break;
  }
  return distinct;
}

export function getCategoryLabel(cat) {
  return CATEGORY_HINTS[cat] || 'чего-то ещё';
}

export function getCategoryHint(id) {
  return getCategoryLabel(ELEMENT_CATS[id]);
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Сколько стадий раскрытия доступно рецепту в зависимости от числа уникальных ингредиентов.
// 2-3 ингредиента — как раньше, один шёпот. 4-5 — можно "дозреть" до второго имени.
// 6+ (по сути только редкие вершинные рецепты) — плюс финальный намёк на жертвоприношение.
function getMaxStage(distinctCount) {
  if (distinctCount >= 6) return 3;
  if (distinctCount >= 4) return 2;
  return 1;
}

function getRecipeForEntry(entry) {
  return RECIPES.find(r => r.output === entry.pointsTo);
}

function getEntryDistinctCount(entry) {
  const recipe = getRecipeForEntry(entry);
  if (!recipe) return 0;
  return new Set(recipe.inputs.map(i => i.id)).size;
}

function buildWhisperText(recipe, level = 'ambient', seed = 0, stage = 1) {
  const distinct = [...new Set(recipe.inputs.map(i => i.id))];

  if (distinct.length === 1) {
    const name = (ELEMENTS[distinct[0]]?.name || distinct[0]).toLowerCase();
    const t = DUPLICATE_TEMPLATES[seed % DUPLICATE_TEMPLATES.length];
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
    const t = set[seed % set.length];
    return t(name, cat);
  }

  if (distinct.length === 3) {
    const set = level === 'prophecy' ? PROPHECY_TRIPLE_TEMPLATES
      : level === 'oracle' ? ORACLE_TRIPLE_TEMPLATES
      : TRIPLE_TEMPLATES;
    const t = set[seed % set.length];
    if (level === 'ambient') return t(name, getCategoryHint(others[0]));
    return t(name, getCategoryHint(others[0]), getCategoryHint(others[1]));
  }

  // 4+ ингредиентов — "великие" рецепты, раскрываем по стадиям
  const maxStage = getMaxStage(distinct.length);
  const effStage = Math.min(stage, maxStage);

  if (effStage >= 3) {
    const set = GRAND_STAGE3_TEMPLATES;
    return set[seed % set.length]();
  }

  if (effStage === 2) {
    const [i1, i2] = pickNotableIngredients(recipe, 2);
    const n1 = (ELEMENTS[i1.id]?.name || i1.id).toLowerCase();
    const n2 = (ELEMENTS[i2.id]?.name || i2.id).toLowerCase();
    const set = level === 'prophecy' ? PROPHECY_GRAND_STAGE2_TEMPLATES
      : level === 'oracle' ? ORACLE_GRAND_STAGE2_TEMPLATES
      : GRAND_STAGE2_TEMPLATES;
    const t = set[seed % set.length];
    return t(n1, n2, distinct.length);
  }

  const set = level === 'prophecy' ? PROPHECY_GRAND_TEMPLATES
    : level === 'oracle' ? ORACLE_GRAND_TEMPLATES
    : GRAND_TEMPLATES;
  const t = set[seed % set.length];
  return t(name, distinct.length);
}

export function renderWhisperText(entry) {
  const recipe = RECIPES.find(r => r.output === entry.pointsTo);
  if (!recipe) return '...что-то тянется к неведомому';
  return buildWhisperText(recipe, entry.source || 'ambient', hashString(entry.id || ''), entry.stage || 1);
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

// Ищем незакрытую подсказку про "великий" рецепт, которая ещё не дошла до потолка стадий —
// именно так сложные рецепты со временем получают всё больше деталей вместо одного
// одноразового и часто бесполезного намёка.
function pickWhisperUpgrade() {
  const candidates = notebook.entries.filter(e => {
    if (e.type !== 'whisper' || e.resolved) return false;
    const distinct = getEntryDistinctCount(e);
    return (e.stage || 1) < getMaxStage(distinct);
  });
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.createdAt - b.createdAt);
  return candidates[0];
}

function upgradeWhisper(entry, level) {
  entry.stage = (entry.stage || 1) + 1;
  entry.source = level;
  entry.updatedAt = Date.now();
  notebook.hasUnseen = true;
  saveNotebook();
}

export function maybeAddWhisper() {
  const level = getOracleLevel();
  const every = level === 'prophecy' ? 3 : level === 'oracle' ? 5 : 7;
  if (state.stats.mixCount % every !== 0) return;

  const upgrade = pickWhisperUpgrade();
  if (upgrade) {
    upgradeWhisper(upgrade, level);
    return;
  }

  const target = pickWhisperTarget();
  if (!target) return;
  addWhisper({
    pointsTo: target.output,
    source: level,
  });
}

export function onOracleUnlocked(level) {
  if (notebook.entries.some(e => e.type === 'whisper' && !e.resolved)) return;
  const target = pickWhisperTarget();
  if (!target) return;
  addWhisper({
    pointsTo: target.output,
    source: level,
  });
}

function pruneEntries() {
  if (notebook.entries.length <= MAX_ENTRIES) return;
  let overflow = notebook.entries.length - MAX_ENTRIES;
  notebook.entries = notebook.entries.filter(e => {
    if (overflow <= 0) return true;
    if (e.type === 'whisper' && e.resolved) {
      overflow--;
      return false;
    }
    return true;
  });
}

function addWhisper({ pointsTo, source }) {
  notebook.entries.push({
    id: `w_${Date.now()}`,
    type: 'whisper',
    pointsTo,
    source,
    stage: 1,
    resolved: false,
    createdAt: Date.now(),
  });
  pruneEntries();
  notebook.hasUnseen = true;
  saveNotebook();
}

export function resolveWhispers(outputId) {
  const before = notebook.entries.length;
  notebook.entries = notebook.entries.filter(e =>
    !(e.type === 'whisper' && !e.resolved && e.pointsTo === outputId)
  );
  const resolvedCount = before - notebook.entries.length;
  if (resolvedCount > 0) saveNotebook();
  return resolvedCount;
}

// ─── Sacrifice economy ───

export function getRevealCost(recipe) {
  const outputDepth = ELEMENT_DEPTHS[recipe.output] ?? 0;
  const distinct = new Set(recipe.inputs.map(i => i.id)).size;
  const totalAmount = recipe.inputs.reduce((sum, i) => sum + i.a, 0);
  return Math.ceil(outputDepth * (1 + outputDepth / 8) + distinct * 2 + totalAmount * 0.5);
}

export function getRemainingRecipes(outputId) {
  return RECIPES.filter(r =>
    r.output === outputId &&
    !state.foundRecipes.has(recipeKey(r)) &&
    !notebook.knownRecipes.includes(recipeKey(r))
  );
}

export function getRecipeProgressForOutput(outputId) {
  const total = RECIPES.filter(r => r.output === outputId).length;
  return { revealed: total - getRemainingRecipes(outputId).length, total };
}

export function pickSacrificeRecipe(outputId) {
  const remaining = getRemainingRecipes(outputId);
  if (remaining.length === 0) return null;
  return remaining[Math.floor(Math.random() * remaining.length)];
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

export function getRequiredAmount(recipe, sacrificeId) {
  if (!canSacrifice(sacrificeId)) return null;
  if (!recipe) return 0;
  const cost = getRevealCost(recipe);
  if (cost <= 0) return 0;
  return Math.ceil(cost / getSacrificeValue(sacrificeId));
}

// ─── Recipe reveal (sacrifice) ───

export function isRecipeKnown(recipe) {
  return notebook.knownRecipes.includes(recipeKey(recipe));
}

export function revealRecipe(recipe) {
  if (!recipe) return false;
  const key = recipeKey(recipe);
  if (state.foundRecipes.has(key) || notebook.knownRecipes.includes(key)) return false;
  notebook.knownRecipes.push(key);
  notebook.hasUnseen = true;
  saveNotebook();
  return true;
}
