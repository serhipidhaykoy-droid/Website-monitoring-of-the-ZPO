/* supabase-client.js — спільний клієнт для всіх сторінок з backend-логікою.
   Підключається як ES-module:
     <script type="module">
       import { sb, requireAuth, getInstitution, signOut } from '/assets/js/supabase-client.js';
     </script>
*/

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'https://ejvtbfmfhxyvdsrwgxkm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqdnRiZm1maHh5dmRzcndneGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MjU5MjEsImV4cCI6MjA5NTMwMTkyMX0.LzvRzkgNhczxY6egMhHAog3PFf5VdNZ3vJt657oNf1o';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
});

/** Повертає поточну сесію або null. */
export async function getSession() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

/** Повертає institution_id з user_metadata або null. */
export async function getInstitutionId() {
  const session = await getSession();
  return session?.user?.user_metadata?.institution_id ?? null;
}

/** Завантажує повний запис закладу для поточного користувача. */
export async function getInstitution() {
  const id = await getInstitutionId();
  if (!id) return null;
  const { data, error } = await sb.from('institutions').select('*').eq('id', id).single();
  if (error) { console.warn('getInstitution:', error.message); return null; }
  return data;
}

/** Якщо не авторизований — редиректить на сторінку логіну. */
export async function requireAuth(redirectTo = '/monitoring/login.html') {
  if (!(await getSession())) {
    window.location.href = redirectTo + '?next=' + encodeURIComponent(location.pathname);
    return false;
  }
  return true;
}

/** Логаут + редирект. */
export async function signOut(redirectTo = '/monitoring/login.html') {
  await sb.auth.signOut();
  window.location.href = redirectTo;
}

/** Завантажити звіт за form_code + year поточного закладу. */
export async function loadReport(formCode, year) {
  const instId = await getInstitutionId();
  if (!instId) return null;
  const { data, error } = await sb.from('reports')
    .select('data, status, submitted_at, updated_at')
    .eq('institution_id', instId)
    .eq('form_code', formCode)
    .eq('year', year)
    .maybeSingle();
  if (error) { console.warn('loadReport:', error.message); return null; }
  return data;
}

/** Зберегти/оновити звіт. status: 'draft' | 'submitted'. */
export async function saveReport(formCode, year, data, status = 'draft') {
  const instId = await getInstitutionId();
  if (!instId) throw new Error('Не авторизовано як заклад');
  const payload = {
    institution_id: instId,
    year,
    form_code: formCode,
    status,
    data,
    submitted_at: status === 'submitted' ? new Date().toISOString() : null
  };
  const { error } = await sb.from('reports')
    .upsert(payload, { onConflict: 'institution_id,year,form_code' });
  if (error) throw error;
}
