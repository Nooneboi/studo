import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

function resourceCount(curriculum) {
  return (curriculum.tracks || []).reduce((sum, track) => sum +
    (track.domains || []).reduce((domainSum, domain) => domainSum +
      (domain.resources || []).length +
      (domain.skills || []).reduce((skillSum, skill) => skillSum + (skill.resources || []).length, 0), 0), 0);
}

test('content build preserves migrated learner content while compiling source content', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'studo-build-regression-'));
  const copy = path.join(tmp, 'studo');
  await fs.cp(ROOT, copy, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.git${path.sep}`) && !src.endsWith(`${path.sep}.git`),
  });

  const beforeIndex = JSON.parse(await fs.readFile(path.join(copy, 'data/generated/index.json'), 'utf8'));
  const beforeLearnerIndex = beforeIndex.filter((entry) => entry.file !== 'generated/modules/sample-quiz.json');
  const beforeCurriculum = JSON.parse(await fs.readFile(path.join(copy, 'data/generated/curriculum.json'), 'utf8'));
  const beforePassages = (beforeCurriculum.passagePractice || []).length;
  const beforeResources = resourceCount(beforeCurriculum);

  const result = spawnSync(process.execPath, ['scripts/build-content.mjs'], {
    cwd: copy,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `build failed:\n${result.stdout}\n${result.stderr}`);

  const afterIndex = JSON.parse(await fs.readFile(path.join(copy, 'data/generated/index.json'), 'utf8'));
  const afterCurriculum = JSON.parse(await fs.readFile(path.join(copy, 'data/generated/curriculum.json'), 'utf8'));

  assert.ok(afterIndex.length >= beforeLearnerIndex.length,
    `learner generated index shrank from ${beforeLearnerIndex.length} to ${afterIndex.length}`);
  assert.ok((afterCurriculum.passagePractice || []).length >= beforePassages,
    `passage practice shrank from ${beforePassages} to ${(afterCurriculum.passagePractice || []).length}`);
  assert.ok(resourceCount(afterCurriculum) >= beforeResources,
    `learner resources shrank from ${beforeResources} to ${resourceCount(afterCurriculum)}`);
});

test('content build regenerates the runtime question-family registry', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'studo-family-runtime-'));
  const copy = path.join(tmp, 'studo');
  await fs.cp(ROOT, copy, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.git${path.sep}`) && !src.endsWith(`${path.sep}.git`),
  });

  const runtimeFile = path.join(copy, 'data', 'generated', 'question-families.js');
  await fs.rm(runtimeFile, { force: true });
  const result = spawnSync(process.execPath, ['scripts/build-content.mjs'], { cwd: copy, encoding: 'utf8' });
  assert.equal(result.status, 0, `build failed:\n${result.stdout}\n${result.stderr}`);
  const runtime = await fs.readFile(runtimeFile, 'utf8');
  assert.match(runtime, /window\.CheeQuestionFamilies/);
  assert.match(runtime, /canonicalize\(id\)/);
});

test('learner generated index excludes internal sample/demo modules', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'studo-index-visibility-'));
  const copy = path.join(tmp, 'studo');
  await fs.cp(ROOT, copy, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.git${path.sep}`) && !src.endsWith(`${path.sep}.git`),
  });
  const result = spawnSync(process.execPath, ['scripts/build-content.mjs'], { cwd: copy, encoding: 'utf8' });
  assert.equal(result.status, 0, `build failed:\n${result.stdout}\n${result.stderr}`);
  const index = JSON.parse(await fs.readFile(path.join(copy, 'data/generated/index.json'), 'utf8'));
  assert.equal(index.some((entry) => entry.file === 'generated/modules/sample-quiz.json'), false, 'sample-quiz must not ship in the learner catalog');
});

test('passage-practice sets stay in Passage Practice and do not appear on individual skill pages', async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'studo-passage-placement-'));
  const copy = path.join(tmp, 'studo');
  await fs.cp(ROOT, copy, {
    recursive: true,
    filter: (src) => !src.includes(`${path.sep}.git${path.sep}`) && !src.endsWith(`${path.sep}.git`),
  });

  const result = spawnSync(process.execPath, ['scripts/build-content.mjs'], {
    cwd: copy,
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, `build failed:\n${result.stdout}\n${result.stderr}`);

  const curriculum = JSON.parse(await fs.readFile(path.join(copy, 'data/generated/curriculum.json'), 'utf8'));
  const passageIds = new Set((curriculum.passagePractice || []).map((record) => record.id));
  assert.ok(passageIds.has('set-rla-core-transfer-heat-route'));
  assert.ok(passageIds.has('set-rla-core-transfer-handoff'));
  assert.ok(passageIds.has('set-rla-core-transfer-footbridge'));
  assert.ok(passageIds.has('set-rla-core-transfer-blue-folder'));

  const misplaced = [];
  for (const track of curriculum.tracks || []) {
    for (const domain of track.domains || []) {
      for (const skill of domain.skills || []) {
        for (const collectionName of ['sets', 'checks']) {
          for (const record of skill[collectionName] || []) {
            if (record.curriculum?.contentKind === 'passage_practice') {
              misplaced.push(`${skill.id}:${collectionName}:${record.id}`);
            }
          }
        }
      }
    }
  }
  assert.deepEqual(misplaced, [], `passage-practice sets leaked onto skill pages:\n${misplaced.join('\n')}`);
});
