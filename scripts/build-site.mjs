// Собирает из артборда Main.dc.html обычную самодостаточную HTML-страницу:
// раскрывает шаблоны sc-for и {{...}} на этапе сборки, подставляет заглушку
// DCLogic и запускает компонент по DOMContentLoaded.
//
// Запуск:  node scripts/build-site.mjs
// Выход:   dist/index.html          — сайт (его публикует GitHub Pages)
//          dist/portfolio-site.html — тот же сайт без обвязки, для артефакта
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EN, PATTERNS, PAGE_EN } from './i18n-en.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const src = readFileSync(join(ROOT, 'Main.dc.html'), 'utf8');

// --- куски исходника ---------------------------------------------
const fontLink = src.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]*>/)[0];
const fontHref = fontLink.match(/href="([^"]+)"/)[1];
// Обычный <link rel="stylesheet"> блокирует отрисовку, а inline-<script>
// не выполняется, пока таблица стилей не разрешится. Если CDN недоступен,
// посетитель видит чёрный экран столько, сколько длится таймаут запроса.
// Грузим асинхронно: системные шрифты из --mono/--sans показываются сразу.
const fontHead = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="${fontHref}" onload="this.onload=null;this.rel='stylesheet'">
<noscript>${fontLink}</noscript>`;

// Без JS вся разметка уже на месте, но её прячет #loader и стартовые
// состояния анимаций. Возвращаем всё это в видимое состояние.
const SITE = 'https://lucky2356.github.io/portfolio/';
const TITLE = 'Alex — full-stack разработчик';
const DESC = 'Портфолио full-stack разработчика: девять проектов на TypeScript, Kotlin, Dart, Rust, Go и Python.';
// Иконка вкладки и превью для мессенджеров: без них ссылка приходит
// безымянным серым прямоугольником.
const favicon = '<link rel="icon" href="data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">' +
  '<rect width="32" height="32" rx="7" fill="#05070a"/>' +
  '<path d="M6 8h20v14H6z" fill="none" stroke="#9fe4ff" stroke-width="2"/>' +
  '<path d="M6 12h20M13 22v3h6v-3M10 25h12" fill="none" stroke="#9fe4ff" stroke-width="2"/>' +
  '</svg>') + '">';
const EN_URL = SITE + 'en/';
const OG_IMG = SITE + 'img/financeapps-2.jpg';
const RU_PAGE = {
  lang: 'ru',
  title: TITLE,
  desc: DESC,
  ogLocale: 'ru_RU',
  ogImageAlt: 'Экран финансового помощника — одного из проектов в портфолио',
  jobTitle: 'Full-stack разработчик',
};

// hreflang в обе стороны: без него поисковик считает две версии дубликатами
// и выбирает одну сам, а вторую прячет.
function metaFor(t, url) {
  return `<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="ru" href="${SITE}">
