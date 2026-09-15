// Смоук-тесты собранного сайта в настоящем браузере.
//
// Каждая проверка здесь появилась из реального дефекта — так что этот файл
// заодно служит списком того, что уже ломалось и не должно сломаться снова.
//
// Запуск:  npm test        (перед этим нужен npm run build)
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DIST = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
// Страница ничего не запрашивает по сети — картинки лежат рядом относительными
// путями, — поэтому сервер не нужен, хватает file://.
const url = pathToFileURL(join(DIST, 'index.html')).href;

let failed = 0;
const results = [];
function check(name, pass, detail = '') {
  results.push(`  ${pass ? '✓' : '✗'} ${name}${detail ? '  — ' + detail : ''}`);
  if (!pass) failed++;
}
function group(name) { results.push('\n' + name); }

const browser = await chromium.launch();
const pageErrors = [];

async function open(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => pageErrors.push(String(e.message)));
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('fonts.')) pageErrors.push(`${r.status()} ${r.url()}`);
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(2800);
  await settle(page);
  return { ctx, page };
}

// Иконки прилетают на стол с задержкой до ~1,1 с плюс переход 1,25 с. Ждём,
// пока раскладка перестанет меняться, а не фиксированный таймаут: на медленном
// раннере фиксированный не хватает и тест мигает.
async function settle(page, tries = 20) {
  let prev = '';
  for (let i = 0; i < tries; i++) {
    const now = await page.evaluate(() =>
      [...document.querySelectorAll('.dt-icon')]
        .map((e) => Math.round(e.getBoundingClientRect().left)).join(','));
    if (now === prev) return;
    prev = now;
    await page.waitForTimeout(250);
  }
}

// --- вес страницы -------------------------------------------------
// Скриншоты когда-то лежали в HTML по 2-4 копии каждый: 1,4 МБ одним куском.
{
  group('Вес');
  const html = await readFile(join(DIST, 'index.html'), 'utf8');
  check('index.html меньше 400 КБ', html.length < 400 * 1024,
    Math.round(html.length / 1024) + ' КБ');
  check('в разметке не осталось base64', !html.includes('data:image/jpeg;base64'));
}

// --- мета для поисковиков -----------------------------------------
{
  group('Мета');
  const html = await readFile(join(DIST, 'index.html'), 'utf8');

  // getElementById молча возвращает первый из двух — сборка однажды
  // заворачивала разметку во второй #dc-root поверх уже существующего.
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  check('id в собранной странице не повторяются', new Set(ids).size === ids.length,
    ids.filter((x, i) => ids.indexOf(x) !== i).join(', ') || ids.length + ' шт.');

  const ld = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  check('JSON-LD присутствует и разбирается', !!ld && (() => {
    try { return JSON.parse(ld[1])['@type'] === 'Person'; } catch { return false; }
  })());
  check('в JSON-LD те же контакты, что на странице', !!ld && (() => {
    const p = JSON.parse(ld[1]);
    // адрес, а не mailto:, и без пустых полей-заглушек
    return !/^mailto:/.test(p.email || '')
      && Object.values(p).every((v) => v !== '' && v !== null);
  })());

  const robots = await readFile(join(DIST, 'robots.txt'), 'utf8');
  check('robots.txt указывает на карту сайта', /^Sitemap: https?:\/\/\S+sitemap\.xml$/m.test(robots));
  const sitemap = await readFile(join(DIST, 'sitemap.xml'), 'utf8');
  check('sitemap.xml ссылается на сам сайт', /<loc>https?:\/\/\S+<\/loc>/.test(sitemap)
    && /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap));
}

