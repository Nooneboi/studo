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
    const unit = (domain.units || []).find((item) => item.id === 'claims-argument-structure');
    if (unit) return unit;
  }
  return null;
}

test('Claims & Argument Structure reference path teaches role, claim location, support links, paragraph function, and argument chain with fading support', () => {
  const set = json('content-src/sets/set-rla-args-claims-structure-active-v1.json');
  assert.equal(set.curriculum?.unitId, 'claims-argument-structure');
  assert.equal(set.curriculum?.primarySkillId, 'R5.1');
  assert.deepEqual(set.curriculum?.secondarySkillIds, ['R5.2']);
  assert.deepEqual(set.curriculum?.practiceTags, ['active-learning', 'mock-excluded']);
  assert.deepEqual(set.curriculum?.deliveryRoles, ['practice', 'train']);
  assert.deepEqual(set.questions.map((q) => q.learningStage), [
    'guided', 'guided', 'apply', 'apply', 'independent', 'independent',
  ]);
  assert.deepEqual(set.questions.map((q) => q.type), [
    'drag_sort', 'select_text', 'multiple_choice', 'multiple_choice', 'multiple_choice', 'multiple_choice',
  ]);
  assert.ok(set.questions.slice(0, 2).every((q) => q.hint), 'Guided questions need hints');
  assert.ok(set.questions.slice(2).every((q) => !q.hint), 'Only Guided questions should include hints');
  assert.ok(set.questions.every((q) => ['claim.main', 'claim.subclaim', 'argument.chain'].includes(q.familyId)));
  assert.ok(set.questions.every((q) => [2, 3].includes(q.dok)), 'Claims & Argument Structure should stay within DOK 2-3');
});

test('Claims & Argument Structure reference passage is original argumentative informational text with realistic focused length', () => {
  const passage = json('content-src/passages/p-rla-args-claims-active-community-hub.json');
  const words = wordCount(passage.text);
  assert.ok(words >= 450 && words <= 550, `expected 450-550 words, got ${words}`);
  assert.equal(passage.textType, 'informational');
  assert.equal(passage.context, 'community');
  assert.equal(passage.rights?.status, 'original');
});

test('Claims & Argument Structure reuses existing resources and keeps the old drill as Independent Practice', () => {
  execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: ROOT, stdio: 'pipe' });
  const curriculum = json('data/generated/curriculum.json');
  const unit = targetUnit(curriculum);
  assert.ok(unit, 'Claims & Argument Structure unit missing from curriculum');
  assert.equal(unit.resourceCount, 3, 'existing guide + two workbooks should be reused');
  assert.equal(unit.setCount, 2, 'expected guided path plus existing independent drill');
  assert.equal(unit.questionCount, 14, 'guided six plus existing independent eight should total fourteen questions');
  assert.equal(unit.sets[0]?.id, 'set-rla-args-claims-structure-active-v1', 'guided path should be first');
  assert.equal(unit.sets[0]?.title, 'Claims & Argument Structure - Guided Practice');
  assert.equal(unit.sets[1]?.id, 'set-rla-args-claims-structure');
  assert.equal(unit.sets[1]?.title, 'Claims & Argument Structure - Independent Practice');
  assert.equal(unit.checkCount, 0, 'Phase 3A must not invent a Skill Check');
});
