import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const isConfigured = () => !!(SUPABASE_URL && SUPABASE_ANON_KEY);

const HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

export async function getSave(code, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_save`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ p_code: code, p_token: token }),
  });
  if (!res.ok) throw new Error(`get_save failed: ${res.status}`);
  return await res.json();
}

export async function upsertSave(code, token, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/upsert_save`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ p_code: code, p_token: token, p_data: data }),
  });
  if (!res.ok) throw new Error(`upsert_save failed: ${res.status}`);
  return await res.json();
}

export async function deleteSave(code, token) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_save`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ p_code: code, p_token: token }),
  });
  if (!res.ok) throw new Error(`delete_save failed: ${res.status}`);
  return await res.json();
}
