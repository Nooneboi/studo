import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('shared learner shell uses the canonical desktop destinations', () => {
  const source = read('js/app.js');
  assert.match(source, /renderCanonicalLearnerHeader/);
  assert.match(source, />Home<\/a>/);
  assert.match(source, />Practice Tests<\/a>/);
  assert.match(source, />Resources<\/a>/);
  assert.doesNotMatch(source, /trainLink\.href = "train\.html"/);
  assert.doesNotMatch(source, /progressLink\.href = "progress\.html"/);
});

test('shared learner shell no longer exposes the old mobile product model', () => {
  const source = read('js/app.js');
  assert.match(source, /renderCanonicalMobileNavigation/);
  assert.match(source, />Tests<\/span>/);
  assert.match(source, />Resources<\/span>/);
  assert.doesNotMatch(source, />Train<\/span>/);
  assert.doesNotMatch(source, />Mock<\/span>/);
  assert.doesNotMatch(source, /mobile-primary-more/);
});

test('focus workspaces remain excluded from the ordinary learner shell', () => {
  const source = read('js/app.js');
  assert.match(source, /const FOCUS_PAGES = new Set\(\["module\.html", "check\.html", "test\.html", "train\.html", "extended-response\.html"\]\)/);
  assert.match(source, /if \(FOCUS_PAGES\.has\(path\)\) return/);
});

test('canonical learner shell styling removes the legacy dashboard chrome', () => {
  const css = read('css/site.css');
  assert.match(css, /CHEE SKOOL LEARNER SHELL V1/);
  assert.match(css, /body\.canonical-learner-shell \{[\s\S]*?background:#fff !important/);
  assert.match(css, /\.site-header\.simple-header/);
  assert.match(css, /#subject-bar-mount[\s\S]*?display:none !important/);
});
