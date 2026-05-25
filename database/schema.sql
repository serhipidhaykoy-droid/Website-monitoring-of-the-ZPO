-- ═══════════════════════════════════════════════════════════════════════════
-- Схема БД для платформи моніторингу ЗПО Луганщини
-- Виконується у Supabase Studio → SQL Editor → New query → Run
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── ТАБЛИЦЯ ЗАКЛАДІВ (статичний довідник з 9 ЗПО) ─────────────────────────
create table if not exists institutions (
  id          text primary key,                     -- 'vpu-92', 'svpu', ...
  "group"     text not null check ("group" in ('vpu','lyc','center')),
  name        text not null,
  short_name  text,
  email       text unique,
  director    text,
  acting      boolean default false,
  city_origin text,
  juridical   text,
  temp_addr   text,
  host        text,
  logo_url    text,
  created_at  timestamptz default now()
);

-- ─── ТАБЛИЦЯ ЗВІТІВ (універсальна під усі 14 форм) ─────────────────────────
create table if not exists reports (
  id              uuid primary key default gen_random_uuid(),
  institution_id  text not null references institutions(id),
  year            smallint not null check (year between 2020 and 2035),
  form_code       text not null,                    -- '1.1', '1.4', '3.5' etc.
  status          text not null default 'draft' check (status in ('draft','submitted')),
  data            jsonb not null default '{}'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  submitted_at    timestamptz,
  unique (institution_id, year, form_code)
);

create index if not exists reports_form_year on reports (form_code, year);
create index if not exists reports_institution on reports (institution_id);

-- ─── ТРИГЕР для оновлення updated_at ───────────────────────────────────────
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists reports_updated_at on reports;
create trigger reports_updated_at before update on reports
  for each row execute function set_updated_at();

-- ─── ROW LEVEL SECURITY ────────────────────────────────────────────────────
alter table institutions enable row level security;
alter table reports enable row level security;

-- Усі (anonymous + authenticated) можуть читати institutions
drop policy if exists "Public read institutions" on institutions;
create policy "Public read institutions"
  on institutions for select to anon, authenticated using (true);

-- Заклади бачать/змінюють тільки свої reports (institution_id з user_metadata)
drop policy if exists "Institution manages own reports" on reports;
create policy "Institution manages own reports"
  on reports for all to authenticated
  using       (institution_id = (auth.jwt() -> 'user_metadata' ->> 'institution_id'))
  with check  (institution_id = (auth.jwt() -> 'user_metadata' ->> 'institution_id'));

-- ─── ПУБЛІЧНА АНАЛІТИКА (агреговані дані без розкриття) ────────────────────
drop view if exists public_reports_agg;
create view public_reports_agg as
  select form_code, year,
         count(*)                                       as total,
         count(*) filter (where status = 'submitted')   as submitted
  from reports
  group by form_code, year;

