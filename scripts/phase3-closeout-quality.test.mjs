import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const json = (p) => JSON.parse(read(p));

test('Phase 3 closeout keeps the verified learner-bank counts and role boundary', () => {
  const release = json('release.json');
  const index = json('data/generated/index.json');
  assert.equal(release.release, '0.7.0-alpha.26');
  assert.equal(index.length, 103);
  assert.equal(release.generatedModules, 103);
  const roles = index.flatMap((item) => item.curriculum?.deliveryRoles || []);
  assert.equal(roles.filter((r) => r === 'skill_check').length, 0);
  assert.equal(roles.filter((r) => r === 'mock').length, 0);
});

test('Phase 3 Language closeout has real calibrated easy-medium-hard coverage without module expansion', () => {
  const index = json('data/generated/index.json');
  const language = index.filter((item) => /^L/.test(item.curriculum?.primarySkillId || ''));
  assert.equal(language.length, 13);
  const counts = { easy: 0, medium: 0, hard: 0 };
  let questions = 0;
  for (const item of language) {
    const module = json(path.join('data', item.file));
    for (const q of module.questions || []) {
      questions += 1;
      const difficulty = q.metadata?.difficulty || q.difficulty;
      if (difficulty in counts) counts[difficulty] += 1;
    }
  }
  assert.equal(questions, 92);
  assert.deepEqual(counts, { easy: 7, medium: 79, hard: 6 });
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
