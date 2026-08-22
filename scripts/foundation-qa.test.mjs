import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateContent } from './validate-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LEGACY_DIR = path.join(ROOT, 'content-src', 'legacy-modules');
const LEGACY_INDEX = path.join(ROOT, 'content-src', 'config', 'legacy-index.json');
const GENERATED = path.join(ROOT, 'data', 'generated');

async function json(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function runNode(script, args = []) {
  return spawnSync(process.execPath, [script, ...args], { cwd: ROOT, encoding: 'utf8' });
}

test('canonical legacy learner inventory lives under content-src', async () => {
  const entries = await json(LEGACY_INDEX);
  assert.equal(entries.length, 50, 'expected all 50 non-schema-v2 learner entries to be canonicalized');
  const files = (await fs.readdir(LEGACY_DIR)).filter((name) => name.endsWith('.json'));
  assert.equal(files.length, 50, 'expected one canonical runtime module per legacy learner entry');
  for (const entry of entries) {
    assert.match(entry.sourceFile || '', /^legacy-modules\//, `legacy entry ${entry.title} needs a canonical sourceFile`);
    const source = path.join(ROOT, 'content-src', entry.sourceFile);
    await fs.access(source);
  }
});

test('clean build recreates learner inventory without previous generated output', async () => {
  const baselineIndex = await json(path.join(GENERATED, 'index.json'));
  const baselineCurriculum = await json(path.join(GENERATED, 'curriculum.json'));
  const baselineReading = baselineCurriculum.tracks.find((track) => track.id === 'reading');
  const backupRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'studo-generated-'));
  const backup = path.join(backupRoot, 'generated');
  await fs.cp(GENERATED, backup, { recursive: true });
  try {
    await fs.rm(GENERATED, { recursive: true, force: true });
    const result = runNode('scripts/build-content.mjs');
    assert.equal(result.status, 0, `clean build failed:\n${result.stdout}\n${result.stderr}`);
    const rebuiltIndex = await json(path.join(GENERATED, 'index.json'));
    const rebuiltCurriculum = await json(path.join(GENERATED, 'curriculum.json'));
    const rebuiltReading = rebuiltCurriculum.tracks.find((track) => track.id === 'reading');
    assert.equal(rebuiltIndex.length, baselineIndex.length, 'clean build must recreate the full current learner index before publication filtering is introduced');
    assert.equal(rebuiltReading?.totalSkillCount, baselineReading?.totalSkillCount, 'Reading skill inventory must survive a clean build');
    assert.equal(rebuiltReading?.resourceCount, baselineReading?.resourceCount, 'Reading resource inventory must survive a clean build');
    assert.equal(rebuiltCurriculum.passagePractice?.length, baselineCurriculum.passagePractice?.length, 'Passage Practice inventory must survive a clean build');
  } finally {
    await fs.rm(GENERATED, { recursive: true, force: true });
    await fs.cp(backup, GENERATED, { recursive: true });
    await fs.rm(backupRoot, { recursive: true, force: true });
  }
});

test('all completed RLA tracks publish while retired prototypes stay out of learner navigation', async () => {
  const result = runNode('scripts/build-content.mjs');
  assert.equal(result.status, 0, `build failed:\n${result.stdout}\n${result.stderr}`);
  const curriculum = await json(path.join(GENERATED, 'curriculum.json'));
  assert.deepEqual(curriculum.tracks.map((track) => track.id), ['reading', 'arguments', 'language', 'extended-response']);
  assert.equal(curriculum.tracks.some((track) => track.id === 'language'), true);
  assert.equal(curriculum.tracks.some((track) => track.id === 'extended-response'), true);
  const index = await json(path.join(GENERATED, 'index.json'));
  const files = new Set(index.map((entry) => entry.file));
  assert.equal([...files].some((file) => file === 'generated/modules/set-rla-lang-word-choice.json'), true, 'published Language module missing from learner index');
  assert.equal(files.has('generated/modules/grammar-practice.json'), false);
  assert.equal(files.has('generated/modules/grammar-transfer-practice.json'), false);
  assert.equal(files.has('generated/modules/writing-practice.json'), false);
  await assert.rejects(fs.access(path.join(GENERATED, 'modules', 'grammar-practice.json')), /ENOENT/);
  await assert.rejects(fs.access(path.join(GENERATED, 'modules', 'grammar-transfer-practice.json')), /ENOENT/);
  await assert.rejects(fs.access(path.join(GENERATED, 'modules', 'writing-practice.json')), /ENOENT/);
});


async function withLegacyFixture(name, module, entry, callback) {
  const fixtureFile = path.join(LEGACY_DIR, name);
  const originalIndexText = await fs.readFile(LEGACY_INDEX, 'utf8');
  const originalIndex = JSON.parse(originalIndexText);
  const fixtureEntry = {
    file: `generated/modules/${name}`,
    sourceFile: `legacy-modules/${name}`,
    title: module.title || 'QA fixture',
    description: module.description || 'QA fixture',
    ...(entry || {}),
  };
  try {
    await fs.writeFile(fixtureFile, JSON.stringify(module, null, 2) + '\n', 'utf8');
    await fs.writeFile(LEGACY_INDEX, JSON.stringify([...originalIndex, fixtureEntry], null, 2) + '\n', 'utf8');
    return await callback();
  } finally {
    await fs.rm(fixtureFile, { force: true });
    await fs.writeFile(LEGACY_INDEX, originalIndexText, 'utf8');
  }
}