// --- десктоп ------------------------------------------------------
{
  group('Рабочий стол 1440×900');
  const { ctx, page } = await open();

  const icons = await page.evaluate(() =>
    [...document.querySelectorAll('.dt-icon')].map((e) => {
      const r = e.getBoundingClientRect();
      return [Math.round(r.left), Math.round(r.top)];
    }));
  // Координаты сходятся с точностью до субпикселя, поэтому группируем.
  const cols = [];
  icons.map((p) => p[0]).sort((a, b) => a - b).forEach((x) => {
    const last = cols[cols.length - 1];
    if (last && x - last.x <= 8) last.n++; else cols.push({ x, n: 1 });
  });
  check('десять иконок в двух колонках по краям',
    icons.length === 10 && cols.length === 2 && cols[0].n === 5 && cols[1].n === 5
      && cols[0].x < 60 && cols[1].x > 1000,
    `колонки x≈${cols.map((c) => c.x + '×' + c.n).join(', ')}`);

  // Превью проектов без скриншота брали общий seed и выходили одинаковыми.
  await page.click('.nav-links button[data-page="work"]');
  await page.waitForTimeout(1500);
  const thumbs = await page.evaluate(() => {
    const noShot = [...document.querySelectorAll('.pg-card')]
      .filter((c) => { const i = c.querySelector('img.ov'); return !(i && i.getAttribute('src')); })
      .map((c) => c.querySelector('canvas[data-thumb]').toDataURL().slice(0, 160));
    return {
      cards: document.querySelectorAll('.pg-card').length,
      shots: [...document.querySelectorAll('.pg-card img.ov')].filter((i) => i.naturalWidth > 0).length,
      identical: noShot.length > 1 && noShot.every((x) => x === noShot[0]),
    };
  });
  check('девять карточек проектов', thumbs.cards === 9, String(thumbs.cards));
  check('скриншоты загружаются', thumbs.shots > 0, thumbs.shots + ' шт.');
  check('генеративные превью не одинаковые', !thumbs.identical);

  // Кнопки проекта уезжали под нижний край без всякого намёка.
  await page.click('.pg-card[data-item="p4"]');
  await page.waitForTimeout(1000);
  check('кнопки проекта видны без прокрутки', await page.evaluate(() => {
    const l = document.querySelector('.pg-item.on .di-links').getBoundingClientRect();
    return l.top >= 0 && l.bottom <= innerHeight + 1;
  }));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(700);

  // Свернуть было некуда: разметки панели задач не существовало.
  await page.click('.dt-icon[data-open="p1"]');
  await page.waitForTimeout(900);
  check('окно попадает в панель задач',
    await page.evaluate(() => document.querySelectorAll('.tb-btn').length === 1));
  await page.click('[data-win="p1"] .win-min');
  await page.waitForTimeout(900);
  check('свёрнутое окно помечено в панели', await page.evaluate(() => {
    const b = document.querySelector('.tb-btn.min');
    return !!b && b.getBoundingClientRect().width > 0
      && !document.querySelector('[data-win="p1"]').classList.contains('on');
  }));
  await page.click('.tb-btn.min');
  await page.waitForTimeout(900);
  check('окно разворачивается обратно',
    await page.evaluate(() => document.querySelector('[data-win="p1"]').classList.contains('on')));

  // Закрывающий </button> вместо </a> уносил подвал внутрь ссылки-пилюли.
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
  await page.waitForTimeout(1200);
  check('в подвале нет посторонних кнопок-пилюль',
    await page.evaluate(() => document.querySelectorAll('footer a.pill').length === 0));
  await ctx.close();
}

