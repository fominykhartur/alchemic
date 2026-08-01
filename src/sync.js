import { isConfigured, getSave, upsertSave, deleteSave } from './supabase.js';
import { exportGameData, importGameData, saveGame } from './state.js';
import { exportNotebookData, importNotebookData, saveNotebook } from './notebook.js';

const SYNC_KEY_STORE = 'alchemic_sync_key';
const SYNC_META_KEY = 'alchemic_sync_meta';
const PUSH_DEBOUNCE_MS = 1500;
const PULL_INTERVAL_MS = 30000;
const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

let syncKey = null;
let lastLocalChange = 0;
let initialized = false;
let pushTimer = null;
let dirty = false;

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
  if (!el) return;
  const labels = {
    disabled: '☁ не настроено',
    syncing: '⟳ синхронизация…',
    online: '☁ синхронизировано',
    offline: '⚠ офлайн',
  };
  el.textContent = labels[status] || '☁';
  el.className = 'sync-status ' + status;
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

async function flushPush() {
  pushTimer = null;
  if (!dirty || !isConfigured()) return;
  dirty = false;
  setStatus('syncing');
  try {
    await upsertSave(syncKey, buildDoc(lastLocalChange), new Date(lastLocalChange).toISOString());
    setStatus('online');
  } catch {
    setStatus('offline');
    dirty = true;
  }
}

// ─── Merge ───

function unionArrays(...arrays) {
  return [...new Set(arrays.flat())];
}

function merge(local, cloud) {
  const ls = local.save || {};
  const cs = cloud.save || {};

  const inventory = {};
  new Set([...Object.keys(ls.inventory || {}), ...Object.keys(cs.inventory || {})]).forEach(id => {
    inventory[id] = Math.max(ls.inventory?.[id] || 0, cs.inventory?.[id] || 0);
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
  const entryMap = new Map();
  (lnb.entries || []).forEach(e => e && e.id && entryMap.set(e.id, e));
  (cnb.entries || []).forEach(e => e && e.id && entryMap.set(e.id, e));

  return {
    v: 1,
    updatedAt: Math.max(local.updatedAt || 0, cloud.updatedAt || 0),
    save: {
      v: 1,
      discovered: unionArrays(ls.discovered || [], cs.discovered || []),
      foundRecipes: unionArrays(ls.foundRecipes || [], cs.foundRecipes || []),
      inventory,
      achievements: unionArrays(ls.achievements || [], cs.achievements || []),
      triedPairs: unionArrays(ls.triedPairs || [], cs.triedPairs || []),
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

// ─── Pull ───

async function pullFromCloud() {
  if (!isConfigured()) return;
  setStatus('syncing');
  try {
    const row = await getSave(syncKey);
    if (!row || !row.data) {
      if (lastLocalChange > 0) await flushPush();
      else setStatus('online');
      return;
    }

    const cloud = row.data;
    const local = buildDoc(lastLocalChange);
    const merged = merge(local, cloud);

    const changed =
      JSON.stringify(merged.save) !== JSON.stringify(local.save) ||
      JSON.stringify(merged.notebook) !== JSON.stringify(local.notebook);

    if (changed) applyDoc(merged);

    if ((merged.updatedAt || 0) >= (cloud.updatedAt || 0)) {
      dirty = true;
      await flushPush();
    }
    setStatus('online');
  } catch {
    setStatus('offline');
  }
}

// ─── Init ───

export function initSync() {
  syncKey = loadSyncKey();
  loadMeta();

  const keyInput = document.getElementById('sync-key-input');
  if (keyInput) keyInput.value = syncKey;

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

  if (keyInput) {
    const applyBtn = document.getElementById('sync-key-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const val = keyInput.value.trim().toUpperCase();
        if (!val) return;
        syncKey = val;
        try { localStorage.setItem(SYNC_KEY_STORE, syncKey); } catch {}
        pullFromCloud();
      });
    }
  }

  const copyBtn = document.getElementById('sync-copy');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(syncKey).catch(() => {});
      } else {
        keyInput?.select();
      }
    });
  }

  const deleteBtn = document.getElementById('sync-delete');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Удалить облачное сохранение? Локальный прогресс не пострадает.')) return;
      try {
        await deleteSave(syncKey);
        setStatus('online');
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
