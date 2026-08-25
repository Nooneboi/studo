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

function targetUnit(curriculum) {
  const track = (curriculum.tracks || []).find((item) => item.id === 'arguments');
  for (const domain of track?.domains || []) {
    const unit = (domain.units || []).find((item) => item.id === 'finding-evidence');
    if (unit) return unit;
  }
  return null;
}

test('Finding Evidence reference path teaches exact claim-to-evidence matching with fading support', () => {
  const set = json('content-src/sets/set-rla-args-finding-evidence-active-v1.json');
  assert.equal(set.curriculum?.unitId, 'finding-evidence');
  assert.equal(set.curriculum?.primarySkillId, 'R5.3');
  assert.deepEqual(set.curriculum?.secondarySkillIds || [], []);
  assert.deepEqual(set.curriculum?.practiceTags, ['active-learning', 'mock-excluded']);
  assert.deepEqual(set.curriculum?.deliveryRoles, ['practice', 'train']);
  assert.deepEqual(set.questions.map((q) => q.learningStage), [
    'guided', 'guided', 'apply', 'apply', 'independent', 'independent',
  ]);
  assert.deepEqual(set.questions.map((q) => q.type), [
    'drag_sort', 'select_text', 'drag_sort', 'multiple_choice', 'multiple_choice', 'multiple_choice',
  ]);
  assert.ok(set.questions.slice(0, 2).every((q) => q.hint), 'Guided questions need hints');
  assert.ok(set.questions.slice(2).every((q) => !q.hint), 'Only Guided questions should include hints');
  assert.ok(set.questions.every((q) => q.primarySkillId === 'R5.3'));
  assert.ok(set.questions.every((q) => ['evidence.identify_role', 'evidence.strongest'].includes(q.familyId)));
  assert.ok(set.questions.every((q) => [2, 3].includes(q.dok)), 'Finding Evidence should stay within DOK 2-3');
});

test('Finding Evidence reference passage is original workplace argument with realistic focused length', () => {
  const passage = json('content-src/passages/p-rla-args-finding-evidence-active-staggered-start.json');
  const words = wordCount(passage.text);
  assert.ok(words >= 450 && words <= 550, `expected 450-550 words, got ${words}`);
  assert.equal(passage.textType, 'informational');
  assert.equal(passage.context, 'workplace');
  assert.equal(passage.rights?.status, 'original');
});

test('Finding Evidence reuses existing resources and keeps the tutoring drill as Independent Practice', () => {
  execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: ROOT, stdio: 'pipe' });
  const curriculum = json('data/generated/curriculum.json');
  const unit = targetUnit(curriculum);
  assert.ok(unit, 'Finding Evidence unit missing from curriculum');
  assert.equal(unit.resourceCount, 3, 'existing guide + two workbooks should be reused');
  assert.equal(unit.setCount, 2, 'expected guided path plus existing independent drill');
  assert.equal(unit.questionCount, 14, 'guided six plus existing independent eight should total fourteen questions');
  assert.equal(unit.sets[0]?.id, 'set-rla-args-finding-evidence-active-v1', 'guided path should be first');
  assert.equal(unit.sets[0]?.title, 'Finding Evidence - Guided Practice');
  assert.equal(unit.sets[1]?.id, 'set-rla-args-finding-evidence');
  assert.equal(unit.sets[1]?.title, 'Finding Evidence - Independent Practice');
  assert.equal(unit.checkCount, 0, 'Phase 3B must not invent a Skill Check');
});

test('Finding Evidence independent drill uses canonical evidence-role metadata where the item asks evidence versus claim', () => {
  const set = json('content-src/sets/set-rla-args-finding-evidence.json');
  const roleItem = set.questions.find((q) => q.id === 'q7');
  assert.ok(roleItem, 'q7 role-identification item missing');
  assert.equal(roleItem.familyId, 'evidence.identify_role');
});
