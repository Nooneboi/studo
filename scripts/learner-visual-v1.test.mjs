import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('Resources uses the simplified learner hierarchy', () => {
  const html = read('resources.html');
  assert.match(html, /<div class="eyebrow">GED RLA<\/div>/);
  assert.match(html, /Open a study guide or workbook for the skill you are working on\./);
  assert.doesNotMatch(html, /RLA library/);
});

test('Practice Tests uses learner-facing wording instead of the old Mock landing title', () => {
  const html = read('quiz.html');
  assert.match(html, /<div class="page-kicker">GED RLA<\/div>/);
  assert.match(html, /<h1>Practice Tests<\/h1>/);
  assert.match(html, /How do you want to practice\?/);
});

test('Resources is a skill list rather than a workbook matrix', () => {
  const source = read('js/resources.js');
  const css = read('css/site.css');
  assert.match(source, /resource-topic-list/);
  assert.match(source, /renderTopicItem/);
  assert.match(source, /resourceActionLabel/);
  assert.doesNotMatch(source, /renderTopicHeader/);
  assert.doesNotMatch(source, /resource-topic-table/);
  assert.match(css, /\.resource-topic-item[\s\S]*?grid-template-columns:minmax\(0,1fr\) auto/);
});

test('Practice Tests is decision-first and does not render an empty resume outline', () => {
  const html = read('quiz.html');
  const css = read('css/site.css');
  assert.match(html, /46 objective questions/);
  assert.match(html, /30 objective questions/);
  assert.match(html, /Use this when you want a long, exam-style run/);
  assert.match(html, /Use this when you want timed question practice without the essay/);
  assert.match(css, /\.mock-resume\[hidden\][\s\S]*?display:none !important/);
  assert.match(css, /\.mock-test-card[\s\S]*?grid-template-columns:minmax\(0,1fr\) auto !important/);
});
