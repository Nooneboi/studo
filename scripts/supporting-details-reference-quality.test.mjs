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

function supportingSkill(curriculum) {
  for (const track of curriculum.tracks || []) {
    for (const domain of track.domains || []) {
      const skill = (domain.skills || []).find((item) => item.id === 'R1.3');
      if (skill) return skill;
    }
  }
  return null;
}

test('Supporting Details reference path uses a skill-specific guided progression', () => {
  const set = json('content-src/sets/set-rla-supporting-details-active-methods-v1.json');
  assert.equal(set.curriculum?.primarySkillId, 'R1.3');
  assert.deepEqual(set.curriculum?.practiceTags, ['active-learning', 'mock-excluded']);
  assert.deepEqual(set.curriculum?.deliveryRoles, ['practice', 'train']);
  assert.deepEqual(set.questions.map((q) => q.learningStage), [
    'guided', 'guided', 'apply', 'apply', 'independent', 'independent',
  ]);
  assert.deepEqual(set.questions.map((q) => q.type), [
    'drag_sort', 'select_text', 'evidence_based', 'drag_sort', 'select_text', 'evidence_based',
  ]);
  assert.ok(set.questions.slice(0, 2).every((q) => q.hint), 'Guided questions need hints');
  assert.ok(set.questions.slice(4).every((q) => !q.hint), 'Independent questions must not include hints');
  assert.ok(set.questions.every((q) => ['support.best_detail', 'support.relevant_vs_mentioned'].includes(q.familyId)));
});

test('Supporting Details reference passage is original, GED-length, and adds community/civics transfer', () => {
  const passage = json('content-src/passages/p-rla-supporting-details-active-market-street.json');
  const words = wordCount(passage.text);
  assert.ok(words >= 400 && words <= 900, `expected 400-900 words, got ${words}`);
  assert.equal(passage.textType, 'informational');
  assert.equal(passage.context, 'community_civics');
  assert.equal(passage.rights?.status, 'original');
});

test('Supporting Details keeps its existing resources and transfer drill while prioritizing the guided path', () => {
  execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: ROOT, stdio: 'pipe' });
  const curriculum = json('data/generated/curriculum.json');
  const skill = supportingSkill(curriculum);
  assert.ok(skill, 'R1.3 missing from curriculum');
  assert.equal(skill.resourceCount, 3, 'existing guide + two workbooks should be reused');
  assert.equal(skill.setCount, 2, 'expected guided path plus existing transfer drill');
  assert.equal(skill.sets[0]?.id, 'set-rla-supporting-details-active-methods-v1', 'guided path should be the first interactive choice');
  assert.ok(skill.sets.some((set) => set.file?.endsWith('rla-supporting-details-practice-01.json')), 'existing multi-context practice drill was lost');
  assert.equal(skill.sets[1]?.title, 'Supporting Details - Independent Practice', 'follow-up practice should have a clear learner-facing role');
  assert.equal(skill.checkCount, 0, 'Phase 1 must not invent a Skill Check');
});
