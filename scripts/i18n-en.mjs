// Русский → английский: всё, что видно на странице.
//
// Словарь применяется на этапе сборки, поэтому Main.dc.html остаётся
// русским и по-прежнему открывается и правится в Claude Design.
// Подстановка идёт по ТОЧНОМУ совпадению целой строки — текстового узла,
// значения атрибута или содержимого строкового литерала в скрипте.
// Частичных замен нет специально: подстрока «ЯЗЫКОВ» внутри «ЯЗЫКОВ В РАБОТЕ»
// иначе превратила бы его в мешанину.
//
// Любая русская строка без пары роняет сборку и печатается списком —
// см. checkTranslated() в build-site.mjs. Недопереведённая версия
// физически не попадёт в main.

export const EN = {
  // --- навигация и первый экран ---------------------------------
  'РАБОТЫ': 'WORK',
  'ОБО МНЕ': 'ABOUT',
  'КОНТАКТЫ': 'CONTACT',
  'ОТКРЫТ ДЛЯ ПРОЕКТОВ': 'OPEN TO WORK',
  'ПРИВЕТ, Я': "HI, I'M",
  'Full-stack разработчик. Открывайте файлы на столе — внутри каждый проект.':
    'Full-stack developer. Open the files on the desktop — each one is a project.',
  'СМОТРЕТЬ РАБОТЫ': 'VIEW WORK',
  'НАПИСАТЬ МНЕ': 'GET IN TOUCH',
  'ПРОЕКТОВ': 'PROJECTS',
  'ЯЗЫКОВ': 'LANGUAGES',
  'СТАТУС': 'STATUS',
  'ДОСТУПЕН': 'AVAILABLE',
  'ОТКРЫТ ДЛЯ ПРОЕКТОВ · ОТВЕЧАЮ В ТЕЧЕНИЕ ДНЯ': 'OPEN TO WORK · I REPLY WITHIN A DAY',

  // --- рабочий стол и окна --------------------------------------
  'ОТКРОЙТЕ ФАЙЛ — ОКНО ПОЯВИТСЯ ЗДЕСЬ': 'OPEN A FILE — ITS WINDOW APPEARS HERE',
  'ЗАКРЫТЬ ВСЁ': 'CLOSE ALL',
  'ПРОКРУТИТЕ, ЧТОБЫ УВИДЕТЬ БОЛЬШЕ': 'SCROLL FOR MORE',
  'НА РАБОЧИЙ СТОЛ': 'BACK TO DESKTOP',
  'ЛИЧНЫЙ ФАЙЛ': 'PERSONAL FILE',
  '<div class="pbar"><i></i><i></i><i></i><b>ПРЕДПРОСМОТР</b></div>':
    '<div class="pbar"><i></i><i></i><i></i><b>PREVIEW</b></div>',
  '<div class="pl"><span>ОТКРЫТЬ ОКНО</span><span>КЛИК</span></div>':
    '<div class="pl"><span>OPEN WINDOW</span><span>CLICK</span></div>',
  'Свернуть': 'Minimise',
  'Закрыть': 'Close',
  'Предыдущий': 'Previous',
  'Следующий': 'Next',
  'ОТКРЫВАЮ…': 'OPENING…',
  'ОТКРЫВАЮ ПОЧТУ…': 'OPENING MAIL…',
  'ССЫЛКА ПОЯВИТСЯ ПОЗЖЕ': 'LINK COMING SOON',

  // --- карточка проекта -----------------------------------------
  'ЗАДАЧА': 'PROBLEM',
  'РЕШЕНИЕ': 'SOLUTION',
  'РЕЗУЛЬТАТ': 'OUTCOME',
  'ПОДРОБНЕЕ О ПРОЕКТЕ': 'MORE ABOUT THIS PROJECT',
  'ИНДЕКС ПРОЕКТОВ': 'PROJECT INDEX',
  'РОЛЬ': 'ROLE',
  'ГОД': 'YEAR',
  'ТЕХНОЛОГИИ': 'TECH',
  'ОТКРЫТЬ ДЕМО': 'OPEN DEMO',
  'СКАЧАТЬ ZIP': 'DOWNLOAD ZIP',

  // --- «Обо мне» -------------------------------------------------
  'Начинал с вёрстки, вырос до продуктовой разработки полного цикла — от схемы базы данных до анимации в интерфейсе. Люблю задачи, где нужно разобрать сложное на части, понять, как оно устроено, и собрать заново — но лучше.':
    'I started in markup and grew into full-cycle product development — from the database schema to the animation in the interface. I like problems that have to be taken apart, understood, and put back together better than they were.',
  'ПУТЬ': 'PATH',
  '2023 — СЕЙЧАС': '2023 — PRESENT',
  'Продуктовая разработка': 'Product development',
  'Веду проекты целиком: архитектура, бэкенд, интерфейс, релизы.':
    'I run projects end to end: architecture, backend, interface, releases.',
  'Full-stack в продуктовой команде': 'Full-stack in a product team',
  'Внутренние инструменты, панели аналитики, интеграции с внешними сервисами.':
    'Internal tools, analytics dashboards, integrations with third-party services.',
  'Фронтенд-разработчик': 'Frontend developer',
  'Интерфейсы, анимации, дизайн-система на компонентах.':
    'Interfaces, animation, a component-based design system.',
  'Первые коммерческие проекты': 'First commercial work',
  'Вёрстка и небольшие сайты на заказ.': 'Markup and small sites to order.',
  'СТЕК': 'STACK',
  'ОТКРЫТ ДЛЯ НОВЫХ ПРОЕКТОВ': 'OPEN TO NEW PROJECTS',
  'ПУБЛИЧНЫХ ПРОЕКТОВ': 'PUBLIC PROJECTS',
  'ЯЗЫКОВ В РАБОТЕ': 'LANGUAGES IN USE',
  'ПЛАТФОРМ': 'PLATFORMS',
  'СРЕДНИЙ ОТВЕТ': 'AVERAGE REPLY',
  '&lt; 1 дня': '&lt; 1 day',

  // --- контакты --------------------------------------------------
  'ДАВАЙТЕ СОБЕРЁМ': "LET'S BUILD",
  'ВАШ ПРОЕКТ': 'YOUR PROJECT',
  'ДАВАЙТЕ СОБЕРЁМ ВАШ ПРОЕКТ': "LET'S BUILD YOUR PROJECT",
  'РАССКАЖИТЕ': 'TELL ME ABOUT',
  'О ЗАДАЧЕ': 'YOUR PROJECT',
  'РАССКАЖИТЕ О ЗАДАЧЕ': 'TELL ME ABOUT YOUR PROJECT',
  'Расскажите, что нужно построить — отвечу в течение дня и предложу, как это лучше сделать.':
    'Tell me what needs building — I reply within a day and will suggest how best to do it.',
  'ГОРОД': 'CITY',
  'ФОРМАТ РАБОТЫ': 'WORK FORMAT',
  'ЧАСОВОЙ ПОЯС': 'TIME ZONE',
  'ОТВЕЧАЮ': 'REPLY TIME',
  'ЯЗЫКИ': 'LANGUAGES',
  'СТАРТ': 'AVAILABLE FROM',
  'ФОРМАТ': 'FORMAT',
  'СКАЧАТЬ РЕЗЮМЕ · PDF': 'DOWNLOAD CV · PDF',
  'КАК РАБОТАЮ': 'HOW I WORK',
  'Разбираемся в задаче': 'Understanding the problem',
  'Созвон на полчаса: что нужно, для кого и в какие сроки.':
    'A half-hour call: what is needed, who for, and by when.',
  'Оценка и план': 'Estimate and plan',
  'Разбиваю на этапы, называю сроки и стоимость до старта.':
    'I break it into stages and name the timeline and cost before we start.',
  'Разработка': 'Development',
  'Демо каждую неделю, доступ к репозиторию с первого дня.':
    'A demo every week, and access to the repository from day one.',
  'Запуск и поддержка': 'Launch and support',
  'Релиз, метрики, поддержка после сдачи.': 'Release, metrics, support after handover.',
  'Девять проектов: продуктовые приложения, внутренние инструменты и библиотеки. На главной они же лежат файлами на рабочем столе — каждый открывается в своём окне.':
    'Nine projects: product applications, internal tools and libraries. On the home page the same ones sit as files on the desktop — each opens in its own window.',
  'ДЕТАЛИ': 'DETAILS',

  // значения CONTACTS
  'Бухарест, Румыния': 'Bucharest, Romania',
  'Удалённо': 'Remote',
  'В течение дня': 'Within a day',
  'В течение недели': 'Within a week',
  'Русский · English': 'Russian · English',

  // --- манифест и подвал ------------------------------------------
  'МАНИФЕСТ': 'MANIFESTO',
  'Хорошая инженерия': 'Good engineering is',
  'незаметна': 'invisible',
  '. Её видно только тогда, когда всё работает так, будто иначе и быть не могло.':
    '. You only notice it when everything works as though it could not have been any other way.',

  // --- терминал ----------------------------------------------------
  'Терминал': 'Terminal',
  'Команда': 'Command',
  '<b>alex.dev</b> — терминал портфолио. Наберите <b>help</b>.':
    '<b>alex.dev</b> — portfolio terminal. Type <b>help</b>.',
  '<b>Команды:</b>': '<b>Commands:</b>',
  'ls &nbsp;— список файлов на столе': 'ls &nbsp;— list the files on the desktop',
  'open &lt;id&gt; &nbsp;— открыть файл, например <b>open p3</b>':
    'open &lt;id&gt; &nbsp;— open a file, for example <b>open p3</b>',
  'about / contact / works &nbsp;— открыть раздел':
    'about / contact / works &nbsp;— open a section',
  'skills &nbsp;— стек и уровни': 'skills &nbsp;— stack and levels',
  'нужен id, например <b>open p3</b>': 'an id is required, for example <b>open p3</b>',
  'файл ': 'file ',
  ' не найден': ' not found',
  'открываю ': 'opening ',
  'открываю раздел «Обо мне»': 'opening the About section',
  'открываю раздел «Контакты»': 'opening the Contact section',
  'открываю раздел «Работы»': 'opening the Work section',
  'раздел «обо мне» не найден': 'the about section was not found',
  'alex — full-stack разработчик, открыт для проектов':
    'alex — full-stack developer, open to work',
  'неизвестная команда: ': 'unknown command: ',
  ' — попробуйте <b>help</b>': ' — try <b>help</b>',
  '<button type="button" class="lb-close" aria-label="Закрыть">':
    '<button type="button" class="lb-close" aria-label="Close">',
  '<button type="button" class="lb-nav lb-prev" aria-label="Предыдущий">':
    '<button type="button" class="lb-nav lb-prev" aria-label="Previous">',
  '<button type="button" class="lb-nav lb-next" aria-label="Следующий">':
    '<button type="button" class="lb-nav lb-next" aria-label="Next">',

  // --- 3D-сцена: названия фигур и режимов ---------------------------
  'СФЕРА': 'SPHERE',
  'СПИРАЛЬ': 'SPIRAL',
  'РЕШЁТКА': 'LATTICE',
  'КОЛЬЦО': 'RING',
  'КУБ': 'CUBE',
  'ЧАСТИЦЫ': 'PARTICLES',
  'РАСПАД': 'DISPERSE',
  'ЦЕЛАЯ': 'SOLID',

  // --- месяцы ------------------------------------------------------
  'ЯНВ': 'JAN', 'ФЕВ': 'FEB', 'МАР': 'MAR', 'АПР': 'APR',
  'МАЯ': 'MAY', 'ИЮН': 'JUN', 'ИЮЛ': 'JUL', 'АВГ': 'AUG',
  'СЕН': 'SEP', 'ОКТ': 'OCT', 'НОЯ': 'NOV', 'ДЕК': 'DEC',

  // --- доступность -------------------------------------------------
  'К содержимому': 'Skip to content',

  // --- рубрики проектов --------------------------------------------
  'ЛИЧНЫЙ СОФТ': 'PERSONAL SOFTWARE',
  'ФИНАНСЫ': 'FINANCE',
  'ИНСТРУМЕНТ РАЗРАБОТЧИКА': 'DEVELOPER TOOL',
  'ДЕСКТОП И МОБИЛЬНОЕ': 'DESKTOP & MOBILE',
  'СИСТЕМНЫЙ ИНСТРУМЕНТ': 'SYSTEM TOOL',
  'ВЕБ-ПРИЛОЖЕНИЕ': 'WEB APP',
  'БОТ И ИНФРАСТРУКТУРА': 'BOT & INFRASTRUCTURE',

  // --- названия проектов -------------------------------------------
  'Финансовый помощник': 'Finance Assistant',
  'Выгодные предложения': 'Best Deals',

  // --- Life OS ------------------------------------------------------
  'Документы, вещи и обязательства расползаются по папкам и заметкам, а сроки всплывают в последний момент.':
    'Documents, belongings and commitments scatter across folders and notes, and deadlines surface at the last moment.',
  'Личная «операционная система для жизни»: единый реестр с напоминаниями и подсказками следующих шагов. Данные физически некуда отправить — сервера и аккаунта нет, единственный выход в сеть это проверка обновления.':
    'A personal "operating system for life": one registry with reminders and next-step prompts. There is physically nowhere to send the data — no server, no account; the only network call is the update check.',
  'Релиз 1.1: пять модулей, установщики для Windows и Android с автообновлением.':
    'Release 1.1: five modules, installers for Windows and Android with auto-update.',
  'модулей в релизе 1.1': 'modules in release 1.1',

  // --- Финансовый помощник ------------------------------------------
  'Личные финансы и портфель живут в таблицах, а данные о деньгах не хочется отдавать в облако.':
    'Personal finances and a portfolio live in spreadsheets, and money data is not something you want to hand to the cloud.',
  'Учёт, планирование и анализ портфеля одним бандлом на Next.js: одна сборка фронтенда обслуживает Windows и Android, серверной части нет вовсе.':
    'Tracking, planning and portfolio analysis in a single Next.js bundle: one frontend build serves both Windows and Android, and there is no server side at all.',
  'Версия 1.20, отчёты печатаются в PDF собственной вёрсткой, релизы собираются в CI.':
    'Version 1.20, reports print to PDF through a custom layout, releases are built in CI.',
  'теста в CI: 557 unit и 135 e2e': 'tests in CI: 557 unit and 135 e2e',

  // --- Dev Memory Center ---------------------------------------------
  'Решения, команды и находки по инфраструктуре теряются между заметками, чатами и историей терминала.':
    'Infrastructure decisions, commands and findings get lost between notes, chats and shell history.',
  'Локальная память разработчика и системного администратора: десктоп на Rust и Tauri, интерфейс на React, хранилище SQLite. Данные не покидают машину.':
    'A local memory for developers and sysadmins: a Rust and Tauri desktop app, a React interface, SQLite storage. The data never leaves the machine.',
  'Единая база знаний под рукой, одна сборка на Windows и Linux.':
    'One knowledge base at hand, a single build for Windows and Linux.',
  'платформы: Windows и Linux': 'platforms: Windows and Linux',

  // --- EatBefore -------------------------------------------------------
  'Продукты дома портятся незамеченными, а состав запасов держится в голове.':
    'Food at home spoils unnoticed, and the contents of the pantry live in your head.',
  'Приложение на Kotlin и Compose: сканер штрихкодов, QR и DataMatrix включая «Честный знак», распознавание сроков годности, напоминания, список покупок и аналитика.':
    'A Kotlin and Compose app: a scanner for barcodes, QR and DataMatrix including Russia\'s Chestny Znak codes, expiry-date recognition, reminders, a shopping list and analytics.',
  'Версия 1.11 в релизах, ближний горизонт по срокам на главном экране, всё работает офлайн.':
    'Version 1.11 shipped, the nearest expiry dates on the home screen, everything works offline.',
  'релиз в GitHub Releases': 'release on GitHub Releases',

  // --- Impressions ------------------------------------------------------
  'Впечатления — фильмы, книги, места — разбросаны по спискам, и вернуться к ним потом невозможно.':
    'Impressions — films, books, places — end up scattered across lists, and there is no way back to them later.',
  'Локальная медиатека на Flutter: дерево категорий с перетаскиванием, теги, архив, рекомендации и итоги года. Хранилище Drift, обмен подписанным файлом профиля.':
    'A local media library in Flutter: a drag-and-drop category tree, tags, an archive, recommendations and a year in review. Drift storage, sharing through a signed profile file.',
  'Версия 1.20 на Windows и Android, без сервера и облака — данные остаются у владельца.':
    'Version 1.20 on Windows and Android, with no server and no cloud — the data stays with its owner.',
  'платформы: Windows и Android': 'platforms: Windows and Android',

  // --- System Hub --------------------------------------------------------
  'Службы, контейнеры, процессы и логи на Windows и Linux управляются разными утилитами и командами.':
    'Services, containers, processes and logs on Windows and Linux are each managed by different tools and commands.',
  'Десктопный пульт на Go и Fyne: один интерфейс поверх systemd и journalctl на Linux и поверх Service Control Manager и Event Log на Windows, плюс дашборд CPU, памяти и дисков.':
    'A desktop console in Go and Fyne: one interface over systemd and journalctl on Linux and over Service Control Manager and Event Log on Windows, plus a CPU, memory and disk dashboard.',
  'Одна программа вместо набора консольных инструментов, интерфейс на русском и английском.':
    'One program instead of a handful of console tools, with an interface in Russian and English.',
  'ОС под одним интерфейсом': 'operating systems under one interface',

  // --- Appsparcer ---------------------------------------------------------
  'Сравнивать цены на маркетплейсах вручную долго, а витрины показывают не самые выгодные варианты.':
    'Comparing marketplace prices by hand is slow, and the storefronts do not surface the best offers.',
  'Веб-приложение: React и TypeScript на фронте, FastAPI, SQLAlchemy и PostgreSQL на бэке, фоновые задачи на Celery и Redis. Адаптеры маркетплейсов приведены к общей модели предложения.':
    'A web app: React and TypeScript on the front, FastAPI, SQLAlchemy and PostgreSQL on the back, background jobs on Celery and Redis. Marketplace adapters are normalised to a shared offer model.',
  'Поиск идёт по реальным данным Ozon и Wildberries, для тестов есть детерминированный mock-режим.':
    'Search runs against live Ozon and Wildberries data, with a deterministic mock mode for tests.',
  'маркетплейса в едином API': 'marketplaces behind one API',

  // --- Выгодные предложения -------------------------------------------------
  'Выгодность товара не видна из карточки: цена, рейтинг и отзывы разбросаны по разным местам.':
    'Whether an item is a good deal is not visible from its page: price, rating and reviews are scattered.',
  'Приложение считает scoring предложения по фильтрам пользователя и объясняет, почему товар выгоден. Wildberries берётся через открытый JSON-каталог, Ozon — через Playwright по публичной странице поиска.':
    'The app scores an offer against the user\'s filters and explains why the item is a good deal. Wildberries comes from the open JSON catalogue, Ozon through Playwright over the public search page.',
  'Топ вариантов с обоснованием; парсинг вежливый — кеширование, лимиты запросов, мягкая деградация.':
    'A ranked shortlist with reasons; the scraping is polite — caching, request limits, graceful degradation.',
  'маркетплейса: Ozon и Wildberries': 'marketplaces: Ozon and Wildberries',

  // --- Telegram Job Bot -------------------------------------------------------
  'Просматривать пять job-сайтов каждый день ради нескольких подходящих вакансий — трата времени.':
    'Checking five job boards every day for a handful of suitable openings is a waste of time.',
  'Бот на Python: раз в час опрашивает сайты по ключевым словам, проверяет каждую вакансию по фильтрам и присылает карточкой в Telegram. Фильтры настраиваются кнопками в чате или в веб-панели.':
    'A Python bot: it polls the boards hourly by keyword, checks each opening against the filters and sends it to Telegram as a card. Filters are configured with chat buttons or in a web panel.',
  'Подходящие вакансии приходят сами, разворачивается в Docker Compose на VPS.':
    'Matching openings arrive on their own; it deploys with Docker Compose on a VPS.',
  'job-сайтов в опросе': 'job boards polled',

  // --- редактор Claude Design (в разметку страницы не попадает) ----------
  'Тема': 'Theme',
  'Сцена': 'Scene',
};

// Строки, которые собираются из данных, поэтому в словарь как есть не лягут:
// «Life OS — скриншот 1» и ещё двадцать шесть таких же. Правила привязаны
// к началу и концу строки — частичных замен по-прежнему нет.
export const PATTERNS = [
  [/^(.+) — скриншот интерфейса$/, '$1 — interface screenshot'],
  [/^(.+) — скриншот (\d+)$/, '$1 — screenshot $2'],
];

// Тексты, которые сборка подставляет сама (мета, переключатель языка).
export const PAGE_EN = {
  title: 'Alex — full-stack developer',
  desc: 'Portfolio of a full-stack developer: nine projects in TypeScript, Kotlin, Dart, Rust, Go and Python.',
  ogLocale: 'en_US',
  ogImageAlt: 'A screen from the finance assistant — one of the projects in the portfolio',
  jobTitle: 'Full-stack developer',
  switchLabel: 'RU',
  switchTitle: 'Открыть версию на русском',
};
