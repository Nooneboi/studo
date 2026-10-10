import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const json = (rel) => JSON.parse(read(rel));

function findMainIdeaSkill(curriculum) {
  for (const track of curriculum.tracks || []) {
    for (const domain of track.domains || []) {
      const skill = (domain.skills || []).find((item) => item.id === 'R1.2');
      if (skill) return { track, domain, skill };
    }
  }
  return null;
}

test('generated Main Idea inventory contains only the promoted learner path', () => {
  const curriculum = json('data/generated/curriculum.json');
  const found = findMainIdeaSkill(curriculum);
  assert.ok(found, 'R1.2 must exist in generated curriculum');

  const setIds = (found.skill.sets || []).map((item) => item.id);
  assert.deepEqual(setIds, [
    'set-rla-mainidea-learn-certified-v2',
    'set-rla-mainidea-practice-b-stated-v1',
    'set-rla-mainidea-practice-c-implied-v1',
    'set-rla-mainidea-practice-d-literary-v1',
    'set-rla-mainidea-practice-e-urbanization-v1',
  ]);
  assert.deepEqual((found.skill.checks || []).map((item) => item.id), [
    'set-rla-check-main-idea-certified-v2',
  ]);

  const expectedFiles = [
    ...(found.skill.sets || []).map((item) => item.file),
    ...(found.skill.checks || []).map((item) => item.file),
  ];
  for (const file of expectedFiles) {
    assert.match(file, /^generated\/modules\/[a-z0-9._-]+\.json$/i);
    assert.ok(fs.existsSync(path.join(root, 'data', file)), `${file} must exist after canonical build`);
  }

  const index = json('data/generated/index.json');
  const files = new Set(index.map((item) => item.file));
  for (const file of expectedFiles) assert.ok(files.has(file), `${file} must be indexed`);

  assert.equal(files.has('generated/modules/rla-main-idea-practice-01.json'), false);
  assert.equal(files.has('generated/modules/set-rla-mainidea-active-methods-v1.json'), false);
  assert.equal(files.has('generated/modules/set-rla-check-main-idea-v1.json'), false);
});

test('Main Idea routes resolve from generated curriculum and return to the canonical skill page', () => {
  const curriculum = json('data/generated/curriculum.json');
  const found = findMainIdeaSkill(curriculum);
  assert.ok(found);

  const canonicalReturn = `skill.html?track=${encodeURIComponent(found.track.id)}&domain=${encodeURIComponent(found.domain.id)}&skill=R1.2`;
  assert.equal(canonicalReturn, 'skill.html?track=reading&domain=core-meaning&skill=R1.2');

  const moduleJs = read('js/module.js');
  const checkJs = read('js/check.js');
  const routesJs = read('js/curriculum-routes.js');
  const checkHtml = read('check.html');

  assert.match(routesJs, /skillLocation\(skillId\)/);
  assert.match(moduleJs, /routes\?\.skillLocation\?\.\("R1\.2"\)/);
  assert.match(checkJs, /routes\?\.skillLocation\?\.\("R1\.2"\)/);
  assert.match(moduleJs, /returnHref: location\.returnHref/);
  assert.match(checkJs, /returnHref: location\.returnHref/);
  assert.match(checkHtml, /<script src="js\/curriculum-routes\.js"><\/script>/);

  for (const source of [moduleJs, checkJs]) {
    assert.doesNotMatch(source, /skill\.html\?skill=R1\.2/);
    assert.doesNotMatch(source, /set-rla-mainidea-learn-certified-v2\.json&return=/);
    assert.doesNotMatch(source, /set-rla-check-main-idea-certified-v2\.json&return=/);
  }
});

test('learner data loader bypasses stale caches and rejects missing module paths', () => {
  const source = read('js/data.js');
  assert.match(source, /fetch\(url, \{ cache: "no-store" \}\)/);
  assert.match(source, /if \(!res\.ok\)/);
  assert.match(source, /Invalid learner module path/);
  assert.match(source, /generated\\\/modules/);
});

test('release, app, and service-worker cache ids stay aligned', () => {
  const release = json('release.json').release;
  const app = read('js/app.js');
  const sw = read('sw.js');
  const appMatch = app.match(/const STUDO_RELEASE = "([^"]+)"/);
  const cacheMatch = sw.match(/const CACHE_NAME="studo-shell-([^"]+)"/);
  assert.ok(appMatch);
  assert.ok(cacheMatch);
  assert.equal(appMatch[1], release);
  assert.equal(cacheMatch[1], release);
});

test('Pages deployment uses one canonical GitHub Actions workflow after repository Pages source is set to GitHub Actions', () => {
  const workflow = read('.github/workflows/pages.yml');
  assert.match(workflow, /push:\s*\n\s*branches: \[main\]/);
  assert.match(workflow, /npm run content:validate/);
  assert.match(workflow, /npm run content:build/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /node scripts\/build-public\.mjs/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.doesNotMatch(workflow, /workflow_run:/);
});
