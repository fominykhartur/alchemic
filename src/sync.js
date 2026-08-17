import { isConfigured, getSave, upsertSave, deleteSave } from './supabase.js';
import { exportGameData, importGameData, saveGame, MAX_TRIED_PAIRS } from './state.js';
import { exportNotebookData, importNotebookData, saveNotebook } from './notebook.js';

const SYNC_KEY_STORE = 'alchemic_sync_key';
const SYNC_TOKEN_STORE = 'alchemic_sync_token';
const SYNC_META_KEY = 'alchemic_sync_meta';
const PUSH_DEBOUNCE_MS = 2500;
const MIN_PUSH_INTERVAL_MS = 3000;
const PULL_INTERVAL_MS = 30000;
const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let syncKey = null;
let syncToken = null;
let lastLocalChange = 0;
let initialized = false;
let pushTimer = null;
let dirty = false;
let lastPushAt = 0;

// ─── Sync key ───

function generateSyncKey() {
  let s = '';
  for (let i = 0; i < 8; i++) s += KEY_CHARS[Math.floor(Math.random() * KEY_CHARS.length)];
  return s;
}

function loadSyncKey() {
  const stored = localStorage.getItem(SYNC_KEY_STORE);
  if (stored) return stored;
  const key = generateSyncKey();
  try { localStorage.setItem(SYNC_KEY_STORE, key); } catch {}
  return key;
}

// ─── Access token ───

function generateToken() {
  const arr = new Uint8Array(16);
  if (crypto?.getRandomValues) crypto.getRandomValues(arr);
  else for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
  return [...arr].map(b => b.toString(16).padStart(2, '0')).join('');
}

function loadSyncToken() {
  const stored = localStorage.getItem(SYNC_TOKEN_STORE);
  return stored || null;
}

function saveToken() {
  try { localStorage.setItem(SYNC_TOKEN_STORE, syncToken); } catch {}
}

function loadMeta() {
  try {
    const m = JSON.parse(localStorage.getItem(SYNC_META_KEY) || 'null');
    lastLocalChange = (m && m.lastLocalChange) || 0;
  } catch {
    lastLocalChange = 0;
  }
}

function saveMeta() {
  try { localStorage.setItem(SYNC_META_KEY, JSON.stringify({ lastLocalChange })); } catch {}
}

// ─── Status ───

function setStatus(status) {
  const el = document.getElementById('sync-status');
  const ind = document.getElementById('sync-indicator');
  const labels = {
    disabled: '☁ не настроено',
    syncing: '⟳ синхронизация…',
    online: '☁ синхронизировано',
    offline: '⚠ офлайн',
    denied: '⚠ неверный ключ',
  };
  if (el) {
    el.textContent = labels[status] || '☁';
    el.className = 'sync-status ' + status;
  }
  if (ind) ind.className = 'sync-indicator ' + status;
}

// ─── Document ───

function buildDoc(updatedAt) {
  return {
    v: 1,
    updatedAt,
    save: exportGameData(),
    notebook: exportNotebookData(),
  };
}

// ─── Push ───

function schedulePush() {
  if (!isConfigured()) return;
  dirty = true;
  if (pushTimer) return;
  pushTimer = setTimeout(flushPush, PUSH_DEBOUNCE_MS);
}

function cancelPush() {
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}

async function flushPush(force = false) {
  pushTimer = null;
  if (!isConfigured()) return null;
  setStatus('syncing');
  const now = Date.now();
  if (!force && lastPushAt && now - lastPushAt < MIN_PUSH_INTERVAL_MS) {
    dirty = true;
    pushTimer = setTimeout(flushPush, MIN_PUSH_INTERVAL_MS - (now - lastPushAt));
    return null;
  }
  dirty = false;
  try {
    if (!syncToken) {
      syncToken = generateToken();
      saveToken();
    }
    const status = await upsertSave(syncKey, syncToken, await compressDoc(buildDoc(lastLocalChange)));
    lastPushAt = Date.now();
    setStatus(status === 'denied' ? 'denied' : 'online');
    return status;
  } catch {
    setStatus('offline');
    dirty = true;
    return null;
  }
}

