import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const readJson = (file) => JSON.parse(read(file));
const allowed = new Set([
  'argument_terms',
  'transitions',
  'text_structure',
  'word_tone',
  'language_rules',
  'punctuation',
  'extended_response',
]);

test('Quick Review canonical registry stays small, selective, and recall-focused', () => {
  assert.ok(fs.existsSync('content-src/config/rla.quick-review.v1.json'), 'Quick Review registry missing');
  const registry = readJson('content-src/config/rla.quick-review.v1.json');
  assert.equal(registry.schemaVersion, 1);
  assert.ok(Array.isArray(registry.cards));
  assert.ok(registry.cards.length >= 25 && registry.cards.length <= 30, `expected 25-30 cards, found ${registry.cards.length}`);
  const ids = new Set();
  for (const card of registry.cards) {
    assert.match(card.id || '', /^qr-[a-z0-9-]+$/);
    assert.ok(!ids.has(card.id), `duplicate card id ${card.id}`);
    ids.add(card.id);
    assert.ok(allowed.has(card.category), `unsupported category ${card.category}`);
    assert.ok(String(card.front || '').trim().length > 0, `${card.id} missing front`);
    assert.ok(String(card.back || '').trim().length > 0, `${card.id} missing back`);
    assert.ok(String(card.front).length <= 180, `${card.id} front too long`);
    assert.ok(String(card.back).length <= 300, `${card.id} back too long`);
  }
  const learnerText = registry.cards.map((card) => `${card.front} ${card.back}`).join(' ').toLowerCase();
  for (const prohibited of ['main idea', 'summary question', 'inference question', 'synthesize the passage', 'synthesis question']) {
    assert.ok(!learnerText.includes(prohibited), `Quick Review must not turn passage reasoning into cards: ${prohibited}`);
  }
});

test('Quick Review build and public artifact contract exist', () => {
  assert.ok(fs.existsSync('data/generated/quick-review.json'), 'generated Quick Review data missing');
  const generated = readJson('data/generated/quick-review.json');
  assert.equal(generated.schemaVersion, 1);
  assert.ok(Array.isArray(generated.cards));
  assert.ok(generated.cards.length >= 25 && generated.cards.length <= 30);
  const publicBuilder = read('scripts/build-public.mjs');
  assert.match(publicBuilder, /quick-review\.json/);
  assert.match(publicBuilder, /quick-review\.js/);
});

test('Quick Review runtime is isolated from learning evidence', () => {
  assert.ok(fs.existsSync('js/quick-review.js'), 'Quick Review runtime missing');
  const source = read('js/quick-review.js');
  const train = read('js/train.js');
  const html = read('train.html');
  assert.match(source, /sq:quick-review:v1/);
  assert.match(source, /setAttribute\(['"]aria-label['"],\s*['"]Exit Quick Review['"]\)/);
  assert.match(source, /site-footer \.focus-wrap/);
  assert.match(source, /Again/);
  assert.match(source, /Got it/);
  assert.doesNotMatch(source, /Learning\.recordAttempt/);
  assert.doesNotMatch(source, /Learning\.setMistakeReason/);
  assert.match(train, /mode\s*===\s*["']quick-review["']/);
  assert.match(train, /QuickReview\.init/);
  assert.match(html, /js\/quick-review\.js/);
});