<link rel="alternate" hreflang="en" href="${EN_URL}">
<link rel="alternate" hreflang="x-default" href="${SITE}">
${favicon}
<meta property="og:type" content="website">
<meta property="og:site_name" content="ALEX.DEV">
<meta property="og:locale" content="${t.ogLocale}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${t.title}">
<meta property="og:description" content="${t.desc}">
<meta property="og:image" content="${OG_IMG}">
<meta property="og:image:alt" content="${t.ogImageAlt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t.title}">
<meta name="twitter:description" content="${t.desc}">
<meta name="twitter:image" content="${OG_IMG}">`;
}

// Person для поисковиков: имя, роль и город, которые иначе приходится
// вычитывать из анимированной вёрстки. Значения — те же CONTACTS, что и
// на самой странице, чтобы не разъезжались.
function personLd(links, t, url) {
  const [city, country] = (links.city || '').split(',').map((x) => x.trim());
  const sameAs = [links.github, links.linkedin, links.telegram].filter(Boolean);
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: links.owner,
    jobTitle: t.jobTitle,
    description: t.desc,
    url: url,
    email: links.emailText || undefined,   // schema.org ждёт адрес, не mailto:
    knowsLanguage: links.languages ? links.languages.split('·').map((x) => x.trim()) : undefined,
    address: city ? { '@type': 'PostalAddress', addressLocality: city, addressCountry: country || undefined } : undefined,
    sameAs: sameAs.length ? sameAs : undefined,
  };
  // undefined-поля в JSON-LD не нужны: пустая строка хуже отсутствия.
  const clean = JSON.parse(JSON.stringify(person));
  return '<script type="application/ld+json">' +
    JSON.stringify(clean).replace(/</g, '\\u003c') + '<\/script>';
}

const noJsCss = `<noscript><style>
#loader { display: none !important; }
.dt-icon, .in-up, .reveal, .st, .taskbar,
.dt-widget h1 .w, .hero-title .w {
  opacity: 1 !important; transform: none !important;
  filter: none !important; animation: none !important;
}
.wipe { clip-path: none !important; }
</style></noscript>`;
const css = src.slice(src.indexOf('<style>') + 7, src.indexOf('</style>'));
const body = src.slice(src.indexOf('</helmet>') + 9, src.indexOf('</x-dc>'));
const script = src.slice(
  src.indexOf('>', src.indexOf('<script data-dc-script')) + 1,
  src.lastIndexOf('</script>')
);

// --- проверка: каждая анимация ссылается на существующие кадры ----
// Удаление блока CSS легко уносит с собой @keyframes, лежащий между правилами:
// анимация остаётся назначенной, но не запускается, и элемент навсегда
// остаётся в стартовом состоянии (например, невидимым).
{
  const declared = new Set(
    [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1]));
  const used = new Set();
  for (const m of css.matchAll(/animation(?:-name)?\s*:\s*([^;}]+)/g)) {
    for (const part of m[1].split(',')) {
      for (const tok of part.trim().split(/\s+/)) {
        if (/^[a-zA-Z][\w-]*$/.test(tok)) used.add(tok);
      }
    }
  }
  const known = new Set(['none', 'infinite', 'forwards', 'backwards', 'both',
    'normal', 'reverse', 'alternate', 'linear', 'ease', 'ease-in', 'ease-out',
    'ease-in-out', 'steps', 'running', 'paused', 'initial', 'inherit', 'unset',
    'var', 'cubic-bezier', 'alternate-reverse', 'step-start', 'step-end']);
  const missing = [...used].filter((n) => !declared.has(n) && !known.has(n));
  if (missing.length) {
    throw new Error('анимация без @keyframes: ' + missing.join(', '));
  }
  console.log('анимации на месте:', declared.size, 'наборов кадров');
}

// --- данные из renderVals() --------------------------------------
const PROPS = { ice: '#9fe4ff', detail: 'medium', scatter: 45, atmosphere: true };
const dataFn = new Function(`
  class DCLogic { constructor(){ this.props = ${JSON.stringify(PROPS)}; } }
  var document = undefined, window = undefined;
  ${script}
  var c = Object.create(Component.prototype);
  c.props = ${JSON.stringify(PROPS)};
  return c.renderVals();
