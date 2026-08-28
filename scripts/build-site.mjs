// Собирает из артборда Main.dc.html обычную самодостаточную HTML-страницу:
// раскрывает шаблоны sc-for и {{...}} на этапе сборки, подставляет заглушку
// DCLogic и запускает компонент по DOMContentLoaded.
//
// Запуск:  node scripts/build-site.mjs
// Выход:   dist/index.html          — сайт (его публикует GitHub Pages)
//          dist/portfolio-site.html — тот же сайт без обвязки, для артефакта
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const src = readFileSync(join(ROOT, 'Main.dc.html'), 'utf8');

// --- куски исходника ---------------------------------------------
const fontLink = src.match(/<link rel="stylesheet" href="https:\/\/fonts[^>]*>/)[0];
const css = src.slice(src.indexOf('<style>') + 7, src.indexOf('</style>'));
const body = src.slice(src.indexOf('</helmet>') + 9, src.indexOf('</x-dc>'));
const script = src.slice(
  src.indexOf('>', src.indexOf('<script data-dc-script')) + 1,
  src.lastIndexOf('</script>')
);

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

const markup = render(body, data);
const holes = (markup.match(/\{\{/g) || []).length;
if (holes) throw new Error(`в разметке осталось ${holes} нераскрытых {{...}}`);
console.log('sc-for раскрыт, дырок не осталось');

const boot = `
var __PROPS = ${JSON.stringify(PROPS)};
class DCLogic { constructor() { this.props = __PROPS; } }
${script}
(function () {
  function boot() { var c = new Component(); c.props = __PROPS; c.componentDidMount(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
`;

const page = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Alex — full-stack разработчик</title>
<meta name="description" content="Портфолио full-stack разработчика: девять проектов на TypeScript, Kotlin, Dart, Rust, Go и Python.">
<meta name="color-scheme" content="dark">
${fontLink}
<style>${css}</style>
</head>
<body>
<div id="dc-root">${markup}</div>
<script>${boot}</script>
</body>
</html>
`;

// вариант для публикации артефактом: без doctype/html/head/body
const artifact = `<title>Alex — full-stack разработчик</title>
${fontLink}
<style>${css}</style>
<div id="dc-root">${markup}</div>
<script>${boot}<\/script>
`;

mkdirSync(DIST, { recursive: true });
writeFileSync(join(DIST, 'index.html'), page, 'utf8');
writeFileSync(join(DIST, 'portfolio-site.html'), artifact, 'utf8');
console.log('dist/index.html', Math.round(page.length / 1024) + ' KB');
console.log('dist/portfolio-site.html', Math.round(artifact.length / 1024) + ' KB');
