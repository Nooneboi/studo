import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const readJson = (file) => JSON.parse(read(file));

function generatedModules() {
  return readJson('data/generated/index.json').map((entry) => ({
    entry,
    module: readJson(path.join('data', entry.file)),
  }));
}

test('Phase 4 inventory remains 112 modules / 807 questions underneath the additive Phase 5 Mock bank', () => {
  const items = generatedModules();
  const phase4Items = items.filter(({ module }) => !(module.contentMeta?.curriculum?.deliveryRoles || []).includes('mock'));
  const mockItems = items.filter(({ module }) => (module.contentMeta?.curriculum?.deliveryRoles || []).includes('mock'));
  const questionCount = phase4Items.reduce((sum, item) => sum + (item.module.questions || []).length, 0);
  const checks = phase4Items.filter(({ module }) => (module.contentMeta?.curriculum?.deliveryRoles || []).includes('skill_check'));
  const quickReview = readJson('data/generated/quick-review.json');
  assert.equal(phase4Items.length, 112);
  assert.equal(questionCount, 807);
  assert.equal(checks.length, 9);
  assert.equal(checks.reduce((sum, item) => sum + item.module.questions.length, 0), 54);
  assert.equal(quickReview.cards.length, 28);
  assert.equal(mockItems.length, 21);
  assert.equal(mockItems.reduce((sum, item) => sum + item.module.questions.length, 0), 138);
  assert.equal(items.length, 133);
});

test('Practice, Train, Skill Check, Quick Review, and Mock remain role-isolated', () => {
  const items = generatedModules();
  const checks = items.filter(({ module }) => (module.contentMeta?.curriculum?.deliveryRoles || []).includes('skill_check'));
  for (const { module } of checks) {
    const curriculum = module.contentMeta.curriculum;
    assert.deepEqual(curriculum.deliveryRoles, ['skill_check']);
    assert.ok(curriculum.practiceTags?.includes('mock-excluded'));
    assert.equal(curriculum.deliveryRoles.includes('practice'), false);
    assert.equal(curriculum.deliveryRoles.includes('train'), false);
    assert.equal(curriculum.deliveryRoles.includes('mock'), false);
  }
  const mocks = items.filter(({ module }) => (module.contentMeta?.curriculum?.deliveryRoles || []).includes('mock'));
  assert.equal(mocks.length, 21, 'Phase 5 dedicated Mock bank must remain isolated and additive');
  for (const { module } of mocks) {
    const roles = module.contentMeta?.curriculum?.deliveryRoles || [];
    assert.deepEqual(roles, ['mock']);
    assert.equal(roles.includes('practice'), false);
    assert.equal(roles.includes('train'), false);
    assert.equal(roles.includes('skill_check'), false);
  }
  const quick = read('js/quick-review.js');
  assert.doesNotMatch(quick, /Learning\.recordAttempt/);
  assert.doesNotMatch(quick, /Learning\.setMistakeReason/);
  const skill = read('js/skill.js');
  assert.match(skill, /if \(!checks\.length\) return ""/);
  const progress = read('js/progress.js');
  assert.match(progress, />Evidence<\/small>/);
  assert.match(progress, />Practice<\/strong>/);
  assert.match(progress, /Latest Skill Check/);
});

test('Phase 4 learner flow is documented in the intended order', () => {
  const status = read('STUDO_MASTER_STATUS.md');
  assert.match(status, /Learn\s*→\s*Practice\s*→\s*Train\s*→\s*Skill Check\s*→\s*Mock\s*→\s*Progress/);
});

test('Phase 4 closeout review exists and states the evidence boundary', () => {
  const reviewPath = 'docs/superpowers/reviews/2026-08-25-phase4-closeout-review.md';
  assert.ok(fs.existsSync(reviewPath), 'Phase 4 closeout review missing');
  const review = read(reviewPath);
  assert.match(review, /Practice teaches/i);
  assert.match(review, /Train strengthens/i);
  assert.match(review, /Skill Check/i);
  assert.match(review, /Quick Review/i);
  assert.match(review, /Phase 5/i);
  assert.match(review, /does not.*GED score|not.*GED score/is);
});

test('current alpha metadata stays synchronized after the additive Phase 5 bank', () => {
  const release = readJson('release.json');
  const releaseMatch = release.release.match(/^0\.7\.0-alpha\.(\d+)$/);
  assert.ok(releaseMatch, 'release stays on the 0.7.0 alpha line');
  assert.ok(Number(releaseMatch[1]) >= 29, 'later alpha releases must preserve the Phase 4 closeout baseline');
  assert.equal(release.generatedModules, 133);
  assert.equal(release.learnerResourceFiles, 152);
  const builder = read('scripts/build-public.mjs');
  assert.match(builder, /check\.html/);
  assert.match(builder, /check\.js/);
  assert.match(builder, /quick-review\.js/);
  assert.match(builder, /quick-review\.json/);
  const releasePattern = new RegExp(`<meta name=\"studo-release\" content=\"${release.release.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\">`);
  for (const page of ['check.html', 'train.html', 'progress.html', 'skill.html']) {
    assert.match(read(page), releasePattern);
  }
});