// ─── Merge ───

function unionArrays(...arrays) {
  return [...new Set(arrays.flat())];
}

function merge(local, cloud) {
  const ls = local.save || {};
  const cs = cloud.save || {};
  const useCloud = (cloud.updatedAt || 0) > (local.updatedAt || 0);

  const inventory = {};
  new Set([...Object.keys(ls.inventory || {}), ...Object.keys(cs.inventory || {})]).forEach(id => {
    const hasLocal = !!ls.inventory && id in ls.inventory;
    const hasCloud = !!cs.inventory && id in cs.inventory;
    inventory[id] = useCloud
      ? (hasCloud ? cs.inventory[id] : (hasLocal ? ls.inventory[id] : 0))
      : (hasLocal ? ls.inventory[id] : (hasCloud ? cs.inventory[id] : 0));
  });

  const lStats = ls.stats || {};
  const cStats = cs.stats || {};
  const elementCreatedCount = {};
  new Set([
    ...Object.keys(lStats.elementCreatedCount || {}),
    ...Object.keys(cStats.elementCreatedCount || {}),
  ]).forEach(id => {
    elementCreatedCount[id] = Math.max(
      lStats.elementCreatedCount?.[id] || 0,
      cStats.elementCreatedCount?.[id] || 0
    );
  });

  const stats = {
    mixCount: Math.max(lStats.mixCount || 0, cStats.mixCount || 0),
    explosionCount: Math.max(lStats.explosionCount || 0, cStats.explosionCount || 0),
    discoveryFromExplosion: Math.max(lStats.discoveryFromExplosion || 0, cStats.discoveryFromExplosion || 0),
    totalCreated: Math.max(lStats.totalCreated || 0, cStats.totalCreated || 0),
    startTime: lStats.startTime && cStats.startTime
      ? Math.min(lStats.startTime, cStats.startTime)
      : (lStats.startTime || cStats.startTime || null),
    elementCreatedCount,
  };

  const lnb = local.notebook || {};
  const cnb = cloud.notebook || {};
  const mainEntries = useCloud ? (cnb.entries || []) : (lnb.entries || []);
  const entryMap = new Map();
  mainEntries.forEach(e => e && e.id && entryMap.set(e.id, e));

  return {
    v: 1,
    updatedAt: Math.max(local.updatedAt || 0, cloud.updatedAt || 0),
    save: {
      v: 1,
      discovered: unionArrays(ls.discovered || [], cs.discovered || []),
      foundRecipes: unionArrays(ls.foundRecipes || [], cs.foundRecipes || []),
      inventory,
      achievements: unionArrays(ls.achievements || [], cs.achievements || []),
      triedPairs: unionArrays(ls.triedPairs || [], cs.triedPairs || []).slice(-MAX_TRIED_PAIRS),
      stats,
    },
    notebook: {
      v: 1,
      entries: [...entryMap.values()].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)),
      knownRecipes: unionArrays(lnb.knownRecipes || [], cnb.knownRecipes || []),
      hasUnseen: !!(lnb.hasUnseen || cnb.hasUnseen),
    },
  };
}

// ─── Apply ───

function applyDoc(doc) {
  if (!doc) return;
  importGameData(doc.save);
  importNotebookData(doc.notebook);
  if (doc.updatedAt > lastLocalChange) {
    lastLocalChange = doc.updatedAt;
    saveMeta();
  }
  saveGame();
  saveNotebook();
  window.dispatchEvent(new CustomEvent('alchemy:cloud-applied'));
}

// ─── Gzip ───

function gzipSupported() {
  return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
}

async function gzipEncode(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

async function gzipDecode(b64) {
  const bin = atob(b64);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).text();
}

