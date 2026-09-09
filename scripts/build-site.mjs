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
const meta = `<link rel="canonical" href="${SITE}">
${favicon}
<meta property="og:type" content="website">
<meta property="og:site_name" content="ALEX.DEV">
<meta property="og:locale" content="ru_RU">
<meta property="og:url" content="${SITE}">
<meta property="og:title" content="${TITLE}">
<meta property="og:description" content="${DESC}">
<meta property="og:image" content="${SITE}img/financeapps-2.jpg">
<meta property="og:image:alt" content="Экран финансового помощника — одного из проектов в портфолио">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${TITLE}">
<meta name="twitter:description" content="${DESC}">
<meta name="twitter:image" content="${SITE}img/financeapps-2.jpg">`;

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

const page = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${TITLE}</title>
<meta name="description" content="${DESC}">
<meta name="color-scheme" content="dark">
${meta}
${fontHead}
<style>${css}</style>
${noJsCss}
</head>
<body>
<div id="dc-root">${markupFiles}</div>
<script>${boot}</script>
</body>
</html>
`;

// вариант для публикации артефактом: без doctype/html/head/body
const artifact = `<title>${TITLE}</title>
${fontHead}
<style>${css}</style>
${noJsCss}
<div id="dc-root">${markupInline}</div>
<script>${inlineImgScript}${boot}<\/script>
`;

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'img'), { recursive: true });
for (const [name, buf] of files) writeFileSync(join(DIST, 'img', name), buf);
writeFileSync(join(DIST, 'index.html'), page, 'utf8');
writeFileSync(join(DIST, 'portfolio-site.html'), artifact, 'utf8');
console.log('dist/index.html', Math.round(page.length / 1024) + ' KB');
console.log('dist/portfolio-site.html', Math.round(artifact.length / 1024) + ' KB');