grant select on public_reports_agg to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ЗАПОВНЕННЯ ДОВІДНИКА: 9 ЗАКЛАДІВ ПРОФЕСІЙНОЇ ОСВІТИ ЛУГАНЩИНИ
-- ═══════════════════════════════════════════════════════════════════════════
insert into institutions (id, "group", name, short_name, email, director, acting, city_origin, juridical, temp_addr, host, logo_url) values
  ('vpu-92', 'vpu',
   'Вище професійне училище № 92 м. Сєвєродонецька', 'ВПУ № 92',
   'vpu92sever@ukr.net', 'Катерина КУДРЯ', true,
   'м. Сєвєродонецьк',
   'вул. Новікова, 6, м. Сєвєродонецьк, Луганська область, 93405',
   'проспект Лесі Українки, 44, м. Кременчук, Полтавська область, 39622',
   'Регіональний центр професійно-технічної освіти № 1 м. Кременчука',
   '/assets/img/institutions/logo-01.jpg'),

  ('vpu-94', 'vpu',
   'Вище професійне училище № 94', 'ВПУ № 94',
   'lvpy94@ukr.net', 'Максим БУНЕГІН', false,
   'м. Лисичанськ',
   'кв. Дружби Народів, 100, м. Лисичанськ, Луганська область, 93107',
   'вул. Інститутська, 10, м. Хмельницький, Хмельницька область, 29000',
   'Вище професійне училище № 4 м. Хмельницького',
   '/assets/img/institutions/logo-02.jpg'),

  ('svpu', 'vpu',
   'ДНЗ «Сєвєродонецьке вище професійне училище»', 'Сєвєродонецьке ВПУ',
   'sed_vpu@ukr.net', 'Юрій КУЗЬМІНОВ', false,
   'м. Сєвєродонецьк',
   'пр. Центральний, 17, м. Сєвєродонецьк, Луганська область, 93404',
   'пров. Універсальний, 7, м. Дніпро, Дніпропетровська область, 49024',
   'ДПТНЗ «Дніпровський професійний залізничний ліцей»',
   '/assets/img/institutions/logo-03.jpg'),

  ('spl', 'lyc',
   'ДНЗ «Сєвєродонецький професійний ліцей»', 'Сєвєродонецький ПЛ',
   'spl_53@ukr.net', 'Валентина ГРОШЕВА', false,
   'м. Сєвєродонецьк',
   'пр. Хіміків, 5, м. Сєвєродонецьк, Луганська область, 93404',
   'вул. Чуднівська, 102А, м. Житомир, Житомирська область, 10005',
   'ДНЗ «Центр легкої промисловості та побутового обслуговування населення м. Житомира»',
   '/assets/img/institutions/logo-04.jpg'),

  ('ppl', 'lyc',
   'ДПТНЗ «Привільський професійний ліцей»', 'Привільський ПЛ',
   'ppl55@ukr.net', 'Олексій ЖУКОВ', false,
   'м. Лисичанськ',
   'пр. Перемоги, 136, м. Лисичанськ, Луганська область, 93191',
   'вул. Подолінського, 20, м. Черкаси, Черкаська область, 18000',
   'ДНЗ «Черкаське вище професійне училище»',
   '/assets/img/institutions/logo-05.jpg'),

  ('zpl', 'lyc',
   'Золотівський професійний ліцей', 'Золотівський ПЛ',
   'zpl_83@ukr.net', 'Сергій ПІДГАЙКО', true,
   'м. Золоте-1',
   'вул. Молодіжна, 37, м. Золоте-1, Попаснянський р-н, Луганська область, 93295',
   'вул. Промислова, 11, м. Павлоград, Дніпропетровська область, 51413',
   'Західно-Донбаський професійний ліцей',
   '/assets/img/institutions/logo-06.png'),

  ('lptkl', 'lyc',
   'Лисичанський професійний торгово-кулінарний ліцей', 'Лисичанський ПТКЛ',
   'listorgkl@ukr.net', 'Наталія ШУМІЛКІНА', false,
   'м. Лисичанськ',
   'вул. Д.І. Менделєєва, 47, м. Лисичанськ, Луганська область, 93100',
   'вул. Героїв України, буд. 10, кв. 87, м. Кропивницький, Кіровоградська область, 25031',
   null,
   '/assets/img/institutions/logo-07.png'),

  ('rphtl', 'lyc',
   'Рубіжанський професійний хіміко-технологічний ліцей', 'Рубіжанський ПХТЛ',
   'rpxtl13@ukr.net', 'Вікторія ОРЛОВА', true,
   'м. Рубіжне',
   'вул. Чехова, 7, м. Рубіжне, Луганська область, 93001',
   'вул. Семенівська, 37, м. Бердичів, Житомирська область, 13306',
   'Професійно-технічне училище № 4 м. Бердичева',
   '/assets/img/institutions/logo-08.jpg'),

  ('rcpo', 'center',
   'ВП «Регіональний центр професійної освіти ДЗ «Луганський національний університет імені Тараса Шевченка»',
   'РЦПО ЛНУ ім. Т. Шевченка',
   'liceylny@ukr.net', 'Микола КУРИЛО', false,
   'м. Старобільськ',
   'пл. Гоголя, 1, м. Старобільськ, Луганська область, 92703',
   'вул. Івана Банка, 3, м. Полтава, Полтавська область, 36007',
   'Вищий навчальний заклад Укоопспілки «Полтавський університет економіки і торгівлі»',
   '/assets/img/institutions/logo-09.jpg')
on conflict (id) do nothing;

-- ═══════════════════════════════════════════════════════════════════════════
-- ПЕРЕВІРКА
-- ═══════════════════════════════════════════════════════════════════════════
-- select * from institutions order by "group", id;
-- select * from public_reports_agg;
