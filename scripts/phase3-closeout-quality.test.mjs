import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const HARDENING_IDS = new Set([
  'set-rla-args-transfer-evidence-relevance',
  'set-rla-args-transfer-assumptions',
  'set-rla-lang-transfer-agreement-pronouns',
]);
const moduleId = (item) => path.basename(item.file || '', '.json');

test('Phase 3 learner baseline remains intact while later assessment roles stay additive', () => {
  const index = json('data/generated/index.json');
  const phase3LearnerModules = index.filter((item) => {
    const roles = item.curriculum?.deliveryRoles || [];
    return !roles.includes('skill_check') && !roles.includes('mock');
  });
  const checks = index.filter((item) => (item.curriculum?.deliveryRoles || []).includes('skill_check'));
  const mocks = index.filter((item) => (item.curriculum?.deliveryRoles || []).includes('mock'));
  const hardeningModules = phase3LearnerModules.filter((item) => HARDENING_IDS.has(moduleId(item)));
  const phase3Baseline = phase3LearnerModules.filter((item) => !HARDENING_IDS.has(moduleId(item)));
  assert.equal(phase3Baseline.length, 103, 'Phase 3 learner-role baseline must remain intact');
  assert.deepEqual(hardeningModules.map(moduleId).sort(), [...HARDENING_IDS].sort(), 'only the three approved pre-pilot transfer modules may extend the learner-role baseline here');
  assert.equal(checks.length, 9);
  assert.equal(mocks.length, 21);
});

test('Phase 3 Language calibration remains intact underneath the approved alpha.33 transfer module', () => {
  const index = json('data/generated/index.json');
  const language = index.filter((item) => /^L/.test(item.curriculum?.primarySkillId || '') && !(item.curriculum?.deliveryRoles || []).includes('mock'));
  const hardening = language.filter((item) => HARDENING_IDS.has(moduleId(item)));
  const baseline = language.filter((item) => !HARDENING_IDS.has(moduleId(item)));
  assert.equal(baseline.length, 13);
  assert.deepEqual(hardening.map(moduleId), ['set-rla-lang-transfer-agreement-pronouns']);

  function difficultySummary(items) {
    const counts = { easy: 0, medium: 0, hard: 0 };
    let questions = 0;
    for (const item of items) {
      const module = json(path.join('data', item.file));
      for (const q of module.questions || []) {
        questions += 1;
        const difficulty = q.metadata?.difficulty || q.difficulty;
        if (difficulty in counts) counts[difficulty] += 1;
      }
    }
    return { questions, counts };
  }

  assert.deepEqual(difficultySummary(baseline), { questions: 92, counts: { easy: 7, medium: 79, hard: 6 } });
  assert.deepEqual(difficultySummary(hardening), { questions: 8, counts: { easy: 0, medium: 7, hard: 1 } });
});

test('Phase 3 ER closeout exposes six learner-safe production tasks and ten full prompts', () => {
  const tasksPayload = json('data/generated/er-production-tasks.json');
  const promptsPayload = json('data/generated/er-prompts.json');
  const tasks = Array.isArray(tasksPayload) ? tasksPayload : tasksPayload.tasks;
  const prompts = Array.isArray(promptsPayload) ? promptsPayload : promptsPayload.prompts;
  assert.equal(tasks.length, 6);
  assert.equal(prompts.length, 10);
  assert.doesNotMatch(JSON.stringify(tasksPayload), /authoringNotes/);
  assert.doesNotMatch(JSON.stringify(promptsPayload), /authoringKey|strongerSource/);
  const domain = read('js/domain.js');
  assert.match(domain, /Production Lab/);
  assert.match(domain, /Full Extended Response Practice/);
});

test('fresh Progress has one direct Practice start instead of a Train detour', () => {
  const js = read('js/progress.js');
  const emptyState = js.match(/if \(!summary\.attempts[\s\S]*?return;\n\s*}/)?.[0] || '';
  assert.match(emptyState, /href=["']practice\.html["']/);
  assert.match(emptyState, /Start Practice/i);
  assert.doesNotMatch(emptyState, /href=["']train\.html["']|Start Train Me/i);
});