`);
const data = dataFn();
console.log('data keys:', Object.keys(data).join(', '));

// --- крошечный шаблонизатор --------------------------------------
function lookupRaw(scope, path) {
  const parts = path.trim().split('.');
  let v = scope;
  for (const p of parts) { if (v == null) return null; v = v[p]; }
  return v;
}

function lookup(scope, path) {
  const v = lookupRaw(scope, path);
  return v == null ? '' : String(v);
}

function fill(chunk, scope) {
  return chunk.replace(/\{\{([^}]+)\}\}/g, (_, path) =>
    lookup(scope, path)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
}

function render(tpl, scope) {
  let out = '';
  let i = 0;
  for (;;) {
    const open = tpl.indexOf('<sc-for', i);
    if (open === -1) { out += fill(tpl.slice(i), scope); break; }
    out += fill(tpl.slice(i, open), scope);

    const tagEnd = tpl.indexOf('>', open);
    const tag = tpl.slice(open, tagEnd + 1);
    const listName = /list="\{\{([^}]+)\}\}"/.exec(tag)[1].trim();
    const asName = /as="([^"]+)"/.exec(tag)[1];

    // ищем парный </sc-for> с учётом вложенности
    let depth = 1, p = tagEnd + 1;
    while (depth > 0) {
      const nextOpen = tpl.indexOf('<sc-for', p);
      const nextClose = tpl.indexOf('</sc-for>', p);
      if (nextClose === -1) throw new Error('sc-for без закрытия: ' + listName);
      if (nextOpen !== -1 && nextOpen < nextClose) { depth++; p = nextOpen + 7; }
      else { depth--; p = nextClose + 9; }
    }
    const inner = tpl.slice(tagEnd + 1, p - 9);
    const list = lookupRaw(scope, listName);
    if (Array.isArray(list)) {
      for (const item of list) out += render(inner, { ...scope, [asName]: item });
    }
    i = p;
  }
  return out;
}

let markup = render(body, data);
const holes = (markup.match(/\{\{/g) || []).length;
if (holes) throw new Error(`в разметке осталось ${holes} нераскрытых {{...}}`);
console.log('sc-for раскрыт, дырок не осталось');

// --- проверка вложенности тегов ----------------------------------
// Ловит закрывающий тег не от того элемента: браузер такое молча «чинит»
// клонированием, и вёрстка едет (так копирайт однажды стал кнопкой).
const VOID = new Set(['area','base','br','col','embed','hr','img','input',
  'link','meta','param','source','track','wbr']);
function checkNesting(html, where) {
  const stack = [];
  const tag = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g;
  let m;
  while ((m = tag.exec(html)) !== null) {
    const [, close, rawName, attrs] = m;
    const name = rawName.toLowerCase();
    if (VOID.has(name) || attrs.trimEnd().endsWith('/')) continue;
    const line = html.slice(0, m.index).split('\n').length;
    if (!close) { stack.push({ name, line }); continue; }
    const top = stack[stack.length - 1];
    if (!top) throw new Error(`${where}: строка ${line} — </${name}> без открывающего тега`);
    if (top.name !== name) {
      throw new Error(`${where}: строка ${line} — встречен </${name}>, ` +
        `а ожидался </${top.name}> (открыт на строке ${top.line})`);
    }
    stack.pop();
  }
  if (stack.length) {
    const t = stack[stack.length - 1];
    throw new Error(`${where}: <${t.name}> со строки ${t.line} не закрыт`);
  }
}
checkNesting(markup, 'разметка Main.dc.html');
console.log('вложенность тегов в порядке');

// --- проверка: id не повторяются ---------------------------------
// Два элемента с одним id — невалидный HTML, а getElementById молча
// возвращает первый: так сборка однажды заворачивала разметку во второй
// #dc-root поверх того, что уже был в артборде.
{
  const seen = new Map();
  for (const m of markup.matchAll(/\sid="([^"]+)"/g)) {
    seen.set(m[1], (seen.get(m[1]) || 0) + 1);
  }
  const dup = [...seen].filter(([, n]) => n > 1);
  if (dup.length) {
    throw new Error('id повторяются: ' + dup.map(([k, n]) => `${k} ×${n}`).join(', '));
  }
  console.log(`id уникальны: ${seen.size} шт.`);
}

// --- настоящие href для внешних ссылок ---------------------------
// wireLinks() в рантайме делает то же самое, но проставить href на этапе
// сборки дешевле и, главное, ссылки работают без JS.
let wired = 0;
let hiddenLinks = 0;
// Атрибуты забираем одним проходом, как в rewriteImages: два ленивых
// квантификатора в одном шаблоне дают квадратичный откат на длинных тегах.
markup = markup.replace(/<a\s([^>]*)>/g, (whole, attrs) => {
  const m = /\sdata-url="([^"]*)"/.exec(' ' + attrs);
  if (!m) return whole;
  const url = m[1];
  // Незаполненный контакт не должен превращаться в мёртвую кнопку.
  if (!url) { hiddenLinks++; return `<a ${attrs} hidden>`; }
  if (!/^(https?:|mailto:)/i.test(url)) return whole;
  if (/\shref=/.test(' ' + attrs)) return whole;
  wired++;
  return `<a ${attrs} href="${url}">`;
});
console.log('href проставлен у', wired, 'ссылок, скрыто незаполненных:', hiddenLinks);

// --- что осталось заполнить --------------------------------------
{
  const todo = Object.entries(data.links)
    .filter(([k, v]) => !v && k !== 'emailText')
    .map(([k]) => k);
  if (!data.links.owner || data.links.owner === 'ALEX') todo.push('surname');
  if (todo.length) {
    console.log('\n  ЗАПОЛНИТЬ в CONTACTS (Main.dc.html): ' + todo.join(', '));
    console.log('  Пока пусто — соответствующие ссылки на странице скрыты.\n');
  }
}

// --- перевод: русский артборд → английская страница ---------------
// Подстановка идёт по точному совпадению целой строки. Частичных замен нет
// специально: иначе «ЯЗЫКОВ» съело бы половину «ЯЗЫКОВ В РАБОТЕ», а порядок
// ключей в словаре начал бы влиять на результат.
const CYR = /[А-Яа-яЁё]/;
const used = new Set();
function tr(str) {
  const key = str.trim();
  if (!CYR.test(key)) return str;
  if (Object.prototype.hasOwnProperty.call(EN, key)) {
    used.add(key);
    return str.replace(key, EN[key]);
  }
  for (const [re, to] of PATTERNS) {
    const m = key.match(re);
    if (!m) continue;
    // Захваченные группы — это, как правило, название проекта, и оно тоже
    // может быть в словаре («Финансовый помощник» → «Finance Assistant»).
    const parts = m.slice(1).map((g) => {
      if (!Object.prototype.hasOwnProperty.call(EN, g)) return g;
      used.add(g);
      return EN[g];
    });
    return str.replace(key, to.replace(/\$(\d+)/g, (_, n) => parts[n - 1]));
  }
  return str;
}

// Текстовые узлы и те атрибуты, которые видит пользователь.
const TEXT_ATTRS = /\s(alt|aria-label|title|placeholder|data-title)="([^"]*)"/g;
function translateMarkup(html) {
  return html
    .split(/(<[^>]+>)/)
    .map((part) => (part.startsWith('<')
      ? part.replace(TEXT_ATTRS, (m, name, val) => ` ${name}="${tr(val).replace(/"/g, '&quot;')}"`)
      : tr(part)))
    .join('');
}

