# Налаштування платформи моніторингу — інструкція для адміністратора НМЦ ПТО

Документ описує **повний цикл** запуску платформи: створення Supabase-проєкту, виконання SQL-схеми, реєстрація користувачів-закладів, призначення адмінів.

---

## 1. Підготовка Supabase проєкту

> Цей крок виконується ОДИН РАЗ. Якщо проєкт уже створено — перейти до п.2.

1. Зайти на https://supabase.com → Sign up через GitHub або email
2. **New project**:
   - Name: `monitoring-zpo-luhansk`
   - Database password: згенерувати, **зберегти** у password manager
   - Region: **Frankfurt (eu-central-1)** — найближчий до України
   - Plan: **Free** (до 500 MB бази)
3. Дочекатись готовності (~1–2 хв)
4. **Settings → API** → копіювати:
   - **Project URL**: `https://<projectref>.supabase.co`
   - **anon public key**: довгий JWT, починається з `eyJh...`
   - **НЕ копіювати** `service_role` ключ — це сервер-приватний

5. У файлі `web-site/assets/js/supabase-client.js` вставити Project URL і anon key
   (зараз там уже стоять значення для нашого проєкту `ejvtbfmfhxyvdsrwgxkm`)

---

## 2. Виконати схему БД

1. **Supabase Studio → SQL Editor → New query**
2. Скопіювати весь вміст файлу `database/schema.sql` (~170 рядків)
3. Натиснути **Run**
4. Має з'явитись `Success. No rows returned`
5. Перевірка: **Table Editor → institutions** → має бути **9 рядків** (9 закладів)
6. Перевірка: **Database → Policies** → таблиця `reports` має 3 політики:
   - "Public read institutions"
   - "Institution manages own reports"
   - "Admin reads all reports"

---

## 3. Створити обліковий запис для **кожного** з 9 закладів

Покрокова інструкція для **ОДНОГО** закладу (повторити 9 разів):

### 3.1. Створити користувача в Authentication

1. **Authentication → Users → Add user → Create new user**
2. Заповнити поля:
   - **Email**: офіційна пошта закладу з таблиці нижче
   - **Password**: вигадайте/згенеруйте надійний (мінімум 8 символів)
   - ☑ **Auto Confirm User** ← **ОБОВ'ЯЗКОВО** (інакше треба буде підтверджувати через email)
3. Натиснути **Create user**

### 3.2. Прив'язати до закладу через SQL

Після створення користувача, виконати у **SQL Editor**:

```sql
-- Прив'язати закладу до закладу за email
-- Заміните <EMAIL> та <ID> на конкретні значення з таблиці нижче
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{institution_id}',
  '"<ID>"'
)
WHERE email = '<EMAIL>';
```

### 3.3. Передати дані закладу

Безпечно (НЕ через відкритий чат) передати закладу:
- URL входу: `https://<your-site>/monitoring/login.html`
- Email (їхній, той самий що ввели)
- Тимчасовий пароль
- Рекомендація змінити пароль після першого входу (поки що зміна паролю — через звернення до вас, оскільки UI самостійної зміни не реалізовано)

### Таблиця: email → institution_id для 9 закладів

| № | Назва закладу (short_name) | Email | ID для metadata |
|---|---|---|---|
| 1 | ВПУ № 92 | `vpu92sever@ukr.net` | `vpu-92` |
| 2 | ВПУ № 94 | `lvpy94@ukr.net` | `vpu-94` |
| 3 | Сєвєродонецьке ВПУ | `sed_vpu@ukr.net` | `svpu` |
| 4 | Сєвєродонецький ПЛ | `spl_53@ukr.net` | `spl` |
| 5 | Привільський ПЛ | `ppl55@ukr.net` | `ppl` |
| 6 | Золотівський ПЛ | `zpl_83@ukr.net` | `zpl` |
| 7 | Лисичанський ПТКЛ | `listorgkl@ukr.net` | `lptkl` |
| 8 | Рубіжанський ПХТЛ | `rpxtl13@ukr.net` | `rphtl` |
| 9 | РЦПО ЛНУ | `liceylny@ukr.net` | `rcpo` |

### 3.4. Bulk-варіант (один SQL для всіх 9 одразу — якщо вже створили всі облікові)

