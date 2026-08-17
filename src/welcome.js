import { RADIUS } from './canvas.js';
import { buildIconSVG } from './icons.js';
import { ELEMENTS, STARTER_IDS } from './data.js';

export const WELCOME_KEY = 'alchemic_welcome_seen';
const HIGHLIGHT_MS = 10000;
const GHOST_FLIGHT_MS = 1100;
const DEMO_ELEMENTS = ['water', 'fire'];

let ringEl = null;
let highlightTimer = null;
let tutorialGhosts = [];
let tutorialTimers = [];
let rippleEl = null;
let hintEl = null;
let isMobile = false;

function getModal() {
  return document.getElementById('welcome-modal');
}

export function maybeShowWelcome() {
  try {
    if (localStorage.getItem(WELCOME_KEY)) return;
  } catch {}
  renderWelcomeContent();
  getModal().style.display = '';
}

function welcomeSection(title) {
  const section = document.createElement('div');
  section.className = 'welcome-section';
  if (title) {
    const t = document.createElement('div');
    t.className = 'welcome-section-title';
    t.textContent = title;
    section.appendChild(t);
  }
  return section;
}

function welcomeList(items) {
  const list = document.createElement('ul');
  list.className = 'welcome-list';
  items.forEach(text => {
    const li = document.createElement('li');
    li.innerHTML = text;
    list.appendChild(li);
  });
  return list;
}

function renderWelcomeContent() {
  const content = document.getElementById('welcome-content');
  content.innerHTML = '';

  const intro = welcomeSection();
  const subtitle = document.createElement('div');
  subtitle.className = 'welcome-subtitle';
  subtitle.textContent = 'Смешивайте стихии и откройте все 342 элемента';
  intro.appendChild(subtitle);

  const starters = document.createElement('div');
  starters.className = 'welcome-starters';
  STARTER_IDS.forEach(id => {
    const chip = document.createElement('span');
    chip.className = 'welcome-starter';
    chip.title = ELEMENTS[id].name;
    chip.innerHTML = buildIconSVG(id, 30);
    starters.appendChild(chip);
  });
  intro.appendChild(starters);
  intro.appendChild(welcomeList([
    'Начните с пяти стихий: <b>Огонь, Вода, Земля, Воздух, Пустота</b>',
    'Перетащите элемент из инвентаря в круг-котёл и нажмите <b>«Смешать»</b> (или Enter)',
    'Пара стихий рождает новый элемент — а иногда взрыв, который тоже может открыть новое'
  ]));
  content.appendChild(intro);

  const controls = welcomeSection('Управление');
  controls.appendChild(welcomeList([
    '<b>Двойной клик / двойной тап</b> по элементу — добавить 1 в котёл',
    '<b>Клик</b> по элементу — информация и рецепты',
    '<b>Клик</b> по элементу в котле — вернуть 1, <b>ПКМ / долгое нажатие</b> — вернуть всё',
    '<span class="welcome-key">✕ Очистить</span> — вернуть всё в инвентарь',
    '<span class="welcome-key">🔍 Поиск</span> — фильтр инвентаря по названию'
  ]));
  content.appendChild(controls);

  const tips = welcomeSection('Советы');
  tips.appendChild(welcomeList([
    'Провалы не страшны: из взрывов иногда рождаются новые элементы',
    'Клик по открытому элементу подскажет, из чего его создают',
    'Гримуар <span class="welcome-key">📖</span> даёт намёки по мере вашего прогресса',
    'Прогресс сохраняется автоматически — можно продолжать в любой момент'
  ]));
  content.appendChild(tips);
}

export function finishWelcome() {
  try { localStorage.setItem(WELCOME_KEY, '1'); } catch {}
  getModal().style.display = 'none';
  startTutorialHighlight();
}

function startTutorialHighlight() {
  const canvas = document.getElementById('game-canvas');
  const mixBtn = document.getElementById('mix-btn');
  const panel = document.getElementById('center-panel');
  if (!canvas || !mixBtn || !panel) return;
  stopTutorialHighlight();

  isMobile = window.matchMedia('(max-width: 767px)').matches;

  ringEl = document.createElement('div');
  ringEl.className = 'tutorial-ring';
  ringEl.setAttribute('aria-hidden', 'true');
  panel.appendChild(ringEl);
  positionRing();

  mixBtn.classList.add('tutorial-pulse');
  if (isMobile) {
    const invTab = document.querySelector('.tab-btn[data-tab="inventory"]');
    if (invTab) invTab.classList.add('tutorial-pulse');
  }
  canvas.addEventListener('pointerdown', stopTutorialHighlight);
  window.addEventListener('resize', positionRing);

  showTutorialHint(isMobile ? 'Вот так! Откройте 📦 внизу и перетащите элемент в круг' : 'Вот так — перетащите элемент в круг');
  DEMO_ELEMENTS.forEach((id, i) => scheduleGhostDrag(id, 800 + i * 1700));
  scheduleHintChange('Теперь нажмите «Смешать»', 800 + DEMO_ELEMENTS.length * 1700 + 400);

  highlightTimer = setTimeout(stopTutorialHighlight, HIGHLIGHT_MS);
}

