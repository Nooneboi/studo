import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const learnerPages = [
  '404.html','about.html','category.html','check.html','curriculum.html','domain.html',
  'extended-response.html','index.html','methodology.html','module.html','offline.html',
  'passages.html','practice.html','privacy.html','progress.html','quiz.html','resources.html',
  'rla.html','skill.html','test.html','train.html'
];

test('every learner-facing page loads the canonical Chee Skool design foundation', () => {
  for (const file of learnerPages) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /css\/chee-system\.css/, `${file} is missing css/chee-system.css`);
  }
});

test('authoring surfaces do not inherit the learner design system by accident', () => {
  for (const file of ['builder.html','content-studio.html','resource-studio.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(html, /css\/chee-system\.css/, `${file} should stay isolated from learner UI`);
  }
});

test('design foundation defines one canonical learner token set', () => {
  const css = fs.readFileSync('css/chee-system.css', 'utf8');
  assert.match(css, /--chee-bg:\s*#ffffff/);
  assert.match(css, /--chee-ink:\s*#111111/);
  assert.match(css, /--chee-link:\s*#0b63a1/);
  assert.match(css, /--chee-container:\s*1120px/);
  assert.match(css, /--chee-control-height:\s*44px/);
});

test('shared controls have consistent focus, target, and answer-control geometry', () => {
  const css = fs.readFileSync('css/chee-system.css', 'utf8');
  assert.match(css, /outline:\s*3px solid var\(--chee-focus\)/);
  assert.match(css, /min-height:\s*var\(--chee-control-height\)/);
  assert.match(css, /input\[type="radio"\][\s\S]*?aspect-ratio:\s*1\s*\/\s*1/);
});

test('reading typography remains distinct from interface typography', () => {
  const css = fs.readFileSync('css/chee-system.css', 'utf8');
  assert.match(css, /--chee-font-ui:/);
  assert.match(css, /--chee-font-reading:/);
  assert.match(css, /\.reading-text,[\s\S]*?font-family:\s*var\(--chee-font-reading\)/);
});
