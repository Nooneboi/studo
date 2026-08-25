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

function summarySkill(curriculum) {
  for (const track of curriculum.tracks || []) {
    for (const domain of track.domains || []) {
      const skill = (domain.skills || []).find((item) => item.id === 'R1.4');
      if (skill) return skill;
    }
  }
  return null;
}

test('Summary reference path teaches compression, scope, and relationship preservation with fading support', () => {
  const set = json('content-src/sets/set-rla-summary-active-methods-v1.json');
  assert.equal(set.curriculum?.primarySkillId, 'R1.4');
  assert.deepEqual(set.curriculum?.practiceTags, ['active-learning', 'mock-excluded']);
  assert.deepEqual(set.curriculum?.deliveryRoles, ['practice', 'train']);
  assert.deepEqual(set.questions.map((q) => q.learningStage), [
    'guided', 'guided', 'apply', 'apply', 'independent', 'independent',
  ]);
  assert.deepEqual(set.questions.map((q) => q.type), [
    'drag_sort', 'multiple_choice', 'drag_sort', 'drag_sort', 'multiple_choice', 'multiple_choice',
  ]);
  assert.ok(set.questions.slice(0, 2).every((q) => q.hint), 'Guided questions need hints');
  assert.ok(set.questions.slice(2).every((q) => !q.hint), 'Only Guided questions should include hints');
  assert.ok(set.questions.every((q) => ['summary.whole', 'summary.section'].includes(q.familyId)));
  assert.ok(set.questions.every((q) => q.dok === 2), 'Summary reference path should stay at DOK 2 rather than drift into inference');
});

test('Summary reference passage is original, GED-length informational social-studies practice', () => {
  const passage = json('content-src/passages/p-rla-summary-active-freight-yard.json');
  const words = wordCount(passage.text);
  assert.ok(words >= 500 && words <= 600, `expected 500-600 words, got ${words}`);
  assert.equal(passage.textType, 'informational');
  assert.equal(passage.context, 'social_studies');
  assert.equal(passage.rights?.status, 'original');
});

test('Summary reuses existing resources and keeps the old drill as Independent Practice', () => {
  execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: ROOT, stdio: 'pipe' });
  const curriculum = json('data/generated/curriculum.json');
  const skill = summarySkill(curriculum);
  assert.ok(skill, 'R1.4 missing from curriculum');
  assert.equal(skill.resourceCount, 3, 'existing guide + two workbooks should be reused');
  assert.equal(skill.setCount, 2, 'expected guided path plus existing independent drill');
  assert.equal(skill.sets[0]?.id, 'set-rla-summary-active-methods-v1', 'guided path should be first');
  assert.equal(skill.sets[0]?.title, 'Summary - Guided Practice');
  assert.equal(skill.sets[1]?.title, 'Summary - Independent Practice');
  assert.ok(skill.sets[1]?.file?.endsWith('rla-summary-practice-01.json'), 'existing Summary drill was lost');
  assert.equal(skill.checkCount, 1, 'Phase 4 first-wave Check should attach separately');
});
