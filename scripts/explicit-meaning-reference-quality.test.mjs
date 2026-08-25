import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const json = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

function explicitSkill(curriculum) {
  for (const track of curriculum.tracks || []) {
    for (const domain of track.domains || []) {
      const skill = (domain.skills || []).find((item) => item.id === 'R1.1');
      if (skill) return skill;
    }
  }
  return null;
}

test('Explicit Meaning reference path teaches stated-vs-inferred precision with fading support', () => {
  const set = json('content-src/sets/set-rla-explicit-meaning-active-methods-v1.json');
  assert.equal(set.curriculum?.primarySkillId, 'R1.1');
  assert.deepEqual(set.curriculum?.practiceTags, ['active-learning', 'mock-excluded']);
  assert.deepEqual(set.curriculum?.deliveryRoles, ['practice', 'train']);
  assert.deepEqual(set.questions.map((q) => q.learningStage), [
    'guided', 'guided', 'apply', 'apply', 'independent', 'independent',
  ]);
  assert.deepEqual(set.questions.map((q) => q.type), [
    'drag_sort', 'select_text', 'multiple_choice', 'select_text', 'multiple_choice', 'multiple_choice',
  ]);
  assert.ok(set.questions.slice(0, 2).every((q) => q.hint), 'Guided questions need hints');
  assert.ok(set.questions.slice(2).every((q) => !q.hint), 'Only Guided questions should include hints');
  assert.ok(set.questions.every((q) => ['explicit.fact.locate', 'explicit.detail.match'].includes(q.familyId)));
  assert.ok(set.questions.every((q) => [1, 2].includes(q.dok)), 'Explicit Meaning should stay within DOK 1-2');
});

test('Explicit Meaning reference passage is original, realistic GED-length focused practice, and workplace informational text', () => {
  const passage = json('content-src/passages/p-rla-explicit-meaning-active-equipment-checkout.json');
  const words = wordCount(passage.text);
  assert.ok(words >= 450 && words <= 550, `expected 450-550 words, got ${words}`);
  assert.equal(passage.textType, 'informational');
  assert.equal(passage.context, 'workplace');
  assert.equal(passage.rights?.status, 'original');
});

test('Explicit Meaning reuses existing resources and keeps the old drill as Independent Practice', () => {
  execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: ROOT, stdio: 'pipe' });
  const curriculum = json('data/generated/curriculum.json');
  const skill = explicitSkill(curriculum);
  assert.ok(skill, 'R1.1 missing from curriculum');
  assert.equal(skill.resourceCount, 3, 'existing guide + two workbooks should be reused');
  assert.equal(skill.setCount, 2, 'expected guided path plus existing independent drill');
  assert.equal(skill.sets[0]?.id, 'set-rla-explicit-meaning-active-methods-v1', 'guided path should be first');
  assert.equal(skill.sets[0]?.title, 'Explicit Meaning - Guided Practice');
  assert.equal(skill.sets[1]?.title, 'Explicit Meaning - Independent Practice');
  assert.ok(skill.sets[1]?.file?.endsWith('rla-explicit-meaning-practice-01.json'), 'existing drill was lost');
  assert.equal(skill.checkCount, 1, 'Phase 4 first-wave Check should attach separately');
});
