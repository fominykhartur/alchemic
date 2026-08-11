# Алхимия — игра смешивания элементов

Браузерная алхимическая песочница: комбинируй базовые стихии, открывай новые элементы, собирай рецепты и прокачивай статистику.

## Геймплей

- 5 базовых стихий: Огонь, Вода, Земля, Воздух, Пустота
- Перетащи элемент из инвентаря в котёл, нажми «Смешать» и получи новый элемент… или взрыв
- 342 элемента в 15 категориях: от простых состояний до магии, космоса, чувств и звука
- 432 рецепта, включая пропорциональные (например, 2 воды + 1 воздух = лёд)

## Особенности

- Drag-and-drop интерфейс (Pointer Events — работает мышью и тачем)
- 342 уникальных элемента в 15 категориях с иконками (глиф + форма + цвет)
- 432 рецепта с системой пропорций
- Поиск по инвентарю (по названию, с кнопкой очистки / Esc)
- Анимации: смешивание, взрыв, открытие нового элемента, частицы, тряска
- 63 достижения для коллекционирования
- Древо рецептов (кто из кого получается)
- Гримуар с системой подсказок (см. ниже)
- Детальная статистика (время, смешивания, взрывы, создано элементов)
- Автосохранение в localStorage
- Облачная синхронизация прогресса через Supabase (код в шапке — введи его на другом устройстве)
- Звуковые эффекты через Web Audio API
- Адаптивный дизайн (десктоп + мобильные)

## Подсказки (гримуар)

Три слоя помощи, раскрывающихся по мере прогресса:

- **Шёпоты** — загадочные намёки в Гримуаре, появляются после каждых N смешиваний (реже на старте, чаще по мере открытия). Уровни: ❓ обычный, 🔮 после открытия Зеркала, ✨ после открытия Хрономанта. Намёк указывает на достижимый рецепт: количество, категорию ингредиентов или число составляющих.
- **Древо легенд** — для каждого легендарного элемента показывается прогресс по его составляющим; при достаточном прогрессе открываются имена недостающих и цепочка «из чего их создать».
- **Жертвенный ритуал** — пожертвуй элементы (цена растёт с глубиной элемента) и раскрой один случайный рецепт для выбранной цели. Раскрытые рецепты видны в книге, но засчитываются только после реального крафта.

## Управление

| Действие | Результат |
|----------|-----------|
| Перетащить из инвентаря в круг (мышь / тач) | Добавить элемент в котёл |
| Двойной клик / двойной тап по элементу | Добавить 1 единицу в котёл |
| Клик / тап по элементу инвентаря | Информация об элементе и рецепты |
| Shift+клик / долгое нажатие | Выбор количества |
| Тап по элементу в котле | Вернуть 1 единицу |
| ПКМ / долгое нажатие по элементу в котле | Вернуть всё количество |
| Enter / кнопка «Смешать» | Запустить реакцию |
| Кнопка «Очистить» | Вернуть всё в инвентарь |
| Поле «🔍 Поиск» в инвентаре | Фильтр элементов по названию |
| Кнопка «✕» / Esc в поле поиска | Сбросить фильтр |

## Технологии

- **Чистый JavaScript** (ES Modules) — без фреймворков и библиотек
- **Canvas 2D** — отрисовка котла, элементов и анимаций
- **SVG + Canvas** — система иконок для элементов
- **CSS** — вся стилизация, сетки, модальные окна
- **localStorage** — сохранение прогресса
- **Supabase** — облачные сохранения (REST через `fetch`, без SDK)
- **Web Audio API** — генерация звуков (без аудиофайлов)

## Структура проекта

