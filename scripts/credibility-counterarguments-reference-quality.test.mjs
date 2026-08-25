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
    const unit = (domain.units || []).find((item) => item.id === 'credibility-counterarguments');
    if (unit) return unit;
  }
  return null;
}

test('Credibility & Counterarguments reference path teaches claim-specific source fit, limitations, and direct responses', () => {
  const set = json('content-src/sets/set-rla-args-credibility-counterarguments-active-v1.json');
  assert.equal(set.curriculum?.unitId, 'credibility-counterarguments');
  assert.equal(set.curriculum?.primarySkillId, 'R5.9');
  assert.deepEqual(set.curriculum?.secondarySkillIds || [], ['R5.10']);
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
  assert.deepEqual(set.questions.map((q) => q.primarySkillId), ['R5.9', 'R5.10', 'R5.9', 'R5.9', 'R5.10', 'R5.10']);
  assert.deepEqual(set.questions.map((q) => q.familyId), [
    'credibility.source_fit',
    'counterargument.identify',
    'credibility.source_fit',
    'credibility.limit',
    'counterargument.response',
    'counterargument.response',
  ]);
  assert.ok(set.questions.every((q) => [2, 3].includes(q.dok)), 'Credibility/counterargument reference path should stay within DOK 2-3');
});

test('Credibility & Counterarguments reference passage is an original workplace argument with realistic focused length', () => {
  const passage = json('content-src/passages/p-rla-args-credibility-counterarguments-active-equipment-check.json');
  const words = wordCount(passage.text);
  assert.ok(words >= 450 && words <= 550, `expected 450-550 words, got ${words}`);
  assert.equal(passage.textType, 'informational');
  assert.equal(passage.context, 'workplace');
  assert.equal(passage.rights?.status, 'original');
});

test('Credibility & Counterarguments reuses existing resources and keeps food-waste set as Independent Practice', () => {
  execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: ROOT, stdio: 'pipe' });
  const curriculum = json('data/generated/curriculum.json');
  const unit = targetUnit(curriculum);
  assert.ok(unit, 'Credibility & Counterarguments unit missing from curriculum');
  assert.equal(unit.resourceCount, 3, 'existing guide + two workbooks should be reused');
  assert.equal(unit.setCount, 2, 'expected guided path plus existing independent drill');
  assert.equal(unit.questionCount, 14, 'guided six plus existing independent eight should total fourteen questions');
  assert.equal(unit.sets[0]?.id, 'set-rla-args-credibility-counterarguments-active-v1', 'guided path should be first');
  assert.equal(unit.sets[0]?.title, 'Credibility & Counterarguments - Guided Practice');
  assert.equal(unit.sets[1]?.id, 'set-rla-args-credibility-counterarguments');
  assert.equal(unit.sets[1]?.title, 'Credibility & Counterarguments - Independent Practice');
  assert.equal(unit.checkCount, 0, 'Phase 3C must not invent a Skill Check');
});

test('Credibility & Counterarguments independent drill provides transfer for limitation and counterargument-identification families', () => {
  const set = json('content-src/sets/set-rla-args-credibility-counterarguments.json');
  const limitationItem = set.questions.find((q) => q.id === 'q5');
  const identifyItem = set.questions.find((q) => q.id === 'q8');
  assert.equal(limitationItem?.familyId, 'credibility.limit');
  assert.equal(identifyItem?.familyId, 'counterargument.identify');
  assert.match(identifyItem?.prompt || '', /best expresses.*objection|counterargument/i);
});
