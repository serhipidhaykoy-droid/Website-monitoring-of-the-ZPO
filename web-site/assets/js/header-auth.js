/* header-auth.js — для всіх 21 сторінок (публічних + 14 форм).
   Якщо користувач авторизований через Supabase Auth, додає кнопку «Вийти»
   ОДРАЗУ ПІСЛЯ кожного посилання «Кабінет ЗПО».

   Працює у двох контекстах:
   - Публічні сторінки: header з Tailwind-класами (.hidden md:inline-flex)
   - Форми моніторингу: верхня синя смуга з inline-стилями
*/

import { getSession, signOut } from '/assets/js/supabase-client.js';

async function init() {
  const session = await getSession();
  if (!session) return; // не залогінений — нічого не робимо

  /* 1) Вставити кнопку «Вийти» після кожного «Кабінет ЗПО» */
  document.querySelectorAll('a[href="/monitoring/login.html"]').forEach((link) => {
    if (link.dataset.logoutAdded) return;
    link.dataset.logoutAdded = '1';

    const logout = document.createElement('a');
    logout.href = '#';
    logout.title = 'Вийти з кабінету ЗПО';

    // Визначаємо контекст: чи це inline-стилі (форми) чи Tailwind (публічні)
    const isInlineCtx = link.style.cssText.length > 0;
    const isInMobileMenu = !!link.closest('#mobile-menu');

    if (isInlineCtx) {
      // Контекст form'и (верхня синя смуга з inline-стилями)
      logout.style.cssText =
        'color:#fff;background:#dc2626;text-decoration:none;font-weight:600;' +
        'padding:4px 12px;border-radius:5px;margin-left:10px;font-size:13px;' +
        'display:inline-flex;align-items:center;gap:5px';
      logout.innerHTML =
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">' +
        '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
        '<polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>Вийти';
    } else if (isInMobileMenu) {
      // Mobile menu (вертикальний список)
      logout.className = 'nav-link mt-1 text-red-600 font-semibold';
      logout.textContent = '→ Вийти з кабінету';
    } else {
      // Контекст header (Tailwind), Desktop
      logout.className =
        'hidden md:inline-flex items-center gap-2 ml-2 px-4 py-2 text-sm ' +
        'font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors';
      logout.innerHTML =
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">' +
        '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
        '<polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>Вийти';
    }

    logout.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Вийти з кабінету ЗПО?')) signOut('/');
    });

    link.parentNode.insertBefore(logout, link.nextSibling);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
