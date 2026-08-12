import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const b64 = (p) => readFileSync(join(ROOT, p)).toString('base64');
const jsData = (p) => 'data:text/javascript;base64,' + b64(p);
const escInline = (s) => s.replace(/<\/(script)/gi, '<\\/$1').replace(/<!--/g, '<\\!--');

const importmap = {
  imports: {
    'three': jsData('vendor/three.min.js'),
    'three/addons/controls/OrbitControls.js': jsData('vendor/OrbitControls.min.js'),
  },
};

let fontCss = read('fonts/fonts.css').replace(/url\(([^)]+\.woff2)\)/g, (_m, file) => {
  const clean = file.trim().replace(/^['"]|['"]$/g, '');
  return `url(data:font/woff2;base64,${b64(join('fonts', clean))})`;
});

const models = read('src/models.js').replace(/^\s*export\s*\{[\s\S]*?\};?\s*$/m, '');
let main = read('src/main.js').replace(/^\s*import\s*\{[^}]*\}\s*from\s*['"]\.\/models\.js['"];?\s*$/m, '');
const appModule = `${models}\n${main}`;
const stage = read('src/three-d-stage.js');

let html = read('index.html');
html = html.replace(/<script type="importmap">[\s\S]*?<\/script>/,
  `<script type="importmap">\n${JSON.stringify(importmap)}\n</script>`);
html = html.replace(/<link rel="stylesheet" href="fonts\/fonts\.css">/,
  `<style>${fontCss}</style>`);
html = html.replace(/<script src="src\/three-d-stage\.js"><\/script>/,
  `<script>\n${escInline(stage)}\n</script>`);
html = html.replace(/<script type="module" src="src\/main\.js"><\/script>/,
  `<script type="module">\n${escInline(appModule)}\n</script>`);

writeFileSync(join(ROOT, 'dist/cell-and-iss.standalone.html'), html);
const externals = (html.match(/(src|href)\s*=\s*["']https?:\/\//g) || []).length +
  (html.match(/url\(https?:\/\//g) || []).length;
console.log(`dist/cell-and-iss.standalone.html  ${(Buffer.byteLength(html) / 1024).toFixed(0)} KB  external-refs=${externals}`);
