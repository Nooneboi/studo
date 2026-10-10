import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('Main Idea module runtime opts into the approved V22 presentation', () => {
  const source = read('js/module.js');
  assert.match(source, /primarySkillId === "R1\.2"/);
  assert.match(source, /classList\.add\("mainidea-v22-runtime"\)/);
  assert.match(source, /const mainIdeaV22 = document\.body\.classList\.contains\('mainidea-v22-runtime'\)/);
  assert.match(source, /const showBreakdown = !mainIdeaV22/);
});

test('Main Idea Skill Check opts into the same V22 presentation', () => {
  const source = read('js/check.js');
  assert.match(source, /primarySkillId === "R1\.2"/);
  assert.match(source, /classList\.add\("mainidea-v22-runtime"\)/);
});

test('V22 presentation removes the old focus workspace look only for Main Idea', () => {
  const css = read('css/site.css');
  assert.match(css, /body\.mainidea-v22-runtime \.focus-bar \{[\s\S]*?display: none !important/);
  assert.match(css, /body\.mainidea-v22-runtime \.study-workspace[\s\S]*?grid-template-columns: minmax\(0, 1fr\) minmax\(340px, \.9fr\)/);
  assert.match(css, /body\.mainidea-v22-runtime \.reading-panel-clean[\s\S]*?background: transparent !important/);
  assert.match(css, /body\.mainidea-v22-runtime \.passage-paragraph-number \{[\s\S]*?display: none !important/);
  assert.match(css, /body\.mainidea-v22-runtime \.answer-breakdown \{[\s\S]*?display: none !important/);
  assert.match(css, /body\.mainidea-v22-runtime \.q-prompt[\s\S]*?font-size: 23px !important/);
  assert.match(css, /body\.mainidea-v22-runtime \.chee-mm-trigger[\s\S]*?color: #0b63a1 !important/);
});

test('V22 Main Idea mobile layout collapses cleanly to one column', () => {
  const css = read('css/site.css');
  assert.match(css, /@media \(max-width: 820px\)[\s\S]*?body\.mainidea-v22-runtime \.study-workspace[\s\S]*?grid-template-columns: 1fr !important/);
});