function scheduleGhostDrag(id, delay) {
  tutorialTimers.push(setTimeout(() => ghostDrag(id), delay));
}

function scheduleHintChange(text, delay) {
  tutorialTimers.push(setTimeout(() => setHintText(text), delay));
}

function ghostDrag(id) {
  if (!ringEl) return;
  const start = ghostStartPoint(id);
  const end = cauldronCenter();
  if (!start || !end) return;

  const ghost = document.createElement('div');
  ghost.className = 'tutorial-ghost';
  ghost.innerHTML = buildIconSVG(id, 36);
  ghost.style.transform = `translate(${start.x}px, ${start.y}px) translate(-50%, -50%)`;
  ghost.style.opacity = '0';
  document.body.appendChild(ghost);
  tutorialGhosts.push(ghost);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!ghost.isConnected) return;
    ghost.style.transform = `translate(${end.x}px, ${end.y}px) translate(-50%, -50%)`;
    ghost.style.opacity = '0.8';
  }));

  tutorialTimers.push(setTimeout(() => {
    if (!ghost.isConnected) return;
    ghost.style.opacity = '0';
    setTimeout(() => {
      ghost.remove();
      tutorialGhosts = tutorialGhosts.filter(g => g !== ghost);
    }, 250);
    if (ringEl) ripple(end.x, end.y);
  }, GHOST_FLIGHT_MS));
}

function ghostStartPoint(id) {
  if (isMobile) {
    const tab = document.querySelector('.tab-btn[data-tab="inventory"]');
    if (tab) {
      const r = tab.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    }
  } else {
    const item = document.querySelector(`.inv-item[data-element-id="${id}"]`);
    if (item) {
      const r = item.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }
    }
  }
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return null;
  const cr = canvas.getBoundingClientRect();
  return { x: cr.left + cr.width / 2 - RADIUS * 1.2, y: cr.top + cr.height / 2 };
}

function cauldronCenter() {
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return null;
  const r = canvas.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function ripple(x, y) {
  if (rippleEl) rippleEl.remove();
  rippleEl = document.createElement('div');
  rippleEl.className = 'tutorial-ripple';
  rippleEl.style.left = x + 'px';
  rippleEl.style.top = y + 'px';
  document.body.appendChild(rippleEl);
  tutorialTimers.push(setTimeout(() => {
    if (rippleEl) { rippleEl.remove(); rippleEl = null; }
  }, 800));
}

function showTutorialHint(text) {
  hintEl = document.createElement('div');
  hintEl.className = 'tutorial-hint';
  hintEl.textContent = text;
  positionHint();
  document.body.appendChild(hintEl);
}

function setHintText(text) {
  if (hintEl) hintEl.textContent = text;
}

function positionHint() {
  if (!hintEl) return;
  const canvas = document.getElementById('game-canvas');
  if (!canvas) return;
  const r = canvas.getBoundingClientRect();
  hintEl.style.left = (r.left + r.width / 2) + 'px';
  hintEl.style.top = Math.max(8, r.top - 46) + 'px';
}

function positionRing() {
  if (!ringEl) return;
  const canvas = document.getElementById('game-canvas');
  const panel = document.getElementById('center-panel');
  if (!canvas || !panel) return;
  const pr = panel.getBoundingClientRect();
  const cr = canvas.getBoundingClientRect();
  const size = Math.max(20, RADIUS * 2);
  ringEl.style.width = size + 'px';
  ringEl.style.height = size + 'px';
  ringEl.style.left = (cr.left - pr.left + cr.width / 2 - size / 2) + 'px';
  ringEl.style.top = (cr.top - pr.top + cr.height / 2 - size / 2) + 'px';
}

function stopTutorialHighlight() {
  if (ringEl) { ringEl.remove(); ringEl = null; }
  tutorialGhosts.forEach(g => g.remove());
  tutorialGhosts = [];
  if (rippleEl) { rippleEl.remove(); rippleEl = null; }
  if (hintEl) { hintEl.remove(); hintEl = null; }
  tutorialTimers.forEach(clearTimeout);
  tutorialTimers = [];
  const mixBtn = document.getElementById('mix-btn');
  if (mixBtn) mixBtn.classList.remove('tutorial-pulse');
  const invTab = document.querySelector('.tab-btn[data-tab="inventory"]');
  if (invTab) invTab.classList.remove('tutorial-pulse');
  window.removeEventListener('resize', positionRing);
  const canvas = document.getElementById('game-canvas');
  if (canvas) canvas.removeEventListener('pointerdown', stopTutorialHighlight);
  clearTimeout(highlightTimer);
}