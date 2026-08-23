import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const argIndex = process.argv.indexOf('--out');
const OUT = path.resolve(argIndex >= 0 && process.argv[argIndex + 1] ? process.argv[argIndex + 1] : path.join(ROOT, 'dist'));

const learnerPages = [
  'index.html', 'practice.html', 'passages.html', 'resources.html', 'progress.html',
  'curriculum.html', 'domain.html', 'category.html', 'skill.html', 'module.html',
  'extended-response.html', 'train.html', 'quiz.html', 'test.html', 'about.html', 'methodology.html',
  'privacy.html', 'offline.html', '404.html'
];

const rootFiles = ['favicon.svg', 'manifest.json', 'sw.js', 'release.json'];
const learnerJs = [
  'app.js', 'storage.js', 'data.js', 'learning.js', 'home.js', 'library-model.js',
  'practice.js', 'passages.js', 'resources.js', 'progress.js', 'curriculum.js',
  'domain.js', 'category.js', 'skill.js', 'module.js', 'focus-tools.js', 'train.js',
  'question-interactions.js', 'mock-engine.js', 'quiz.js', 'extended-response.js'
];
const learnerCss = ['site.css'];
const generatedData = [
  'index.json', 'curriculum.json', 'er-prompts.json', 'mock-blueprint.json'
];

async function copyFile(rel) {
  const from = path.join(ROOT, rel);
  const to = path.join(OUT, rel);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}

async function copyDir(fromRel, toRel = fromRel, filter = () => true) {
  const from = path.join(ROOT, fromRel);
  const to = path.join(OUT, toRel);
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const rel = path.join(fromRel, entry.name);
    if (!filter(rel, entry)) continue;
    if (entry.isDirectory()) await copyDir(rel, path.join(toRel, entry.name), filter);
    else await copyFileTo(rel, path.join(toRel, entry.name));
  }
}

async function copyFileTo(fromRel, toRel) {
  const from = path.join(ROOT, fromRel);
  const to = path.join(OUT, toRel);
  await fs.mkdir(path.dirname(to), { recursive: true });
  await fs.copyFile(from, to);
}

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

for (const file of [...learnerPages, ...rootFiles]) await copyFile(file);
for (const file of learnerCss) await copyFile(path.join('css', file));
for (const file of learnerJs) await copyFile(path.join('js', file));
await copyDir('icons');
await copyFile('assets/chee-skool-logo.png');
await copyDir('assets/resources', 'assets/resources', (rel, entry) => entry.isDirectory() || !rel.endsWith('/README.md'));
for (const file of generatedData) await copyFile(path.join('data/generated', file));
await copyDir('data/generated/modules');
await fs.writeFile(path.join(OUT, '.nojekyll'), '');

console.log(`Built learner-only Chee Skool site at ${OUT}`);
