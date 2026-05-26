/* header-auth.js — для публічних сторінок порталу.
   Якщо користувач авторизований через Supabase Auth, додає кнопку «Вийти»
   у header поруч/під кнопкою «Кабінет ЗПО».

   Підключається як ES-module на всіх 7 публічних сторінках:
     <script type="module" src="/assets/js/header-auth.js"></script>
*/

import { getSession, signOut } from '/assets/js/supabase-client.js';

const LOGOUT_BTN_ID = 'hdr-logout-btn';
const LOGOUT_MOBILE_ID = 'hdr-logout-mobile';

function makeLogoutDesktopBtn() {
  const a = document.createElement('a');
  a.id = LOGOUT_BTN_ID;
  a.href = '#';
  a.className = 'hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors';
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

function makeLogoutMobileLink() {
  const a = document.createElement('a');
  a.id = LOGOUT_MOBILE_ID;
  a.href = '#';
  a.className = 'nav-link mt-1 text-red-600 font-semibold';
  a.textContent = '→ Вийти з кабінету';
  a.addEventListener('click', (e) => {
    e.preventDefault();
    if (confirm('Вийти з кабінету ЗПО?')) signOut('/');
  });
  return a;
}

async function init() {
  const session = await getSession();
  if (!session) return; // не залогінений — нічого не робимо

  /* 1) Desktop: вставити кнопку «Вийти» одразу ПІСЛЯ «Кабінет ЗПО» */
  const cabinetBtn = document.querySelector('header a[href="/monitoring/login.html"]');
  if (cabinetBtn && !document.getElementById(LOGOUT_BTN_ID)) {
    const logout = makeLogoutDesktopBtn();
    cabinetBtn.parentNode.insertBefore(logout, cabinetBtn.nextSibling);
  }

  /* 2) Mobile menu: додати рядок «Вийти з кабінету» у #mobile-menu */
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu && !document.getElementById(LOGOUT_MOBILE_ID)) {
    const container = mobileMenu.querySelector('.flex.flex-col') || mobileMenu;
    container.appendChild(makeLogoutMobileLink());
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