// В скрипте переводится только содержимое строковых литералов целиком —
// код и имена полей не трогаются.
function translateScript(js) {
  return js.replace(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g, (m) => {
    const q = m[0];
    const inner = m.slice(1, -1);
    if (!CYR.test(inner)) return m;
    // Перевод кладётся обратно в литерал той же кавычки, поэтому свою
    // кавычку в нём нужно экранировать: из-за «HI, I'M» страница иначе
    // падала с SyntaxError, а не просто выглядела не так.
    const out = tr(inner).replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q);
    return q + out + q;
  });
}

// Непереведённая строка роняет сборку и печатается списком: недоделанный
// перевод физически не попадёт в main.
function checkTranslated(html, where) {
  const left = new Set();
  html.split(/(<[^>]+>)/).forEach((part) => {
    if (part.startsWith('<')) {
      for (const m of part.matchAll(TEXT_ATTRS)) if (CYR.test(m[2])) left.add(m[2].trim());
      return;
    }
    const t = part.trim();
    if (t && CYR.test(t)) left.add(t);
  });
  if (left.size) {
    throw new Error(`${where}: ${left.size} строк без перевода — допишите их в scripts/i18n-en.mjs:\n` +
      [...left].map((x) => `  '${x.slice(0, 90)}': '',`).join('\n'));
  }
}

// --- картинки: из base64 в отдельные файлы -----------------------
// Каждый из 15 скриншотов встречался в разметке 2-4 раза (окно, карточка
// в сетке, подробная карточка) — 1,14 МБ из 1,4 МБ страницы, и три четверти
// этого веса были чистым дублированием. Отдельные файлы браузер кеширует
// и грузит по мере надобности.
const shots = new Map();          // data-URI -> имя файла
for (const pr of data.projects) {
  ['shot1', 'shot2', 'shot3'].forEach((k, i) => {
    const uri = pr[k];
    if (uri && !shots.has(uri)) shots.set(uri, `${pr.slug}-${i + 1}.jpg`);
  });
}

