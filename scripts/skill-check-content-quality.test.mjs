import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SET_DIR = path.join(ROOT, 'content-src', 'sets');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const expected = [
  'set-rla-check-explicit-meaning-v1',
  'set-rla-check-main-idea-v1',
  'set-rla-check-supporting-details-v1',
  'set-rla-check-summary-v1',
  'set-rla-check-inference-v1',
  'set-rla-check-conclusions-v1',
  'set-rla-check-claims-structure-v1',
  'set-rla-check-finding-evidence-v1',
  'set-rla-check-credibility-counterarguments-v1',
];

function fingerprint(question) {
  const extra = question.options?.map((o) => o.text).join('|')
    || question.interaction?.targets?.map((x) => x.text).join('|')
    || question.interaction?.items?.map((x) => x.text).join('|')
    || '';
  return `${question.prompt}|${extra}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

function loadAllSets() {
  return fs.readdirSync(SET_DIR).filter((name) => name.endsWith('.json')).map((name) => readJson(path.join('content-src/sets', name)));
}

test('first-wave Skill Check bank contains exactly nine dedicated six-question sets', () => {
  const all = loadAllSets();
  const checks = all.filter((set) => set.curriculum?.deliveryRoles?.includes('skill_check'));
  assert.deepEqual(checks.map((set) => set.id).sort(), [...expected].sort());
  assert.equal(checks.reduce((sum, set) => sum + set.questions.length, 0), 54);
  for (const set of checks) {
    assert.equal(set.status, 'published');
    assert.equal(set.questions.length, 6, `${set.id} needs six questions`);
    assert.deepEqual(set.curriculum.deliveryRoles, ['skill_check']);
    assert.ok(set.curriculum.practiceTags?.includes('mock-excluded'), `${set.id} must be mock-excluded`);
    assert.ok(!set.curriculum.practiceTags?.includes('active-learning'), `${set.id} must not masquerade as guided active learning`);
    assert.ok(set.questions.every((q) => !q.hint && !q.learningStage), `${set.id} must not contain hints/stages`);
  }
});

test('Skill Check questions are unseen relative to learner Practice/Train source sets', () => {
  const all = loadAllSets();
  const normalFingerprints = new Set(all
    .filter((set) => !set.curriculum?.deliveryRoles?.includes('skill_check'))
    .flatMap((set) => set.questions || [])
    .map(fingerprint));
  for (const set of all.filter((x) => x.curriculum?.deliveryRoles?.includes('skill_check'))) {
    for (const q of set.questions) assert.ok(!normalFingerprints.has(fingerprint(q)), `${set.id}/${q.id} duplicates an existing learner question`);
  }
});

test('first-wave Checks attach to the intended mature Reading skills and Arguments units', () => {
  const sets = new Map(loadAllSets().map((set) => [set.id, set]));
  const expectedPlacement = new Map([
    ['set-rla-check-explicit-meaning-v1', ['R1.1', null]],
    ['set-rla-check-main-idea-v1', ['R1.2', null]],
    ['set-rla-check-supporting-details-v1', ['R1.3', null]],
    ['set-rla-check-summary-v1', ['R1.4', null]],
    ['set-rla-check-inference-v1', ['R2.4', null]],
    ['set-rla-check-conclusions-v1', ['R2.5', null]],
    ['set-rla-check-claims-structure-v1', ['R5.1', 'claims-argument-structure']],
    ['set-rla-check-finding-evidence-v1', ['R5.3', 'finding-evidence']],
    ['set-rla-check-credibility-counterarguments-v1', ['R5.9', 'credibility-counterarguments']],
  ]);
  for (const [id, [skillId, unitId]] of expectedPlacement) {
    const set = sets.get(id);
    assert.ok(set, `${id} missing`);
    assert.equal(set.curriculum.primarySkillId, skillId);
    assert.equal(set.curriculum.unitId || null, unitId);
  }
});

test('generated curriculum exposes nine Checks without leaking them into Practice sets', () => {
  assert.ok(fs.existsSync('data/generated/curriculum.json'));
  const curriculum = readJson('data/generated/curriculum.json');
  const items = curriculum.tracks.flatMap((track) => track.domains.flatMap((domain) => [...domain.skills, ...(domain.units || [])]));
  const checks = new Map(items.flatMap((item) => (item.checks || []).map((check) => [check.id, { item, check }])));
  for (const id of expected) {
    assert.ok(checks.has(id), `${id} must attach through curriculum.checks`);
    const { item, check } = checks.get(id);
    assert.ok(check.curriculum.deliveryRoles.includes('skill_check'));
    assert.ok(!(item.sets || []).some((set) => set.id === id), `${id} leaked into Practice sets`);
  }
});
