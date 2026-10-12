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

test('Practice Tests uses the minimal learner-facing test picker', () => {
  const html = read('quiz.html');
  assert.match(html, /<div class="page-kicker">GED RLA<\/div>/);
  assert.match(html, /<h1>Practice Tests<\/h1>/);
  assert.match(html, /Choose the amount of test practice you want right now\./);
  assert.match(html, /class="simple-test-options"/);
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

test('Practice Tests is a minimal two-choice picker with a skill-practice fallback', () => {
  const html = read('quiz.html');
  const css = read('css/site.css');
  assert.match(html, /<section class="simple-test-options"/);
  assert.match(html, /Full RLA Mock/);
  assert.match(html, /Objective RLA Practice Test/);
  assert.match(html, /Practice by skill instead/);
  assert.doesNotMatch(html, /mock-focused-practice/);
  assert.doesNotMatch(html, /How do you want to practice\?/);
  assert.match(css, /\.simple-test-option[\s\S]*?grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(css, /\.mock-resume\[hidden\][\s\S]*?display:none !important/);
});
