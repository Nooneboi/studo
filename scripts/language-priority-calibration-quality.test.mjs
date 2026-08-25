import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const agreement = JSON.parse(fs.readFileSync('content-src/sets/set-rla-lang-agreement.json', 'utf8'));
const parallel = JSON.parse(fs.readFileSync('content-src/sets/set-rla-lang-parallel.json', 'utf8'));

function profile(set) {
  return set.questions.map((q) => `${q.difficulty}:${q.dok}`);
}

test('Agreement & Pronouns has a real 2 easy / 4 medium / 2 hard progression', () => {
  assert.deepEqual(profile(agreement), [
    'easy:1','easy:1',
    'medium:2','medium:2','medium:2','medium:2',
    'hard:3','hard:3',
  ]);
  assert.equal(agreement.questions.length, 8);
  assert.ok(agreement.questions.slice(6).every((q) => q.difficultyProfile.reasoningDepth >= 3));
});

test('Agreement hard items require multiple grammar constraints rather than relabeling old items', () => {
  const hardText = agreement.questions.slice(6).map((q) => `${q.prompt} ${q.options.map((o) => o.text).join(' ')} ${q.explanation.whyCorrect}`).join(' ').toLowerCase();
  assert.match(hardText, /pronoun|their|its|they|it/);
  assert.match(hardText, /manager|team|committee|each|neither|either|one of|series|group/);
  assert.ok(agreement.questions.slice(6).every((q) => /agree|agreement/.test(q.explanation.whyCorrect.toLowerCase())));
});

test('Parallelism & Sentence Connections has a real 2 easy / 4 medium / 2 hard progression', () => {
  assert.deepEqual(profile(parallel), [
    'easy:1','easy:1',
    'medium:2','medium:2','medium:2','medium:2',
    'hard:3','hard:3',
  ]);
  assert.equal(parallel.questions.length, 8);
  assert.ok(parallel.questions.slice(6).every((q) => q.difficultyProfile.reasoningDepth >= 3));
});

test('Parallelism hard items require form plus logical-relationship reasoning', () => {
  const hard = parallel.questions.slice(6);
  const text = hard.map((q) => `${q.prompt} ${q.options.map((o) => o.text).join(' ')} ${q.explanation.whyCorrect}`).join(' ').toLowerCase();
  assert.match(text, /although|because|however|therefore|while|but|so|yet/);
  assert.ok(hard.every((q) => /parallel|relationship|contrast|cause|reason|meaning/i.test(q.explanation.whyCorrect)));
});
