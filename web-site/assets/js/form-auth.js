/* form-auth.js — auth guard + lock institution для всіх 14 моніторингових форм.
   Підключається як ES-module наприкінці кожної форми:
     <script type="module" src="/assets/js/form-auth.js"></script>

   Залежить від /assets/js/supabase-client.js. */

import { sb, getSession, getInstitution, signOut } from '/assets/js/supabase-client.js';

const BANNER_ID = 'auth-banner';

/* Чекаємо, доки форма заповнить #f-institution опціями (до 3 сек) */
async function waitForFormReady(maxMs = 3000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    const sel = document.getElementById('f-institution');
    if (sel && sel.options.length > 0) return true;
    await new Promise(r => setTimeout(r, 50));
  }
  return false;
}

function createBanner() {
  let el = document.getElementById(BANNER_ID);
  if (el) return el;
  el = document.createElement('div');
  el.id = BANNER_ID;
  el.style.cssText = 'font-family:Inter,Arial,sans-serif;font-size:14px;padding:10px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;border-bottom:1px solid #cbd9ec';
  const header = document.querySelector('header');
  if (header) header.parentNode.insertBefore(el, header);
  else document.body.insertBefore(el, document.body.firstChild);
  return el;
}

function normalize(s) {
  return (s || '').toLowerCase().replace(/[«»"'.,]/g, '').replace(/\s+/g, ' ').trim();
}

function lockInstitutionSelect(sel, inst) {
  const opts = Array.from(sel.options);
  // 1) точна відповідність повного імені
  let match = opts.find(o => o.value === inst.name);
  // 2) нормалізована відповідність
  if (!match) match = opts.find(o => normalize(o.value) === normalize(inst.name));
  // 3) short_name міститься у назві варіанта
  if (!match && inst.short_name) match = opts.find(o => normalize(o.value).includes(normalize(inst.short_name)));

  if (match) {
    sel.value = match.value;
  } else {
    // Якщо жоден варіант не підходить — додаємо опцію вгорі
    const opt = document.createElement('option');
    opt.value = inst.name;
    opt.textContent = inst.short_name ? inst.short_name + ' — ' + inst.name : inst.name;
    opt.selected = true;
    sel.insertBefore(opt, sel.firstChild);
    sel.value = inst.name;
  }
  sel.dispatchEvent(new Event('change', { bubbles: true }));
  sel.dispatchEvent(new Event('input',  { bubbles: true }));

  sel.disabled = true;
  sel.style.background = '#f1f5f9';
  sel.style.cursor = 'not-allowed';
  sel.style.opacity = '0.9';

  // Підказка «🔒 зафіксовано»
  const hint = document.createElement('div');
  hint.textContent = '🔒 Заклад зафіксовано за вашим обліковим записом';
  hint.style.cssText = 'font-size:12px;color:#15803d;margin-top:4px;font-weight:600';
  sel.parentNode.appendChild(hint);
}

async function setupAuthenticated(banner) {
  const inst = await getInstitution();
  if (!inst) {
    banner.style.background = '#fef3c7';
    banner.style.color = '#854d0e';
    banner.innerHTML =
      '<span>⚠ Обліковий запис не прив\'язано до закладу. Якщо адміністратор щойно оновив дані, ' +
      'спробуйте <a href="#" id="auth-relogin" style="text-decoration:underline;font-weight:600;color:currentColor">вийти і знову увійти</a>. ' +
      'Інакше зверніться до координатора НМЦ ПТО.</span>' +
      '<a href="#" id="auth-signout-2" style="background:#16357a;color:#fff;padding:6px 14px;border-radius:6px;text-decoration:none;font-weight:600">Вийти</a>';
    document.getElementById('auth-relogin')?.addEventListener('click', (e) => {
      e.preventDefault(); signOut('/monitoring/login.html?next=' + encodeURIComponent(location.pathname));
    });
    document.getElementById('auth-signout-2')?.addEventListener('click', (e) => {
      e.preventDefault(); signOut('/monitoring/login.html');
    });
    return;
  }
  banner.style.background = '#dcfce7';
  banner.style.color = '#15803d';
  banner.innerHTML =
    `<span><strong>${inst.short_name || inst.name}</strong>` +
    (inst.director ? ` · ${inst.director}` : '') +
    `</span>` +
    `<a href="#" id="auth-signout" style="color:currentColor;text-decoration:underline;font-weight:600">Вийти</a>`;
  document.getElementById('auth-signout').addEventListener('click', (e) => {
    e.preventDefault();
    signOut('/monitoring/login.html');
  });

  const sel = document.getElementById('f-institution');
  if (sel) lockInstitutionSelect(sel, inst);
}

function disableFormInputs() {
  document.querySelectorAll(
    '#f-institution, #f-year, input[type="number"], input[type="text"], input[type="email"], input[type="tel"], textarea, .form-section input, .form-section select'
  ).forEach(el => {
    el.disabled = true;
    el.style.opacity = '0.5';
    el.style.cursor = 'not-allowed';
  });
  document.querySelectorAll('#btn-save, #btn-submit, button[type="submit"], .btn.primary, .btn.secondary').forEach(b => {
    // Не чіпаємо кнопки навігації табів
    if (b.dataset && b.dataset.view) return;
    b.disabled = true;
    b.style.opacity = '0.5';
    b.style.cursor = 'not-allowed';
  });
}

function setupUnauthenticated(banner) {
  banner.style.background = '#fef3c7';
  banner.style.color = '#854d0e';
  const nextUrl = encodeURIComponent(location.pathname);
  banner.innerHTML =
    `<span>⚠ Для заповнення форми увійдіть як заклад освіти. Без авторизації доступний лише перегляд вкладки «Результати».</span>` +
    `<a href="/monitoring/login.html?next=${nextUrl}" style="background:#16357a;color:#fff;padding:8px 16px;border-radius:6px;text-decoration:none;font-weight:600">Увійти</a>`;

  // Сховати вкладку «Форма»
  const formTab = document.querySelector('.tab[data-view="form"]');
  if (formTab) formTab.style.display = 'none';

  // Перемикання на «Результати» (якщо є setView у формі) + повторно через 200мс
  function switchToResults() {
    if (typeof window.setView === 'function') {
      try { window.setView('results'); } catch (e) {}
    } else {
      document.querySelector('.tab[data-view="results"]')?.click();
    }
  }
  switchToResults();
  setTimeout(switchToResults, 200);

  disableFormInputs();
}

async function init() {
  await waitForFormReady();
  const banner = createBanner();
  const session = await getSession();
  if (session) await setupAuthenticated(banner);
  else setupUnauthenticated(banner);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 0));
} else {
  setTimeout(init, 0);
}
