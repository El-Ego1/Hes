// يبني فولدر www/ (اللي Capacitor والاستضافة بيستخدموه):
//  1) ينسخ ملفات التطبيق
//  2) ينسخ المكتبات (Chart.js / SheetJS / Firebase) من node_modules إلى www/vendor
//     ويحوّل روابط الـ CDN في index.html إليها → التطبيق يشتغل أوفلاين 100% حتى أول مرة.
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const www = join(root, 'www');
const nm = (p) => join(root, 'node_modules', p);

rmSync(www, { recursive: true, force: true });
mkdirSync(join(www, 'vendor'), { recursive: true });

for (const f of ['index.html', 'sw.js', 'manifest.json']) cpSync(join(root, f), join(www, f));
cpSync(join(root, 'icons'), join(www, 'icons'), { recursive: true });

const vendor = [
  ['https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', 'chart.js/dist/chart.umd.js', 'chart.umd.js'],
  ['https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js', 'xlsx/dist/xlsx.full.min.js', 'xlsx.full.min.js'],
  ['https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js', 'firebase/firebase-app-compat.js', 'firebase-app-compat.js'],
  ['https://www.gstatic.com/firebasejs/10.13.2/firebase-auth-compat.js', 'firebase/firebase-auth-compat.js', 'firebase-auth-compat.js'],
  ['https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore-compat.js', 'firebase/firebase-firestore-compat.js', 'firebase-firestore-compat.js'],
];

let html = readFileSync(join(www, 'index.html'), 'utf8');
let vendored = 0;
for (const [cdn, src, out] of vendor) {
  if (!existsSync(nm(src))) {
    console.warn(`⚠ ناقص ${src} — شغّل: npm install   (هيفضل رابط CDN لهذه المكتبة)`);
    continue;
  }
  cpSync(nm(src), join(www, 'vendor', out));
  if (html.includes(cdn)) { html = html.split(cdn).join('vendor/' + out); vendored++; }
}
writeFileSync(join(www, 'index.html'), html);

// نسخة الكاش في sw.js تتغير مع كل build عشان التحديثات توصل للمستخدم
let sw = readFileSync(join(www, 'sw.js'), 'utf8');
sw = sw.replace(/const CACHE = '[^']*';/, `const CACHE = 'hesabati-${Date.now().toString(36)}';`);
sw = sw.replace("'icons/icon-512.png',", "'icons/icon-512.png', 'vendor/chart.umd.js', 'vendor/xlsx.full.min.js', 'vendor/firebase-app-compat.js', 'vendor/firebase-auth-compat.js', 'vendor/firebase-firestore-compat.js',");
writeFileSync(join(www, 'sw.js'), sw);

console.log(`✔ www/ جاهز — مكتبات محلية: ${vendored}/${vendor.length}`);