// --- доступность --------------------------------------------------
{
  group('Доступность');
  const { ctx, page } = await open();

  // Landmark-а <main> не было вовсе, а подвал лежал внутри .layer.
  const marks = await page.evaluate(() => ({
    mains: document.querySelectorAll('main').length,
    footerOutside: !document.querySelector('main footer') && !!document.querySelector('footer'),
    headerInside: !!document.querySelector('main > header.desktop'),
  }));
  check('ровно один <main>', marks.mains === 1, marks.mains + ' шт.');
  check('подвал остался отдельным landmark-ом', marks.footerOutside);
  check('рабочий стол внутри <main>', marks.headerInside);

  // До контента клавиатурой шли три кнопки навигации и десять иконок стола.
  await page.keyboard.press('Tab');
  await page.waitForTimeout(400);
  check('первый Tab ведёт на скип-ссылку', await page.evaluate(() => {
    const a = document.activeElement;
    return a.classList.contains('skip') && a.getAttribute('href') === '#main';
  }));
  check('скип-ссылка при фокусе видна и сверху', await page.evaluate(() => {
    const a = document.querySelector('.skip');
    const r = a.getBoundingClientRect();
    if (r.top < 0 || r.top > 80 || r.width < 40) return false;
    return document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === a;
  }));

  // 47 декоративных холстов озвучивались скринридером как пустые элементы.
  check('декоративные canvas скрыты от скринридера', await page.evaluate(() =>
    [...document.querySelectorAll('canvas')].every((c) => c.closest('[aria-hidden="true"]'))),
    await page.evaluate(() => document.querySelectorAll('canvas').length + ' шт. всего'));

  // Вывод терминала появлялся молча.
  check('вывод терминала озвучивается',
    await page.evaluate(() => document.getElementById('term-log').getAttribute('aria-live') === 'polite'));

  // <br> не даёт словораздела: заголовки читались как «ALEXFULL-STACK».
  check('в заголовках нет слипшихся слов', await page.evaluate(() =>
    [...document.querySelectorAll('h2')].every((h) => !/[а-яёa-z][А-ЯЁA-Z]/.test(h.textContent.replace(/\s+/g, ' ')))),
    await page.evaluate(() => [...document.querySelectorAll('h2')]
      .map((h) => h.textContent.replace(/\s+/g, ' ').trim()).filter((t) => /[а-яёa-z][А-ЯЁA-Z]/.test(t)).join(' / ') || 'все с пробелами'));

  // Два заголовка читались одинаково и были неразличимы в списке заголовков.
  check('заголовки не повторяют друг друга', await page.evaluate(() => {
    const t = [...document.querySelectorAll('h2')].map((h) => h.textContent.replace(/\s+/g, ' ').trim());
    return new Set(t).size === t.length;
  }));

  // Закрытое окно роняло фокус на <body>, и Tab начинал обход заново.
  await page.click('.dt-icon[data-open="p1"]');
  await page.waitForTimeout(900);
  await page.click('[data-win="p1"] .win-min');
  await page.waitForTimeout(900);
  check('свёрнутое окно уводит фокус на кнопку панели',
    await page.evaluate(() => document.activeElement.classList.contains('tb-btn')));
  await page.click('.tb-btn.min');
  await page.waitForTimeout(900);
  await page.click('[data-win="p1"] .win-x');
  await page.waitForTimeout(900);
  check('закрытое окно возвращает фокус на иконку',
    await page.evaluate(() => document.activeElement.getAttribute('data-open') === 'p1'));

  // А если фокус был не в окне — угонять его нельзя.
  await page.click('.dt-icon[data-open="p2"]');
  await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector('.nav-links button').focus());
  await page.evaluate(() => document.querySelector('[data-win="p2"] .win-x').click());
  await page.waitForTimeout(700);
  check('закрытие чужого окна не угоняет фокус',
    await page.evaluate(() => document.activeElement.dataset.page === 'work'));

  // Карточка проекта — настоящая модалка: Tab не должен из неё выходить.
  await page.click('.nav-links button[data-page="work"]');
  await page.waitForTimeout(1400);
  await page.click('.pg-card[data-item="p4"]');
  await page.waitForTimeout(1000);
  check('фокус не выходит за пределы карточки проекта', await page.evaluate(() => {
    const box = document.querySelector('.pg-item.on');
    const f = box.querySelectorAll('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])');
    if (!f.length) return false;
    f[f.length - 1].focus();
    const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    window.dispatchEvent(ev);
    return ev.defaultPrevented && box.contains(document.activeElement);
  }));
  await ctx.close();
}

// --- терминал -----------------------------------------------------
{
  group('Терминал');
  const { ctx, page } = await open();
  await page.click('.dt-icon[data-open="term"]');
  await page.waitForTimeout(800);
  await page.fill('#term-input', 'open <img src=x onerror=alert(1)>');
  await page.press('#term-input', 'Enter');
  await page.waitForTimeout(400);
  check('ввод экранируется, а не исполняется',
    await page.evaluate(() => document.querySelectorAll('#term-log img, #term-log script').length === 0));

  // Команда skills когда-то знала свой собственный стек, отличный от раздела.
  await page.fill('#term-input', 'skills');
  await page.press('#term-input', 'Enter');
  await page.waitForTimeout(400);
  check('стек совпадает с разделом «Обо мне»', await page.evaluate(() => {
    // Область та же, что у самой команды: .skill-row переиспользован
    // и на странице контактов, там уровней нет.
    const inPage = [...document.querySelectorAll('.page[data-page="about"] .skill-row')]
      .map((r) => r.querySelector('span').textContent.trim() + ' — ' + r.querySelectorAll('.lvl i.on').length + '/5');
    const inTerm = [...document.querySelectorAll('#term-log div')]
      .map((d) => d.textContent.trim()).filter((t) => /— \d\/5$/.test(t));
    return inPage.length > 0 && inPage.every((s) => inTerm.includes(s));
  }));
  await ctx.close();
}