function legacyFixture(overrides = {}) {
  return {
    id: 'qa-fixture-module',
    title: 'QA fixture module',
    description: 'Fixture used only by automated validation tests.',
    subject: 'rla',
    category: 'reading',
    topic: 'QA',
    difficulty: 'medium',
    source: 'Original content by Studo',
    passage: 'This fixture passage contains enough words to make validation realistic without becoming learner content. It exists only during an automated test and is removed immediately afterward.',
    questions: [{
      id: 'q1',
      type: 'multiple_choice',
      prompt: 'Which option is correct?',
      explanation: 'B is correct because the passage supports it.',
      skill: { id: 'R1.1', label: 'Explicit meaning' },
      metadata: { skillId: 'R1.1', secondarySkillIds: [], dok: 1, difficulty: 'medium', difficultyProfile: { reasoningDepth: 1, distractorSimilarity: 2 } },
      options: [
        { id: 'a', text: 'First option', whyWrong: 'The passage does not support this choice.' },
        { id: 'b', text: 'Second option' },
        { id: 'c', text: 'Third option', whyWrong: 'The passage does not support this choice.' },
        { id: 'd', text: 'Fourth option', whyWrong: 'The passage does not support this choice.' },
      ],
      correct: ['b'],
    }],
    contentMeta: {
      sourceSetId: 'set-qa-fixture-module',
      curriculum: { domain: 'Core Meaning', primarySkillId: 'R1.1', secondarySkillIds: [], contentKind: 'skill_drill', learningObjective: 'Test validation behavior.' },
      passage: { id: 'p-qa-fixture', title: 'QA fixture passage', textType: 'informational', context: 'qa', sourceType: 'original', attribution: 'Original content by Studo' },
    },
    ...overrides,
  };
}

test('legacy validation blocks answer-letter mismatches and duplicate options', async () => {
  const module = legacyFixture();
  module.questions[0].correct = ['d'];
  module.questions[0].options[2].text = 'First option';
  await withLegacyFixture('__qa-answer-mismatch.json', module, { curriculum: module.contentMeta.curriculum }, async () => {
    const result = await validateContent({ quiet: true });
    const codes = new Set(result.errors.map((issue) => issue.code));
    assert.equal(codes.has('ANSWER_LETTER_MISMATCH'), true, 'expected explanation letter mismatch to block publication');
    assert.equal(codes.has('OPTION_TEXT_DUPLICATE'), true, 'expected duplicate option text to block publication');
  });
});

test('legacy validation blocks missing correct options, unknown skills, and missing core metadata', async () => {
  const module = legacyFixture({ title: '' });
  module.questions[0].correct = ['z'];
  module.contentMeta.curriculum.primarySkillId = 'R9.9';
  await withLegacyFixture('__qa-invalid-core.json', module, { curriculum: module.contentMeta.curriculum }, async () => {
    const result = await validateContent({ quiet: true });
    const codes = new Set(result.errors.map((issue) => issue.code));
    assert.equal(codes.has('LEGACY_CORE_METADATA_MISSING'), true);
    assert.equal(codes.has('CORRECT_NOT_IN_OPTIONS'), true);
    assert.equal(codes.has('LEGACY_SKILL_UNKNOWN'), true);
  });
});

test('build writes a machine-readable QA report grouped by code and file', async () => {
  const result = runNode('scripts/build-content.mjs');
  assert.equal(result.status, 0, `build failed:\n${result.stdout}\n${result.stderr}`);
  const report = await json(path.join(GENERATED, 'qa-report.json'));
  assert.equal(typeof report.summary?.byCode, 'object');
  assert.equal(typeof report.summary?.warnings, 'number');
  for (const group of Object.values(report.summary.byCode)) {
    assert.equal(typeof group.warnings, 'number');
    assert.ok(Array.isArray(group.files));
    if (group.warnings > 0) assert.ok(group.files.length > 0);
  }
});

function stripBuildTimestamps(value) {
  if (Array.isArray(value)) return value.map(stripBuildTimestamps);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === 'builtAt' || key === 'compiledAt') continue;
    out[key] = stripBuildTimestamps(child);
  }
  return out;
}

async function generatedJsonSnapshot() {
  const files = [];
  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.json')) files.push(full);
    }
  }
  await walk(GENERATED);
  files.sort();
  const snapshot = {};
  for (const file of files) {
    snapshot[path.relative(GENERATED, file)] = stripBuildTimestamps(await json(file));
  }
  return snapshot;
}

test('two source-only builds are semantically reproducible', async () => {
  let result = runNode('scripts/build-content.mjs');
  assert.equal(result.status, 0, `first build failed:\n${result.stdout}\n${result.stderr}`);
  const first = await generatedJsonSnapshot();
  result = runNode('scripts/build-content.mjs');
  assert.equal(result.status, 0, `second build failed:\n${result.stdout}\n${result.stderr}`);
  const second = await generatedJsonSnapshot();
  assert.deepEqual(second, first);
});
