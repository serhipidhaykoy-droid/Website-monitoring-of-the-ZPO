/* logout-fab.js — завжди-видима плаваюча кнопка «Вийти».
   Підключається на ВСІ сторінки (публічні + 14 форм).
   Якщо є активна сесія Supabase Auth — показує червону кнопку у top-right
   із підтвердженням виходу. Працює навіть якщо інші auth-скрипти зламані. */

import { sb, signOut, getSession } from '/assets/js/supabase-client.js';

const FAB_ID = 'logout-fab';

function injectStyles() {
  if (document.getElementById('logout-fab-styles')) return;
  const s = document.createElement('style');
  s.id = 'logout-fab-styles';
  s.textContent = `
    #${FAB_ID} {
      position: fixed; top: 12px; right: 12px; z-index: 9999;
      background: #dc2626; color: #fff;
      padding: 8px 14px; border-radius: 8px;
      font-family: Inter, Arial, sans-serif; font-size: 13px; font-weight: 600;
      text-decoration: none; cursor: pointer;
      box-shadow: 0 6px 16px rgba(220,38,38,.35);
      display: inline-flex; align-items: center; gap: 6px;
      transition: background .15s, transform .15s;
    }
    #${FAB_ID}:hover { background: #b91c1c; transform: translateY(-1px); }
    @media print { #${FAB_ID} { display: none !important } }
  `;
  document.head.appendChild(s);
}

function makeBtn() {
  const a = document.createElement('a');
  a.id = FAB_ID;
  a.href = '#';
  a.title = 'Вийти з кабінету ЗПО';
  a.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">' +
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
    '<polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>' +
    'Вийти';
  a.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Вийти з кабінету ЗПО?')) signOut('/');
  });
  return a;
}

async function init() {
  const session = await getSession();
  if (!session) return; // не залогінений — не показуємо
  if (document.getElementById(FAB_ID)) return; // вже є
  injectStyles();
  document.body.appendChild(makeBtn());
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
