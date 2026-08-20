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

  assert.ok(afterIndex.length >= beforeIndex.length,
    `generated index shrank from ${beforeIndex.length} to ${afterIndex.length}`);
  assert.ok((afterCurriculum.passagePractice || []).length >= beforePassages,
    `passage practice shrank from ${beforePassages} to ${(afterCurriculum.passagePractice || []).length}`);
  assert.ok(resourceCount(afterCurriculum) >= beforeResources,
    `learner resources shrank from ${beforeResources} to ${resourceCount(afterCurriculum)}`);
});
