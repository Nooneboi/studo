import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SET = path.join(ROOT, 'content-src', 'sets', 'set-rla-lang-boundaries.json');

async function loadSet() {
  return JSON.parse(await fs.readFile(SET, 'utf8'));
}

function byId(questions, id) {
  const q = questions.find((item) => item.id === id);
  assert.ok(q, `missing ${id}`);
  return q;
}

test('Sentence Boundaries focused practice has a real 2 easy / 4 medium / 2 hard progression', async () => {
  const set = await loadSet();
  assert.equal(set.questions.length, 8);

  const counts = set.questions.reduce((acc, q) => {
    acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
    return acc;
  }, {});
  assert.deepEqual(counts, { easy: 2, medium: 4, hard: 2 });

  const q1 = byId(set.questions, 'q1');
  const q2 = byId(set.questions, 'q2');
  assert.equal(q1.dok, 1);
  assert.equal(q2.dok, 1);
  assert.ok(q1.difficultyProfile.reasoningDepth <= 1);
  assert.ok(q2.difficultyProfile.reasoningDepth <= 1);

  for (const id of ['q3', 'q4', 'q5', 'q6']) {
    const q = byId(set.questions, id);
    assert.equal(q.difficulty, 'medium');
    assert.equal(q.dok, 2);
  }

  const q7 = byId(set.questions, 'q7');
  const q8 = byId(set.questions, 'q8');
  for (const q of [q7, q8]) {
    assert.equal(q.difficulty, 'hard');
    assert.equal(q.dok, 3);
    assert.ok(q.difficultyProfile.reasoningDepth >= 3);
    assert.ok(q.difficultyProfile.distractorSimilarity >= 3);
    assert.ok(q.estimatedSeconds >= 60);
  }
});

test('hard Sentence Boundaries items require multi-clause repair rather than relabeling simple items', async () => {
  const set = await loadSet();
  const q7 = byId(set.questions, 'q7');
  const q8 = byId(set.questions, 'q8');

  const q7Text = [q7.prompt, ...q7.options.map((o) => o.text)].join(' ').toLowerCase();
  assert.match(q7Text, /although/);
  assert.match(q7Text, /because/);
  assert.match(q7Text, /east room/);

  const q8Text = [q8.prompt, ...q8.options.map((o) => o.text)].join(' ').toLowerCase();
  assert.match(q8Text, /however/);
  assert.match(q8Text, /conference room/);
  assert.ok(q8.options.some((o) => /:/.test(o.text) && /;/.test(o.text)), 'q8 must require coordinating more than one boundary mark');
});
