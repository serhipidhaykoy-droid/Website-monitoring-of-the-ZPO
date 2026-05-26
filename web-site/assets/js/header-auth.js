/* header-auth.js — для всіх 21 сторінок (публічних + 14 форм).
   Якщо користувач авторизований через Supabase Auth:
   - Якщо role='admin' → додає кнопку «Адмін-панель» ПЕРЕД кожним «Кабінет ЗПО»
   - У будь-якому випадку → додає кнопку «Вийти» ПІСЛЯ кожного «Кабінет ЗПО»

   Працює у 3 контекстах:
   - Публічні сторінки header (Tailwind .hidden md:inline-flex)
   - Форми моніторингу (верхня синя смуга з inline-стилями)
   - Mobile menu (вертикальний список)
*/

import { sb, getSession, signOut, refreshUserMeta } from '/assets/js/supabase-client.js';

function ctxOf(link) {
  if (link.style.cssText.length > 0) return 'inline';
  if (link.closest('#mobile-menu')) return 'mobile';
  return 'desktop';
}

function makeAdminLink(ctx) {
  const a = document.createElement('a');
  a.href = '/monitoring/admin/';
  a.dataset.adminLink = '1';
  a.title = 'Адмін-панель НМЦ ПТО';
  if (ctx === 'inline') {
    a.style.cssText =
      'color:#fff;background:#3b6ee0;text-decoration:none;font-weight:600;' +
      'padding:4px 12px;border-radius:5px;margin-right:10px;font-size:13px;' +
      'display:inline-flex;align-items:center;gap:5px';
    a.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">' +
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Адмін-панель';
  } else if (ctx === 'mobile') {
    a.className = 'nav-link mt-1 text-brand-blue font-semibold';
    a.textContent = '→ Адмін-панель';
  } else {
    a.className =
      'hidden md:inline-flex items-center gap-2 mr-2 px-4 py-2 text-sm ' +
      'font-semibold text-white bg-brand-blue-deep hover:bg-brand-blue rounded-lg transition-colors';
    a.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">' +
      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Адмін-панель';
  }
  return a;
}

function makeLogoutLink(ctx) {
  const a = document.createElement('a');
  a.href = '#';
  a.title = 'Вийти з кабінету ЗПО';
  if (ctx === 'inline') {
    a.style.cssText =
      'color:#fff;background:#dc2626;text-decoration:none;font-weight:600;' +
      'padding:4px 12px;border-radius:5px;margin-left:10px;font-size:13px;' +
      'display:inline-flex;align-items:center;gap:5px';
    a.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">' +
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
      '<polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>Вийти';
  } else if (ctx === 'mobile') {
    a.className = 'nav-link mt-1 text-red-600 font-semibold';
    a.textContent = '→ Вийти з кабінету';
  } else {
    a.className =
      'hidden md:inline-flex items-center gap-2 ml-2 px-4 py-2 text-sm ' +
      'font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors';
    a.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">' +
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
      '<polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>Вийти';
  }
  a.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Вийти з кабінету ЗПО?')) signOut('/');
  });
  return a;
}

async function init() {
  const session = await getSession();
  if (!session) return;

  /* Оновити свіжі дані з сервера: user_metadata міг бути оновлений */
  await refreshUserMeta();
  const { data: userData } = await sb.auth.getUser();
  const meta = userData?.user?.user_metadata || session.user?.user_metadata || {};
  const isAdmin = meta.role === 'admin';

  console.log('[header-auth] role:', meta.role || '—', 'institution:', meta.institution_id || '—', 'isAdmin:', isAdmin);

  document.querySelectorAll('a[href="/monitoring/login.html"]').forEach((link) => {
    const ctx = ctxOf(link);

    /* 0) Адмін: додати «Адмін-панель» ПЕРЕД «Кабінет ЗПО» */
    if (isAdmin && !link.previousElementSibling?.dataset?.adminLink) {
      link.parentNode.insertBefore(makeAdminLink(ctx), link);
    }

    /* 1) Кнопка «Вийти» ПІСЛЯ «Кабінет ЗПО» */
    if (!link.dataset.logoutAdded) {
      link.dataset.logoutAdded = '1';
      link.parentNode.insertBefore(makeLogoutLink(ctx), link.nextSibling);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