// Размеры из заголовка JPEG: без width/height картинка «прыгает» при загрузке.
function jpegSize(buf) {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xFF) { i++; continue; }
    const marker = buf[i + 1];
    if (marker === 0xD8 || marker === 0x01 || (marker >= 0xD0 && marker <= 0xD7)) { i += 2; continue; }
    const len = buf.readUInt16BE(i + 2);
    const isSOF = marker >= 0xC0 && marker <= 0xCF &&
      marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC;
    if (isSOF) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    i += 2 + len;
  }
  return null;
}

const files = new Map();          // имя файла -> Buffer
const dims = new Map();           // имя файла -> {w,h}
for (const [uri, name] of shots) {
  const buf = Buffer.from(uri.slice(uri.indexOf(',') + 1), 'base64');
  files.set(name, buf);
  const d = jpegSize(buf);
  if (d) dims.set(name, d);
  else console.warn('  не удалось прочитать размеры', name);
}

// Переписывает <img>: подставляет src и добавляет атрибуты, без которых
// картинки грузятся все сразу и двигают вёрстку при появлении.
function rewriteImages(html, srcFor) {
  return html.replace(/<img\b([^>]*)>/g, (whole, attrs) => {
    const m = /\ssrc="([^"]*)"/.exec(attrs);
    if (!m || !shots.has(m[1])) return whole;
    const name = shots.get(m[1]);
    const d = dims.get(name);
    let out = attrs.replace(m[0], ' ' + srcFor(name));
    if (d && !/\swidth=/.test(out)) {
      out += ` width="${d.w}" height="${d.h}"`;
      // Вертикальный скриншот в горизонтальной рамке нельзя обрезать по ширине:
      // от экрана телефона остаётся одна полоска статус-бара.
      if (d.h > d.w) out += ' data-portrait="1"';
    }
    if (!/\sloading=/.test(out)) out += ' loading="lazy" decoding="async"';
    return `<img${out}>`;
  });
}

// index.html — картинки лежат рядом файлами
const markupFiles = rewriteImages(markup, (name) => `src="img/${name}"`);
// portfolio-site.html — артефакт должен быть самодостаточным, поэтому
// base64 остаётся, но каждая картинка встречается в файле ровно один раз.
const markupInline = rewriteImages(markup, (name) => `src="" data-img="${name}"`);
const inlineImgScript = 'var __IMG=' + JSON.stringify(
  Object.fromEntries([...shots].map(([uri, name]) => [name, uri]))) + ';\n' +
  "document.querySelectorAll('img[data-img]').forEach(function(i){" +
  "var u=__IMG[i.getAttribute('data-img')]; if(u) i.src=u;});\n";

const shotBytes = [...files.values()].reduce((a, b) => a + b.length, 0);
console.log('картинок вынесено:', files.size, '—', Math.round(shotBytes / 1024) + ' KB');

// В браузере renderVals() не вызывается: разметка уже собрана здесь. Но карта
// IMG внутри неё тащила в бандл вторую полную копию всех скриншотов — вырезаем
// сами base64-строки, оставляя объект синтаксически целым.
const scriptRuntime = script.replace(/'data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]*'/g, "''");
const saved = script.length - scriptRuntime.length;
console.log('из скрипта вырезано', Math.round(saved / 1024) + ' KB неиспользуемых base64');

const boot = `
var __PROPS = ${JSON.stringify(PROPS)};
class DCLogic { constructor() { this.props = __PROPS; } }
${scriptRuntime}
(function () {
  function boot() {
    try {
      var c = new Component(); c.props = __PROPS; c.componentDidMount();
    } catch (e) {
      // Интерактив упал, но текст, ссылки и картинки уже в разметке —
      // снимаем лоадер и показываем страницу как есть, а не чёрный экран.
      if (window.console && console.error) console.error(e);
      var root = document.getElementById('dc-root');
      if (root) { root.classList.add('revealed'); root.classList.add('landed'); }
      var l = document.getElementById('loader');
      if (l) l.classList.add('done');
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
`;

