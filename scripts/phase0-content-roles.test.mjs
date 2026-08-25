import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const ALLOWED_ROLES = new Set(['practice', 'train', 'skill_check', 'mock']);
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

function assertRoleContract(curriculum, label) {
  const roles = curriculum?.deliveryRoles;
  assert.ok(Array.isArray(roles) && roles.length > 0, `${label} needs curriculum.deliveryRoles`);
  assert.equal(new Set(roles).size, roles.length, `${label} repeats a delivery role`);
  for (const role of roles) assert.ok(ALLOWED_ROLES.has(role), `${label} uses unknown delivery role ${role}`);
  if (roles.includes('mock')) assert.deepEqual(roles, ['mock'], `${label} mock content must stay unseen and mock-only`);
  assert.equal(roles.includes('mock') && roles.includes('skill_check'), false, `${label} cannot be both Skill Check and Mock`);
}

test('canonical learner content declares explicit delivery roles', () => {
  const setDir = path.join(ROOT, 'content-src/sets');
  for (const name of fs.readdirSync(setDir).filter((name) => name.endsWith('.json'))) {
    const set = readJson(path.join('content-src/sets', name));
    assertRoleContract(set.curriculum, `set ${set.id}`);
  }
  const legacyIndex = readJson('content-src/config/legacy-index.json');
  for (const entry of legacyIndex) assertRoleContract(entry.curriculum, `legacy module ${entry.file}`);
});

test('curriculum build separates Practice sets from dedicated Skill Checks', () => {
  execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: ROOT, stdio: 'pipe' });
  const curriculum = readJson('data/generated/curriculum.json');
  const allSkills = curriculum.tracks.flatMap((track) => track.domains.flatMap((domain) => domain.skills));
  const allUnits = curriculum.tracks.flatMap((track) => track.domains.flatMap((domain) => domain.units || []));
  for (const item of [...allSkills, ...allUnits]) {
    for (const set of item.sets || []) {
      assert.ok(set.curriculum?.deliveryRoles?.includes('practice'), `${set.id} leaked into Practice without practice role`);
    }
    for (const check of item.checks || []) {
      assert.ok(check.curriculum?.deliveryRoles?.includes('skill_check'), `${check.id} leaked into Skill Check without skill_check role`);
      assert.equal(check.curriculum?.deliveryRoles?.includes('mock'), false, `${check.id} Skill Check also leaked into Mock`);
    }
  }
  const allItems = [...allSkills, ...allUnits];
  const uniqueCheckIds = new Set(allItems.flatMap((item) => (item.checks || []).map((check) => check.id)));
  assert.equal(uniqueCheckIds.size, 9, 'Phase 4 should expose exactly nine dedicated Skill Checks');
  assert.ok(allSkills.some((skill) => (skill.sets || []).length > 0), 'Practice content disappeared while separating roles');
});

async function loadLearning() {
  const code = fs.readFileSync(path.join(ROOT, 'js/learning.js'), 'utf8');
  const storage = new Map();
  const context = {
    console,
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Set,
    Map,
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); },
    },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${code}\n;globalThis.__LearningForTest = Learning;`, context, { filename: 'learning.js' });
  return context.__LearningForTest;
}

test('Train selects only modules that explicitly allow the train role', async () => {
  const learning = await loadLearning();
  const makeModule = (id, roles) => ({
    id,
    title: id,
    category: 'reading',
    topic: 'Main idea',
    curriculum: { deliveryRoles: roles },
    questions: [{
      id: 'q1',
      type: 'multiple_choice',
      correct: 'a',
      familyId: 'read.main_idea.central_idea',
      skill: { id: 'R1.2', label: 'Main idea', category: 'reading' },
      options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
    }],
  });
  const plan = learning.buildTrainingPlan([
    makeModule('practice-only', ['practice']),
    makeModule('train-ready', ['practice', 'train']),
    makeModule('mock-only', ['mock']),
  ], { limit: 8 });
  assert.ok(plan.items.length > 0, 'expected at least one Train item');
  assert.deepEqual([...new Set(plan.items.map((item) => item.module.id))], ['train-ready']);
});

async function loadMockEngine() {
  delete globalThis.QuestionInteractions;
  delete globalThis.MockEngine;
  await import(`${pathToFileURL(path.join(ROOT, 'js/question-interactions.js')).href}?roles=${Date.now()}`);
  await import(`${pathToFileURL(path.join(ROOT, 'js/mock-engine.js')).href}?roles=${Date.now()}`);
  return globalThis.MockEngine;
}

test('Mock prefers mock-only content and records temporary Practice fallback explicitly', async () => {
  const engine = await loadMockEngine();
  const blueprint = readJson('content-src/config/rla-mock-v1.json');
  assert.equal(blueprint.selection.allowPracticeFallback, true, 'temporary fallback must be an explicit blueprint decision');

  const generatedModules = readJson('data/generated/index.json').map((entry) => ({
    ...entry,
    ...readJson(path.join('data', entry.file)),
    file: entry.file,
  }));
  const prompts = readJson('data/generated/er-prompts.json').prompts;
  const fallback = engine.generateFullMock({ modules: generatedModules, prompts, blueprint, seed: 'fallback-contract' });
  assert.equal(fallback.bankMode, 'practice_fallback');
  const attempt = engine.createAttempt(fallback, blueprint, 1_000_000, 'fallback-attempt');
  assert.equal(attempt.bankMode, 'practice_fallback');
  assert.equal(engine.sanitizeAttemptForHistory(attempt).bankMode, 'practice_fallback');

  // Mark the complete current bank as mock-only to prove the selector uses the dedicated bank when it exists.
  const mockBank = generatedModules.map((module) => ({
    ...module,
    curriculum: { ...(module.curriculum || {}), deliveryRoles: ['mock'], practiceTags: [] },
  }));
  const dedicated = engine.generateFullMock({ modules: mockBank, prompts, blueprint, seed: 'dedicated-contract' });
  assert.equal(dedicated.bankMode, 'mock_only');
});

test('public build ships exactly the learner modules referenced by generated index', async () => {
  const tmp = await fsp.mkdtemp(path.join(os.tmpdir(), 'chee-public-roles-'));
  const stale = path.join(ROOT, 'data/generated/modules/__stale-unindexed-regression.json');
  try {
    await fsp.writeFile(stale, JSON.stringify({ id: 'stale-demo' }));
    execFileSync(process.execPath, ['scripts/build-public.mjs', '--out', tmp], { cwd: ROOT, stdio: 'pipe' });
    const index = readJson('data/generated/index.json');
    const expected = index.map((entry) => path.basename(entry.file)).sort();
    const actual = (await fsp.readdir(path.join(tmp, 'data/generated/modules'))).filter((name) => name.endsWith('.json')).sort();
    assert.deepEqual(actual, expected, 'public build contains stale/unindexed learner modules');
  } finally {
    await fsp.rm(stale, { force: true });
    await fsp.rm(tmp, { recursive: true, force: true });
  }
});

test('Mock results disclose when the temporary Practice-bank fallback was used', () => {
  const js = fs.readFileSync(path.join(ROOT, 'js/test.js'), 'utf8');
  assert.match(js, /practice_fallback/);
  assert.match(js, /Practice bank/i);
  assert.match(js, /not an independent readiness measure/i);
});
