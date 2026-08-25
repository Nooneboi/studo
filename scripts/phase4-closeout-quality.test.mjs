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

test('Phase 4 inventory is exactly 112 modules / 807 questions / 9 dedicated Checks / 28 Quick Review cards', () => {
  const items = generatedModules();
  const questionCount = items.reduce((sum, item) => sum + (item.module.questions || []).length, 0);
  const checks = items.filter(({ module }) => (module.contentMeta?.curriculum?.deliveryRoles || []).includes('skill_check'));
  const quickReview = readJson('data/generated/quick-review.json');
  assert.equal(items.length, 112);
  assert.equal(questionCount, 807);
  assert.equal(checks.length, 9);
  assert.equal(checks.reduce((sum, item) => sum + item.module.questions.length, 0), 54);
  assert.equal(quickReview.cards.length, 28);
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
  assert.equal(items.filter(({ module }) => (module.contentMeta?.curriculum?.deliveryRoles || []).includes('mock')).length, 0, 'Phase 5 dedicated Mock bank must still be absent');
  const quick = read('js/quick-review.js');
  assert.doesNotMatch(quick, /Learning\.recordAttempt/);
  assert.doesNotMatch(quick, /Learning\.setMistakeReason/);
  const skill = read('js/skill.js');
  assert.match(skill, /if \(!checks\.length\) return ""/);
  const progress = read('js/progress.js');
  assert.match(progress, /Practice signal/);
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

test('Phase 4 final release is Alpha 29 and every new learner artifact is public-build eligible', () => {
  const release = readJson('release.json');
  assert.equal(release.release, '0.7.0-alpha.29');
  assert.equal(release.generatedModules, 112);
  assert.equal(release.learnerResourceFiles, 152);
  const builder = read('scripts/build-public.mjs');
  assert.match(builder, /check\.html/);
  assert.match(builder, /check\.js/);
  assert.match(builder, /quick-review\.js/);
  assert.match(builder, /quick-review\.json/);
  for (const page of ['check.html', 'train.html', 'progress.html', 'skill.html']) {
    assert.match(read(page), /<meta name="studo-release" content="0\.7\.0-alpha\.29">/);
  }
});