async function compressDoc(doc) {
  if (!gzipSupported()) return doc;
  return { c: 1, b64: await gzipEncode(JSON.stringify(doc)) };
}

async function decompressDoc(cloud) {
  if (!cloud || cloud.c !== 1 || typeof cloud.b64 !== 'string') return cloud;
  if (!gzipSupported()) return null;
  try {
    return JSON.parse(await gzipDecode(cloud.b64));
  } catch {
    return null;
  }
}

// ─── Pull ───

async function pullFromCloud() {
  if (!isConfigured()) return;
  setStatus('syncing');
  try {
    if (!syncToken) {
      // Первый запуск на устройстве: становимся владельцем, создаём строку с токеном
      syncToken = generateToken();
      saveToken();
      lastLocalChange = Math.max(lastLocalChange, Date.now());
      saveMeta();
      cancelPush();
      await flushPush(true);
      setStatus('online');
      return;
    }

    const cloud = await decompressDoc(await getSave(syncKey, syncToken));
    if (!cloud) {
      // Строки нет или токен не совпал — пробуем создать/обновить, получим статус
      cancelPush();
      const status = await flushPush(true);
      setStatus(status === 'denied' ? 'denied' : 'online');
      return;
    }

    const local = buildDoc(lastLocalChange);
    const merged = merge(local, cloud);

    const changed =
      JSON.stringify(merged.save) !== JSON.stringify(local.save) ||
      JSON.stringify(merged.notebook) !== JSON.stringify(local.notebook);

    if (changed) applyDoc(merged);

    cancelPush();
    const status = await flushPush(true);
    setStatus(status === 'denied' ? 'denied' : 'online');
  } catch {
    setStatus('offline');
  }
}

// ─── Init ───

export function initSync() {
  syncKey = loadSyncKey();
  syncToken = loadSyncToken();
  loadMeta();

  const keyInput = document.getElementById('sync-key-input');
  const tokenInput = document.getElementById('sync-token-input');
  if (keyInput) keyInput.value = syncKey;
  if (tokenInput && syncToken) tokenInput.value = syncToken;

  if (!isConfigured()) {
    setStatus('disabled');
    return;
  }

  window.addEventListener('alchemy:saved', () => {
    if (!initialized) return;
    lastLocalChange = Date.now();
    saveMeta();
    schedulePush();
  });

  const applyBtn = document.getElementById('sync-key-apply');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const code = (keyInput?.value || '').trim().toUpperCase();
      const token = (tokenInput?.value || '').trim();
      if (!code) return;
      syncKey = code;
      try { localStorage.setItem(SYNC_KEY_STORE, syncKey); } catch {}
      if (token) {
        syncToken = token;
        saveToken();
      }
      pullFromCloud();
    });
  }

  const copyBtn = document.getElementById('sync-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!syncToken) {
        tokenInput?.focus();
        return;
      }
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(syncToken).catch(() => {});
      } else {
        tokenInput?.select();
      }
    });
  }

  const revealBtn = document.getElementById('sync-reveal');
  if (revealBtn && tokenInput) {
    revealBtn.addEventListener('click', () => {
      const reveal = tokenInput.type === 'password';
      tokenInput.type = reveal ? 'text' : 'password';
      tokenInput.focus();
    });
  }

  const deleteBtn = document.getElementById('sync-delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!syncToken) {
        setStatus('denied');
        return;
      }
      if (!confirm('Удалить облачное сохранение? Локальный прогресс не пострадает.')) return;
      try {
        const ok = await deleteSave(syncKey, syncToken);
        setStatus(ok ? 'online' : 'denied');
      } catch {
        setStatus('offline');
      }
    });
  }

  window.addEventListener('focus', () => {
    if (document.visibilityState === 'visible') pullFromCloud();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') pullFromCloud();
  });
  setInterval(pullFromCloud, PULL_INTERVAL_MS);

  pullFromCloud().finally(() => { initialized = true; });
}