// --- телефон ------------------------------------------------------
{
  group('Телефон 390×844');
  const { ctx, page } = await open({ viewport: { width: 390, height: 844 } });
  // Иконки прилетали из translate(±88vw) и оставляли горизонтальную прокрутку.
  check('нет горизонтальной прокрутки',
    await page.evaluate(() => document.body.scrollWidth === innerWidth),
    await page.evaluate(() => `scrollWidth=${document.body.scrollWidth}, innerWidth=${innerWidth}`));
  check('качание иконок отключено',
    await page.evaluate(() => getComputedStyle(document.querySelector('.dt-icon .ic')).animationName === 'none'));
  // Иконки лежали в двух контейнерах по пять и давали дырку в сетке.
  check('иконки в ровной сетке 2×5', await page.evaluate(() => {
    const rows = {};
    document.querySelectorAll('.dt-icon').forEach((e) => {
      const y = Math.round(e.getBoundingClientRect().top / 5) * 5;
      rows[y] = (rows[y] || 0) + 1;
    });
    const counts = Object.values(rows);
    return counts.length === 5 && counts.every((c) => c === 2);
  }));
  await ctx.close();
}

// --- английская версия --------------------------------------------
{
  group('Английская версия');
  const enUrl = pathToFileURL(join(DIST, 'en', 'index.html')).href;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const enErrors = [];
  page.on('pageerror', (e) => enErrors.push(String(e.message)));
  await page.goto(enUrl, { waitUntil: 'load' });
  await page.waitForTimeout(2800);
  await settle(page);

  // Перевод кладётся обратно в строковый литерал той же кавычки: из-за
  // апострофа в «HI, I'M» страница один раз упала с SyntaxError.
  check('страница работает без ошибок скрипта', enErrors.length === 0, enErrors[0] || '');

  const head = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    title: document.title,
    hreflang: [...document.querySelectorAll('link[hreflang]')].map((l) => l.hreflang).sort().join(','),
    canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') || '',
    ldLang: (() => {
      const el = document.querySelector('script[type="application/ld+json"]');
      try { return JSON.parse(el.textContent).jobTitle; } catch { return null; }
    })(),
  }));
  check('<html lang="en">', head.lang === 'en', head.lang);
  check('заголовок и описание английские', /full-stack developer/i.test(head.title), head.title);
  check('hreflang в обе стороны и x-default', head.hreflang === 'en,ru,x-default', head.hreflang);
  check('canonical указывает на /en/', head.canonical.endsWith('/en/'), head.canonical);
  check('JSON-LD тоже переведён', head.ldLang === 'Full-stack developer', String(head.ldLang));

  // Главное: в видимом тексте не должно остаться ни одной русской буквы.
  // Комментарии внутри <script> остаются русскими намеренно — их не видно,
  // и переводить исходник вместе со страницей смысла нет. Подсказка
  // переключателя тоже русская: она адресована тому, кто ищет русскую
  // версию, и для этого помечена lang="ru".
  const leftovers = await page.evaluate(() => {
    const bad = new Set();
    const ru = (el) => el && el.closest('[lang="ru"], script, style');
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const t = n.textContent.trim();
      if (t && /[А-Яа-яЁё]/.test(t) && !ru(n.parentElement)) bad.add(t.slice(0, 60));
    }
    document.querySelectorAll('[alt], [aria-label], [title]').forEach((el) => {
      if (ru(el)) return;
      ['alt', 'aria-label', 'title'].forEach((a) => {
        const v = el.getAttribute(a);
        if (v && /[А-Яа-яЁё]/.test(v)) bad.add(a + '="' + v.slice(0, 50) + '"');
      });
    });
    return [...bad];
  });
  check('русского текста не осталось', leftovers.length === 0, leftovers.slice(0, 3).join(' / '));

  // Терминал переведён не в разметке, а в строках скрипта — отдельный путь.
  await page.click('.dt-icon[data-open="term"]');
  await page.waitForTimeout(700);
  await page.fill('#term-input', 'help');
  await page.press('#term-input', 'Enter');
  await page.waitForTimeout(400);
  check('вывод терминала английский', await page.evaluate(() => {
    const t = document.getElementById('term-log').textContent;
    return /Commands:/.test(t) && !/[А-Яа-яЁё]/.test(t);
  }));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Картинки лежат этажом выше: en/index.html ссылается на ../img/.
  await page.click('.nav-links button[data-page="work"]');
  await page.waitForTimeout(1500);
  check('скриншоты грузятся из ../img/', await page.evaluate(() =>
    [...document.querySelectorAll('.pg-card img.ov')].filter((i) => i.naturalWidth > 0).length > 0),
    await page.evaluate(() => document.querySelector('.pg-card img.ov')?.getAttribute('src') || ''));

  // Переключатель должен вести обратно, а не на самого себя.
  const sw = await page.evaluate(() => {
    const a = document.getElementById('lang-switch');
    return { label: a?.textContent.trim(), href: a?.getAttribute('href'), lang: a?.getAttribute('lang') };
  });
  check('переключатель ведёт на русскую версию',
    sw.label === 'RU' && sw.href === '../' && sw.lang === 'ru', JSON.stringify(sw));
  await ctx.close();

  // …и в обратную сторону с русской страницы.
  const { ctx: rc, page: rp } = await open();
  const rsw = await rp.evaluate(() => {
    const a = document.getElementById('lang-switch');
    return { label: a?.textContent.trim(), href: a?.getAttribute('href'), lang: a?.getAttribute('lang') };
  });
  check('с русской страницы переключатель ведёт в /en/',
    rsw.label === 'EN' && rsw.href === 'en/' && rsw.lang === 'en', JSON.stringify(rsw));
  await rc.close();
}

