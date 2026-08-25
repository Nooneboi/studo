import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');

const domainJs = read('js/domain.js');
const quizHtml = read('quiz.html');
const progressJs = read('js/progress.js');
const css = read('css/site.css');

test('Extended Response follows Learn → focused practice → full response hierarchy', () => {
  const learningMount = domainJs.indexOf(`id="er-learning-units"`);
  const practiceMount = domainJs.indexOf(`renderExtendedResponsePractice(extendedResponsePractice, extendedResponseProduction, track, domain)`);
  const jumpMount = domainJs.indexOf(`renderExtendedResponseJumps(extendedResponsePractice, extendedResponseProduction)`);

  assert.ok(jumpMount >= 0, 'ER should expose quick jump navigation near the top');
  assert.ok(learningMount >= 0, 'ER should render the Learning Units index');
  assert.ok(practiceMount >= 0, 'ER should render the practice modes');
  assert.ok(jumpMount < learningMount, 'quick jumps should appear before Learning Units');
  assert.ok(learningMount < practiceMount, 'Learning Units should appear before both practice modes');

  assert.match(domainJs, /href="#er-learning-units"/);
  assert.match(domainJs, /href="#production-lab"/);
  assert.match(domainJs, /href="#full-er-practice"/);
  assert.match(domainJs, /class="er-practice-layout"/);
  assert.ok(domainJs.indexOf('id="production-lab"') < domainJs.indexOf('id="full-er-practice"'), 'focused Production Lab should be authored before the full response practice');
  assert.match(css, /\.er-practice-layout\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(css, /@media\s*\(max-width:\s*820px\)[\s\S]*?\.er-practice-layout\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media\s*\(max-width:\s*820px\)[\s\S]*?\.er-practice-production\s*\{[^}]*order:\s*1/s);
  assert.match(css, /@media\s*\(max-width:\s*820px\)[\s\S]*?\.er-practice-full\s*\{[^}]*order:\s*2/s);
});

test('Mock landing is sectioned and its test library scales to more cards', () => {
  assert.match(quizHtml, /<h1>Mock<\/h1>/);
  assert.match(quizHtml, /class="mock-library"/);
  assert.match(quizHtml, /id="mock-library-heading"/);
  assert.match(quizHtml, /class="mock-library-grid"/);
  assert.match(quizHtml, /data-mock-kind="full"/);
  assert.match(quizHtml, /data-mock-kind="objective"/);
  assert.match(quizHtml, /class="mock-focused-practice"/);
  assert.match(css, /\.mock-library-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*320px\),\s*1fr\)\)/s);
});

test('Progress skill rows give status ownership of the score and meter', () => {
  assert.match(progressJs, /class="progress-correct-cell"/);
  assert.match(progressJs, /class="progress-evidence-cell"/);
  assert.match(progressJs, /class="progress-status-summary"/);
  assert.match(progressJs, /class="progress-status-meter"/);
  assert.doesNotMatch(progressJs, /class="progress-signal-meter"/);
  assert.match(progressJs, />Evidence<\/small>/);
  assert.match(progressJs, />Practice<\/strong>/);
  assert.match(css, /\.progress-status-cell\s*\{[^}]*min-width:\s*0/s);
  assert.match(css, /\.progress-status-meter\s*\{[^}]*width:\s*100%/s);
});

test('Progress groups repetitive review mistakes by skill', () => {
  assert.match(progressJs, /function groupReviewMistakes\(mistakes\)/);
  assert.match(progressJs, /const reviewGroups = groupReviewMistakes\(activeMistakes\)/);
  assert.match(progressJs, /need review/);
  assert.match(progressJs, /Skill evidence reflects your Chee Skool practice history/);
  assert.doesNotMatch(progressJs, /Skill signals reflect your Chee Skool practice history/);
  assert.doesNotMatch(progressJs, /\$\{mistake\.wrongCount\} wrong/);
});

test('Phone layouts use stacked cards and tighter first-screen spacing', () => {
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.progress-page-wrap\s*\{[^}]*padding-top:\s*(?:1[2468]|20)px/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.progress-skill-row\s*\{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.progress-status-cell\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s);
  assert.match(css, /\.progress-main-refined\s*\{[^}]*overflow-x:\s*clip/s);
  assert.match(css, /\.progress-page-wrap\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0/s);
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.mock-test-card\s+\.btn\s*\{[^}]*width:\s*100%/s);
  assert.match(css, /@media\s*\(max-width:\s*820px\)[\s\S]*?\.er-practice-jumps\s*\{[^}]*overflow-x:\s*auto/s);
});
