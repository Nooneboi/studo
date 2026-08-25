import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from './validate-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GENERATED = path.join(ROOT, 'data', 'generated');
const CONFIG = path.join(ROOT, 'content-src', 'config', 'rla.curriculum.json');

async function json(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }

const ARG_SKILLS = [
  'R5.1','R5.2','R5.3','R5.4','R5.5','R5.6','R5.7','R5.8','R5.9','R5.10',
  'R6.1','R6.2','R6.3','R6.4','R6.5'
];

function argumentIssue(issue) {
  const file = String(issue.file || '');
  return file.includes('set-rla-args-') || file.includes('p-rla-args-') || file.includes('arguments-');
}

test('Arguments config defines exactly 9 learner units and maps all 15 R5/R6 skills once', async () => {
  const config = await json(CONFIG);
  const track = config.tracks.find((x) => x.id === 'arguments');
  assert.ok(track, 'Arguments track missing');
  const units = track.domains.flatMap((d) => d.units || []);
  assert.equal(units.length, 9, `expected 9 units, found ${units.length}`);
  const mapped = units.flatMap((u) => u.skillIds || []);
  assert.deepEqual([...mapped].sort(), [...ARG_SKILLS].sort());
  assert.equal(new Set(mapped).size, ARG_SKILLS.length, 'an internal skill is mapped more than once');
});

test('generated Arguments curriculum exposes 9 learner units while retaining internal skills', async () => {
  const curriculum = await json(path.join(GENERATED, 'curriculum.json'));
  const track = curriculum.tracks.find((x) => x.id === 'arguments');
  assert.ok(track, 'generated Arguments track missing');
  assert.equal(track.domains.flatMap((d) => d.units || []).length, 9);
  assert.equal(track.domains.flatMap((d) => d.skills || []).length, 15);
});

test('each Arguments unit keeps its resource baseline while Phase 3 reference units add guided paths', async () => {
  const curriculum = await json(path.join(GENERATED, 'curriculum.json'));
  const track = curriculum.tracks.find((x) => x.id === 'arguments');
  assert.ok(track);
  for (const unit of track.domains.flatMap((d) => d.units || [])) {
    const guides = (unit.resources || []).filter((r) => r.type === 'study_guide');
    const workbooks = (unit.resources || []).filter((r) => r.type === 'worksheet');
    assert.equal(guides.length, 1, `${unit.id} guide count`);
    assert.equal(workbooks.length, 2, `${unit.id} workbook count`);
    assert.equal((unit.checks || []).length, 0, `${unit.id} must not relabel focused Practice as a Skill Check`);
    if (['claims-argument-structure', 'finding-evidence', 'credibility-counterarguments'].includes(unit.id)) {
      assert.equal((unit.sets || []).length, 2, `${unit.id} guided + independent Practice module count`);
      assert.equal(unit.questionCount, 14, `${unit.id} guided + independent question count`);
    } else {
      assert.equal((unit.sets || []).length, 1, `${unit.id} focused Practice module count`);
      assert.equal(unit.questionCount, 8, `${unit.id} focused question count`);
    }
  }
});

test('Arguments mixed practice has required source-format coverage', async () => {
  const curriculum = await json(path.join(GENERATED, 'curriculum.json'));
  const sets = curriculum.argumentPractice || [];
  assert.ok(sets.length >= 6, `expected at least 6 mixed sets, found ${sets.length}`);
  const tags = sets.flatMap((s) => s.curriculum?.practiceTags || []);
  assert.ok(tags.filter((x) => x === 'paired_sources').length >= 3, 'need at least 3 paired-source sets');
  assert.ok(tags.includes('text_data'), 'need a text+data set');
  assert.ok(tags.includes('different_formats'), 'need a different-format set');
  assert.ok(tags.filter((x) => x === 'argument_strength').length >= 2, 'need at least two argument-strength bridge sets');
  let questionTotal = 0;
  for (const entry of sets) {
    const module = await json(path.join(ROOT, 'data', entry.file));
    const words = String(module.passage || '').trim().split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 400 && words <= 900, `${entry.title} source material is ${words} words`);
    questionTotal += (module.questions || []).length;
  }
  assert.ok(questionTotal >= 36 && questionTotal <= 48, `mixed question total ${questionTotal}`);
});

test('published Arguments bank has no answer-pattern or generic-feedback warnings', async () => {
  const result = await validateContent({ quiet: true });
  const bad = result.warnings.filter((issue) => argumentIssue(issue) && [
    'ANSWER_POSITION_PATTERN','ANSWER_POSITION_RUN','ANSWER_POSITION_BIAS','WHY_WRONG_REUSED'
  ].includes(issue.code));
  assert.deepEqual(bad, [], bad.map((x) => `${x.code} ${x.file}`).join('\n'));
});

test('Arguments generated resource and module references resolve', async () => {
  const curriculum = await json(path.join(GENERATED, 'curriculum.json'));
  const track = curriculum.tracks.find((x) => x.id === 'arguments');
  assert.ok(track);
  for (const domain of track.domains) {
    for (const unit of domain.units || []) {
      for (const record of [...(unit.sets || []), ...(unit.checks || [])]) await fs.access(path.join(ROOT, 'data', record.file));
      for (const resource of unit.resources || []) await fs.access(path.join(ROOT, resource.href));
    }
  }
  for (const record of curriculum.argumentPractice || []) await fs.access(path.join(ROOT, 'data', record.file));
});

test('Arguments domain page exposes learner-visible Mixed Source Practice', async () => {
  const source = await fs.readFile(path.join(ROOT, 'js', 'domain.js'), 'utf8');
  assert.match(source, /curriculum\.argumentPractice/);
  assert.match(source, /Mixed Source Practice/);
});
