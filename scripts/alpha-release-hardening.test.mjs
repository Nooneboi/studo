import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateContent } from './validate-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function allCanonicalQuestions() {
  const dir = path.join(ROOT, 'content-src', 'sets');
  const rows = [];
  for (const file of fs.readdirSync(dir).filter((name) => name.endsWith('.json'))) {
    const set = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    if (set.status !== 'published') continue;
    for (const question of set.questions || []) rows.push({ file, set, question });
  }
  return rows;
}

test('pre-alpha content depth warnings targeted for hardening are resolved', async () => {
  const result = await validateContent({ quiet: true });
  const targetedCodes = new Set(['TRANSFER_FAMILY_SINGLETON', 'PUBLISHED_SKILL_LOW_COVERAGE']);
  const remaining = result.warnings.filter((issue) => targetedCodes.has(issue.code));
  assert.deepEqual(remaining, [], `content-depth warnings remain:\n${remaining.map((x) => `${x.code} ${x.message}`).join('\n')}`);
});

test('target transfer families have at least three published canonical variants', () => {
  const targetFamilies = ['cause.implied', 'connotation.choice', 'tone.identify', 'structure.effect', 'pov.author'];
  const rows = allCanonicalQuestions();
  for (const familyId of targetFamilies) {
    const variants = rows.filter(({ question }) => question.familyId === familyId);
    assert.ok(variants.length >= 3, `${familyId} should have at least three published variants; found ${variants.length}`);
  }
});

test('low-coverage argument and ER skills have at least four canonical questions', () => {
  const targetSkills = ['R5.4', 'W1.8', 'W1.9', 'W1.10', 'W1.11'];
  const rows = allCanonicalQuestions();
  for (const skillId of targetSkills) {
    const variants = rows.filter(({ question }) => question.primarySkillId === skillId);
    assert.ok(variants.length >= 4, `${skillId} should have at least four canonical questions; found ${variants.length}`);
  }
});

test('PDF generation source uses Chee Skool branding instead of Studo branding', () => {
  const files = [
    'scripts/generate_arguments_pdfs.py',
    'scripts/generate_language_pdfs.py',
    'scripts/generate_extended_response_pdfs.py',
    'scripts/extended_response_pdf_content.py'
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.doesNotMatch(source, /\bStudo\b/, `${file} still emits old Studo branding`);
    assert.match(source, /Chee Skool/, `${file} should contain Chee Skool branding`);
  }
});

test('content validation rejects unknown question-family IDs', async () => {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'chee-skool-family-validation-'));
  const copy = path.join(tmp, 'studo');
  await fsp.cp(ROOT, copy, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.git${path.sep}`) && !src.endsWith(`${path.sep}.git`),
  });
  const setFile = path.join(copy, 'content-src', 'sets', 'set-rla-mainidea-active-methods-v1.json');
  const set = JSON.parse(await fsp.readFile(setFile, 'utf8'));
  set.questions[0].familyId = 'unknown.family.for-regression-test';
  await fsp.writeFile(setFile, JSON.stringify(set, null, 2) + '\n');
  const result = spawnSync(process.execPath, ['scripts/validate-content.mjs'], { cwd: copy, encoding: 'utf8' });
  assert.notEqual(result.status, 0, 'validator should reject an unknown familyId');
  assert.match(`${result.stdout}\n${result.stderr}`, /FAMILY_UNKNOWN/);
});

test('published resource registry and physical PDF assets stay in sync', async () => {
  const registry = JSON.parse(await fsp.readFile(path.join(ROOT, 'content-src', 'resources', 'rla.resources.json'), 'utf8'));
  const registered = new Set((registry.resources || [])
    .filter((resource) => resource.status === 'published' && String(resource.href || '').startsWith('assets/resources/') && String(resource.href).toLowerCase().endsWith('.pdf'))
    .map((resource) => path.basename(resource.href)));
  const physical = new Set((await fsp.readdir(path.join(ROOT, 'assets', 'resources'))).filter((name) => name.toLowerCase().endsWith('.pdf')));
  const orphan = [...physical].filter((name) => !registered.has(name)).sort();
  const missing = [...registered].filter((name) => !physical.has(name)).sort();
  assert.deepEqual(orphan, [], `unregistered PDF assets remain:\n${orphan.join('\n')}`);
  assert.deepEqual(missing, [], `registered PDF assets are missing:\n${missing.join('\n')}`);
});

test('learner-only public build excludes internal authoring surfaces', async () => {
  const buildScript = path.join(ROOT, 'scripts', 'build-public.mjs');
  assert.ok(fs.existsSync(buildScript), 'scripts/build-public.mjs must exist');
  const out = await fsp.mkdtemp(path.join(os.tmpdir(), 'chee-skool-public-'));
  const result = spawnSync(process.execPath, [buildScript, '--out', out], { cwd: ROOT, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout || 'public build failed');

  for (const required of ['index.html', 'practice.html', 'resources.html', 'passages.html', 'quiz.html', 'test.html', 'progress.html', 'module.html', 'extended-response.html', 'css/site.css', 'js/app.js', 'js/rla-browse.js', 'js/test.js', 'js/question-interactions.js', 'data/generated/question-families.js', 'data/generated/curriculum.json', 'assets/chee-skool-logo.png', 'sw.js', '.nojekyll']) {
    assert.ok(fs.existsSync(path.join(out, required)), `public build is missing ${required}`);
  }
  for (const forbidden of ['builder.html', 'content-studio.html', 'resource-studio.html', 'content-src', 'authoring', 'scripts', 'docs', 'package.json']) {
    assert.ok(!fs.existsSync(path.join(out, forbidden)), `public build must exclude ${forbidden}`);
  }
});

test('release manifest counts match the generated learner artifact', async () => {
  const release = JSON.parse(await fsp.readFile(path.join(ROOT, 'release.json'), 'utf8'));
  const index = JSON.parse(await fsp.readFile(path.join(ROOT, 'data/generated/index.json'), 'utf8'));
  const pdfs = (await fsp.readdir(path.join(ROOT, 'assets/resources'))).filter((name) => name.toLowerCase().endsWith('.pdf'));
  assert.equal(release.generatedModules, index.length, 'release generatedModules count is stale');
  assert.equal(release.learnerResourceFiles, pdfs.length, 'release learnerResourceFiles count is stale');
});