// Переключатель языка ведёт в разные стороны с разных страниц.
function wireSwitch(html, href, label, lang, title) {
  return html.replace(
    /<a class="lang" id="lang-switch"[^>]*>[^<]*<\/a>/,
    `<a class="lang" id="lang-switch" href="${href}" hreflang="${lang}" lang="${lang}" title="${title}">${label}</a>`);
}

function buildPage(t, url, markup, script, { imgPrefix = '', switchTo }) {
  let m = wireSwitch(markup, switchTo.href, switchTo.label, switchTo.lang, switchTo.title);
  if (imgPrefix) m = m.replace(/src="img\//g, `src="${imgPrefix}img/`);
  return `<!doctype html>
<html lang="${t.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${t.title}</title>
<meta name="description" content="${t.desc}">
<meta name="color-scheme" content="dark">
${metaFor(t, url)}
${personLd(t.links, t, url)}
${fontHead}
<style>${css}</style>
${noJsCss}
</head>
<body>
${m}
<script>${script}</script>
</body>
</html>
`;
}

// --- английская версия ------------------------------------------------
const EN_PAGE = { ...PAGE_EN, lang: 'en' };
const markupEn = translateMarkup(markupFiles);
const bootEn = translateScript(boot);
checkTranslated(markupEn, 'английская разметка');
EN_PAGE.links = Object.fromEntries(
  Object.entries(data.links).map(([k, v]) => [k, typeof v === 'string' ? tr(v) : v]));
// Имя владельца одинаково на обоих языках, а вот город и формат — нет.
const unusedKeys = Object.keys(EN).filter((k) => !used.has(k));

const RU_SWITCH = { href: 'en/', label: 'EN', lang: 'en', title: 'Read this in English' };
const EN_SWITCH = { href: '../', label: PAGE_EN.switchLabel, lang: 'ru', title: PAGE_EN.switchTitle };

RU_PAGE.links = data.links;
const page = buildPage(RU_PAGE, SITE, markupFiles, boot, { switchTo: RU_SWITCH });
const pageEn = buildPage(EN_PAGE, EN_URL, markupEn, bootEn, { imgPrefix: '../', switchTo: EN_SWITCH });

// вариант для публикации артефактом: без doctype/html/head/body
const artifact = `<title>${TITLE}</title>
${fontHead}
<style>${css}</style>
${noJsCss}
${wireSwitch(markupInline, SITE + 'en/', 'EN', 'en', RU_SWITCH.title)}
<script>${inlineImgScript}${boot}<\/script>
`;

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'img'), { recursive: true });
for (const [name, buf] of files) writeFileSync(join(DIST, 'img', name), buf);
writeFileSync(join(DIST, 'index.html'), page, 'utf8');
mkdirSync(join(DIST, 'en'), { recursive: true });
writeFileSync(join(DIST, 'en', 'index.html'), pageEn, 'utf8');
writeFileSync(join(DIST, 'portfolio-site.html'), artifact, 'utf8');
console.log(`перевод: ${used.size} строк подставлено` +
  (unusedKeys.length ? `, ${unusedKeys.length} в словаре не понадобились` : ''));

// Без robots.txt и sitemap.xml поисковик обходит сайт вслепую, а на
// GitHub Pages положить их больше некому — статика собирается здесь.
const today = new Date().toISOString().slice(0, 10);
writeFileSync(join(DIST, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE}sitemap.xml\n`, 'utf8');
writeFileSync(join(DIST, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  [SITE, EN_URL].map((u) =>
    `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n` +
    '    <changefreq>monthly</changefreq>\n    <priority>1.0</priority>\n  </url>\n').join('') +
  '</urlset>\n', 'utf8');
console.log('dist/robots.txt и dist/sitemap.xml');
console.log('dist/index.html', Math.round(page.length / 1024) + ' KB');
console.log('dist/portfolio-site.html', Math.round(artifact.length / 1024) + ' KB');
