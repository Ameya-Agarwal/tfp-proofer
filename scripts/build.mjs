// Builds dist/index.html (single self-contained page) and functions/_lib/dict.js (dictionaries for the API).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSync } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const r = (...p) => fs.readFileSync(path.join(root, ...p), 'utf8');
const safe = s => s.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');
const js = s => JSON.stringify(s);

const dicts = {
  gb: { aff: r('node_modules/dictionary-en-gb/index.aff'), dic: r('node_modules/dictionary-en-gb/index.dic') },
  us: { aff: r('node_modules/dictionary-en/index.aff'), dic: r('node_modules/dictionary-en/index.dic') }
};

// 1. Dictionaries as an ES module for the Pages Function.
fs.mkdirSync(path.join(root, 'functions/_lib'), { recursive: true });
fs.writeFileSync(path.join(root, 'functions/_lib/dict.js'),
  `export default {gb:{aff:${js(dicts.gb.aff)},dic:${js(dicts.gb.dic)}},us:{aff:${js(dicts.us.aff)},dic:${js(dicts.us.dic)}}};\n`);

// 2. Browser bundle of nspell.
const nspell = buildSync({
  stdin: { contents: "import nspell from 'nspell'; window.nspell = nspell;", resolveDir: root },
  bundle: true, minify: true, format: 'iife', platform: 'browser', write: false
}).outputFiles[0].text;

// 3. Single-file page.
const dictScript = `window.FP_DICT = {gb:{aff:${js(dicts.gb.aff)},dic:${js(dicts.gb.dic)}},us:{aff:${js(dicts.us.aff)},dic:${js(dicts.us.dic)}}};`;
let html = r('src/template.html');
const put = (k, v) => { html = html.replace(`/*@@${k}@@*/`, () => safe(v)); };
put('NSPELL', nspell);
put('DICT', dictScript);
put('ENGINE', r('src/engine.cjs'));
put('APP', r('src/app.js'));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/index.html'), html);
fs.writeFileSync(path.join(root, 'dist/_headers'), '/api/*\n  Access-Control-Allow-Origin: *\n');
console.log('dist/index.html', (html.length / 1048576).toFixed(2), 'MB');
