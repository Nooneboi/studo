import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('Main Idea module runtime opts into the approved V22 presentation and chrome', () => {
  const source = read('js/module.js');
  assert.match(source, /primarySkillId === "R1\.2"/);
  assert.match(source, /classList\.add\("mainidea-v22-runtime"\)/);
  assert.match(source, /setupMainIdeaV22Chrome\(\)/);
  assert.match(source, /set-rla-mainidea-learn-certified-v2\.json/);
  assert.match(source, /set-rla-mainidea-practice-b-stated-v1\.json/);
  assert.match(source, /set-rla-check-main-idea-certified-v2\.json/);
  assert.match(source, /classList\.toggle\("mainidea-v22-learn", isLearn\)/);
  assert.match(source, /classList\.toggle\("mainidea-v22-practice", !isLearn\)/);
  assert.match(source, /const mainIdeaV22 = document\.body\.classList\.contains\('mainidea-v22-runtime'\)/);
  assert.match(source, /const showBreakdown = !mainIdeaV22/);
});

test('Main Idea Skill Check uses the same V22 chrome and presentation', () => {
  const source = read('js/check.js');
  assert.match(source, /primarySkillId === "R1\.2"/);
  assert.match(source, /classList\.add\("mainidea-v22-runtime"\)/);
  assert.match(source, /classList\.add\("mainidea-v22-check"\)/);
  assert.match(source, /setupMainIdeaV22Chrome\(\)/);
});

test('module and check pages include the V22 Chee Skool navigation shell', () => {
  for (const file of ['module.html', 'check.html']) {
    const html = read(file);
    assert.match(html, /class="mainidea-v22-chrome"/);
    assert.match(html, />Chee Skool<\/a>/);
    assert.match(html, /id="mainidea-v22-learn"/);
    assert.match(html, /id="mainidea-v22-practice"/);
    assert.match(html, /id="mainidea-v22-check"/);
  }
});

test('V22 presentation matches the approved reference geometry and typography', () => {
  const css = read('css/site.css');
  assert.match(css, /body\.mainidea-v22-runtime \.focus-bar \{ display:none !important; \}/);
  assert.match(css, /width:min\(1120px,calc\(100% - 48px\)\)/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) minmax\(340px,\.9fr\)/);
  assert.match(css, /gap:56px !important/);
  assert.match(css, /font-family:Georgia,"Times New Roman",serif !important/);
  assert.match(css, /font-size:18px !important/);
  assert.match(css, /font-size:38px !important/);
  assert.match(css, /font-size:23px !important/);
  assert.match(css, /background:var\(--mi-ink\) !important/);
  assert.match(css, /body\.mainidea-v22-runtime \.passage-paragraph-number \{[\s\S]*?display:none !important/);
  assert.match(css, /body\.mainidea-v22-runtime \.reading-panel,[\s\S]*?overflow:visible !important/);
  assert.match(css, /body\.mainidea-v22-runtime \.answer-breakdown \{ display:none !important; \}/);
});

test('V22 interaction keeps Next quiet until the current answer is reviewed', () => {
  const source = read('js/module.js');
  assert.match(source, /mainidea-v22-waiting/);
  assert.match(source, /classList\.remove\("mainidea-v22-waiting"\)/);
  assert.match(source, /!document\.body\.classList\.contains\("mainidea-v22-runtime"\)/);
  assert.match(source, /if \(document\.body\.classList\.contains\("mainidea-v22-runtime"\)\) unlockGuidedNext\(\)/);
});

test('V22 Main Idea mobile layout collapses cleanly to one column', () => {
  const css = read('css/site.css');
  assert.match(css, /@media \(max-width:820px\)[\s\S]*?grid-template-columns:1fr !important/);
  assert.match(css, /gap:34px !important/);
});