Після того як ви створили **усі 9** користувачів у Authentication (з відповідними email'ами), запустіть ОДИН раз цей SQL:

```sql
-- Прив'язати ВСІ 9 закладів за один раз
UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data,'{}'::jsonb),'{institution_id}','"vpu-92"') WHERE email='vpu92sever@ukr.net';
UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data,'{}'::jsonb),'{institution_id}','"vpu-94"') WHERE email='lvpy94@ukr.net';
UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data,'{}'::jsonb),'{institution_id}','"svpu"') WHERE email='sed_vpu@ukr.net';
UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data,'{}'::jsonb),'{institution_id}','"spl"') WHERE email='spl_53@ukr.net';
UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data,'{}'::jsonb),'{institution_id}','"ppl"') WHERE email='ppl55@ukr.net';
UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data,'{}'::jsonb),'{institution_id}','"zpl"') WHERE email='zpl_83@ukr.net';
UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data,'{}'::jsonb),'{institution_id}','"lptkl"') WHERE email='listorgkl@ukr.net';
UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data,'{}'::jsonb),'{institution_id}','"rphtl"') WHERE email='rpxtl13@ukr.net';
UPDATE auth.users SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data,'{}'::jsonb),'{institution_id}','"rcpo"') WHERE email='liceylny@ukr.net';

-- Перевірити результат:
SELECT email, raw_user_meta_data FROM auth.users WHERE email IN (
  'vpu92sever@ukr.net','lvpy94@ukr.net','sed_vpu@ukr.net','spl_53@ukr.net',
  'ppl55@ukr.net','zpl_83@ukr.net','listorgkl@ukr.net','rpxtl13@ukr.net','liceylny@ukr.net'
);
```

Має повернути 9 рядків — кожен з `{"institution_id": "..."}`.

---

## 4. Створити обліковий запис АДМІНА (координатора НМЦ ПТО)

Адмін бачить дані ВСІХ 9 закладів у адмін-панелі (`/monitoring/admin/`).

### Варіант А: окремий обліковий запис для адміна

1. **Authentication → Users → Add user**
2. Email: офіційна пошта НМЦ ПТО (напр. `nmc_pto_lug@ukr.net`) АБО ваша персональна
3. Password: надійний
4. ☑ Auto Confirm User
5. Виконати у SQL Editor:
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data = '{"role":"admin"}'::jsonb
   WHERE email = 'nmc_pto_lug@ukr.net';  -- ← заміните на свій
   ```

### Варіант Б: дати адмін-роль існуючому користувачу (наприклад одному з закладів)

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'vpu92sever@ukr.net';  -- ← email того, кого робите адміном
```

Такий користувач буде одночасно і закладом (бачить свої форми) і адміном (бачить дашборд).

### 4.1. Після створення адміна

1. Адмін має **повторно увійти** на сайт (вийти і знов залогінитись) — щоб JWT оновився з role=admin
2. У шапці поряд з «Кабінет ЗПО» з'явиться синя кнопка **«Адмін-панель»**
3. Клік → `/monitoring/admin/` → доступ до всіх звітів усіх закладів

---

## 5. Діагностика проблем

### Сторінка діагностики

Заклад або адмін може зайти на `/monitoring/check.html` — там покаже:
- ✓ зв'язок з Supabase
- ✓ статус автентифікації
- ✓ чи прив'язано до закладу (institution_id)
- ✓ роль (admin/заклад)
- 📊 кількість записів у БД для цього закладу по кожній формі
- 📊 кількість записів у localStorage цього браузера

### Поширені проблеми

| Симптом | Причина | Розв'язання |
|---|---|---|
| Жовтий банер «не прив'язано до закладу» | JWT не містить institution_id | Виконати UPDATE auth.users з jsonb_set + relogin |
| Дані не видно на іншому пристрої | Не виконано SUBMIT/SAVE на першому | Заклад має натиснути «Зберегти чернетку» або «Відправити» |
| Дані не видно на іншому пристрої (хоча подано) | RLS блокує (нема institution_id) | Перевірити через `/monitoring/check.html` |
| Кнопка «Адмін-панель» не з'являється | JWT не містить role=admin | Виконати UPDATE з role + relogin |
| Не може створити користувача | Auto Confirm User не увімкнено | Створити заново з ☑ Auto Confirm |

### Перевірка через SQL

```sql
-- Які користувачі є і їх metadata
SELECT email, raw_user_meta_data, created_at, last_sign_in_at
FROM auth.users
ORDER BY created_at;

-- Скільки звітів у кожному закладі
SELECT i.short_name, count(r.*) AS reports
FROM institutions i
LEFT JOIN reports r ON r.institution_id = i.id
GROUP BY i.short_name
ORDER BY reports DESC;

-- Які форми заповнено за поточний рік
SELECT form_code, count(*) AS submitted
FROM reports
WHERE year = extract(year FROM now())::int AND status='submitted'
GROUP BY form_code
ORDER BY form_code;
```

---

## 6. Бекап і відновлення

Supabase автоматично робить щоденні бекапи (Free plan: 7 днів).

Для ручного експорту даних:
- **Адмін** через UI → `/monitoring/admin/` → кнопка «Експорт XLSX» (поточний фільтр)
- **Розробник** через SQL Editor → SELECT * FROM reports → Download as CSV

---

## 7. Безпека

- Не публікуйте `service_role` ключ у frontend-коді (anon key — публічний за дизайном, це норма)
- Передавайте паролі через захищений канал (Signal, не SMS/email у відкритому вигляді)
- Періодично перевіряйте `auth.users` — чи нема невідомих облікових записів
- Якщо заклад втратив пароль — у Supabase Studio: **Authentication → Users → клік на user → Send password reset** (працює тільки якщо у user встановлено email-confirmed; інакше через SQL: задайте новий пароль через `UPDATE auth.users`)
