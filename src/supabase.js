import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const isConfigured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export async function getSave(code) {
  const url = `${SUPABASE_URL}/rest/v1/saves?select=code,data&code=eq.${encodeURIComponent(code)}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET save failed: ${res.status}`);
  const rows = await res.json();
  return rows[0] || null;
}

export async function upsertSave(code, data, updatedAt) {
  const url = `${SUPABASE_URL}/rest/v1/saves?on_conflict=code`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ code, data, updated_at: updatedAt }),
  });
  if (!res.ok) throw new Error(`UPSERT save failed: ${res.status}`);
}

export async function deleteSave(code) {
  const url = `${SUPABASE_URL}/rest/v1/saves?code=eq.${encodeURIComponent(code)}`;
  const res = await fetch(url, { method: 'DELETE', headers: HEADERS });
  if (!res.ok) throw new Error(`DELETE save failed: ${res.status}`);
}
