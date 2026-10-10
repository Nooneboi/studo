import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('Main Idea chrome has a canonical hub and practice-sequence mount', () => {
  for (const file of ['module.html', 'check.html']) {
    const html = read(file);
    assert.match(html, /id="mainidea-v22-hub"/);
    assert.match(html, /id="mainidea-v24-sequence"/);
  }
});

test('Main Idea runtime resolves all practice stages from curriculum instead of one loose Practice link', () => {
  const source = read('js/module.js');
  assert.match(source, /const practiceSets = sets\.filter/);
  assert.match(source, /route\.practiceSets\.map/);
  assert.match(source, /Practice \$\{label\}/);
  assert.match(source, /mainIdeaPracticeShortTitle/);
  assert.match(source, /if \(hub\) hub\.href = route\.returnHref/);
});

test('Main Idea Skill Check returns through the canonical hub and first practice stage', () => {
  const source = read('js/check.js');
  assert.match(source, /const hub = document\.getElementById\("mainidea-v22-hub"\)/);
  assert.match(source, /if \(hub\) hub\.href = route\.returnHref/);
  assert.match(source, /practice\.href = moduleRoute\(route\.practiceSets\[0\]\.file/);
});

test('Main Idea Next remains visible while locked and becomes discoverable when unlocked', () => {
  const css = read('css/site.css');
  const source = read('js/module.js');
  assert.match(css, /question-footer\.mainidea-v22-waiting \{[\s\S]*?visibility:visible !important/);
  assert.match(css, /mainidea-v22-waiting #next-question[\s\S]*?cursor:not-allowed/);
  assert.match(source, /footer\?\.scrollIntoView\(\{ behavior: "smooth", block: "nearest" \}\)/);
});

test('Main Idea practice distinguishes skill-building interactions from GED-style items', () => {
  const source = read('js/module.js');
  assert.match(source, /Skill builder · Sort clues/);
  assert.match(source, /Build it yourself/);
  assert.match(source, /GED-style question/);
  assert.match(source, /Skill builder · Find evidence/);
});

test('Main Idea skill hub shows Learn, the staged practice path, Skill Check, and secondary resources', () => {
  const source = read('js/skill.js');
  assert.match(source, /renderMainIdeaHub/);
  assert.match(source, /Learn the method/);
  assert.match(source, /Practice \$\{practiceLabels\[index\]/);
  assert.match(source, /Check what transfers/);
  assert.match(source, /Extra study files/);
});