```
alchemic/
├── index.html           — разметка страницы
├── style.css            — стили (тёмная тема, сетка, модалки)
├── server.ps1           — скрипт локального сервера
├── .github/workflows/
│   └── deploy.yml       — деплой на GitHub Pages + генерация src/config.js из секретов
├── src/
│   ├── main.js          — точка входа, инициализация
│   ├── canvas.js        — Canvas 2D рендер котла и анимаций
│   ├── data.js          — элементы, рецепты, достижения, категории
│   ├── state.js         — состояние игры + save/load
│   ├── ui.js            — DOM-интерфейс (инвентарь, книга, логи)
│   ├── icons.js         — генерация иконок (SVG для DOM, Canvas для рендера)
│   ├── events.js        — обработчики (drag/drop, клики, клавиши)
│   ├── audio.js         — звуковые эффекты
│   ├── notebook.js      — гримуар, шёпоты, жертвоприношения
│   ├── sync.js          — облачная синхронизация (push/pull/merge)
│   ├── supabase.js      — REST-клиент Supabase (fetch)
│   └── config.js        — SUPABASE_URL и SUPABASE_ANON_KEY (плейсхолдеры)
└── .gitignore
```

## Облачная синхронизация (Supabase)

Прогресс сохраняется локально (localStorage) и, при наличии конфига, автоматически синхронизируется в Supabase. Доступ к сохранению защищён двумя значениями:

- **Код синхронизации** — «адрес» сохранения (короткий, показывается в шапке)
- **Ключ доступа** — секрет (генерируется в браузере, скрыт за маской; показывается/копируется по кнопкам 👁 / ⧉)

Чтобы перенести прогресс на другое устройство, вставь туда **оба** значения и нажми «Применить». Без ключа доступа чужое сохранение нельзя ни прочитать, ни перезаписать (проверка токена выполняется Postgres-функциями на сервере). При конфликте данные **объединяются** (множества — по объединению, счётчики — по максимуму, ничего не теряется).

### 1. Создать таблицу и функции в Supabase

В SQL-редакторе проекта (SQL Editor → New query):

```sql
-- старые облачные сохранения сбросить (строк без токена не должно остаться)
delete from saves;

create table if not exists saves (
  code text primary key,
  token text,
  data jsonb not null,
  updated_at timestamptz default now()
);

alter table saves enable row level security;

revoke all on saves from anon;

create or replace function get_save(p_code text, p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select data into v from saves where code = p_code and token = p_token;
  return v;
end $$;

create or replace function upsert_save(p_code text, p_token text, p_data jsonb)
returns text language plpgsql security definer set search_path = public as $$
declare v_status text;
begin
  if exists (select 1 from saves where code = p_code) then
    update saves set data = p_data, updated_at = now()
      where code = p_code and token = p_token;
    if found then v_status := 'updated'; else v_status := 'denied'; end if;
  else
    insert into saves(code, token, data, updated_at) values (p_code, p_token, p_data, now());
    v_status := 'created';
  end if;
  return v_status;
end $$;

create or replace function delete_save(p_code text, p_token text)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from saves where code = p_code and token = p_token;
  return found;
end $$;

grant execute on function get_save(text, text) to anon;
grant execute on function upsert_save(text, text, jsonb) to anon;
grant execute on function delete_save(text, text) to anon;
```

> Прямой доступ анонимов к таблице закрыт — только через функции, проверяющие токен. `delete from saves` обязателен: старые строки без токена не смог бы «забрать» даже владелец.

### 2. Добавить секреты в GitHub

Repo → **Settings → Secrets and variables → Actions** → новые секреты:
- `SUPABASE_URL` — например `https://banxtvjgjksshqvpetvh.supabase.co`
- `SUPABASE_ANON_KEY` — публичный anon key (Settings → API → anon public / `sb_publishable_...`). **Не** используй `service_role`.

### 3. Деплой

- Repo → **Settings → Pages → Source: GitHub Actions**
- Workflow `.github/workflows/deploy.yml` генерирует `src/config.js` из секретов и публикует на Pages при каждом `git push` в `master`.

> Локально без конфига (`src/config.js` пуст) облако отключено — игра работает как раньше, только localStorage. Управление облаком в шапке: «Применить» — сохранить код+ключ и синхронизировать, «⧉» — скопировать ключ доступа, «👁» — показать/скрыть ключ, «🗑» — удалить облачное сохранение.

## Установка и запуск

```bash
# Любой HTTP-сервер (обязательно — ES Modules требуют сервера)
python -m http.server 8000

# Или
npx serve alchemic -l 3000

# Открой http://localhost:8000
```