// --- без JS -------------------------------------------------------
{
  group('Без JavaScript');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  // Раньше здесь был чёрный экран «00%»: разметку прятал #loader.
  const noJs = await page.evaluate(() => ({
    loaderHidden: getComputedStyle(document.getElementById('loader')).display === 'none',
    iconsVisible: getComputedStyle(document.querySelector('.dt-icon')).opacity === '1',
    rows: new Set([...document.querySelectorAll('.dt-icon')].map((e) => Math.round(e.getBoundingClientRect().top))).size,
    links: [...document.querySelectorAll('a')].filter((a) => /^(https?:|mailto:)/.test(a.getAttribute('href') || '')).length,
    deadLinks: [...document.querySelectorAll('a')].filter((a) => !a.hidden && !a.getAttribute('href')).length,
  }));
  check('контент виден без скрипта', noJs.loaderHidden && noJs.iconsVisible);
  check('иконки разложены, а не в одной точке', noJs.rows > 1, noJs.rows + ' рядов');
  check('внешние ссылки работают', noJs.links > 20, noJs.links + ' шт.');
  check('нет ссылок без адреса', noJs.deadLinks === 0);
  await ctx.close();
}

// --- prefers-reduced-motion ---------------------------------------
{
  group('prefers-reduced-motion');
  const { ctx, page } = await open({ reducedMotion: 'reduce' });
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight * 0.55, behavior: 'instant' }));
  await page.waitForTimeout(2200);
  const drawn = await page.evaluate(() => {
    const c = document.getElementById('scene');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4 * 97) if (d[i] > 8) n++;
    return n;
  });
  await page.mouse.move(720, 420);
  await page.waitForTimeout(1400);
  const idle = await page.evaluate(() => new Promise((res) => {
    let n = 0;
    const orig = window.requestAnimationFrame;
    window.requestAnimationFrame = function (cb) { n++; return orig.call(window, cb); };
    setTimeout(() => { window.requestAnimationFrame = orig; res(n); }, 1200);
  }));
  check('сцена всё равно нарисована', drawn > 1000, drawn + ' пикселей');
  check('в покое не тратятся кадры', idle === 0, idle + ' вызовов rAF');
  await ctx.close();
}

await browser.close();

console.log(results.join('\n'));
const uniqueErrors = [...new Set(pageErrors)];
if (uniqueErrors.length) {
  console.log('\nОшибки страницы:');
  uniqueErrors.forEach((e) => console.log('  ' + e));
  failed += uniqueErrors.length;
}
console.log(failed ? `\nПРОВАЛЕНО ПРОВЕРОК: ${failed}` : '\nВСЕ ПРОВЕРКИ ПРОЙДЕНЫ');
process.exit(failed ? 1 : 0);
