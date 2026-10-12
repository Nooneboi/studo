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

test('Resources visual system is flat and restrained', () => {
  const css = read('css/site.css');
  assert.match(css, /CHEE SKOOL LEARNER VISUAL V1/);
  assert.match(css, /\.resource-hero-search input[\s\S]*?border-radius:0 !important/);
  assert.match(css, /\.filter-chip\.active[\s\S]*?background:#111 !important/);
  assert.match(css, /\.resource-file-link b[\s\S]*?display:none !important/);
});

test('Practice Tests uses rows rather than promotional cards', () => {
  const css = read('css/site.css');
  assert.match(css, /\.mock-library-grid[\s\S]*?display:block !important/);
  assert.match(css, /\.mock-test-card[\s\S]*?border-radius:0 !important/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) 260px auto !important/);
});
