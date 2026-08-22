import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from './validate-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GENERATED = path.join(ROOT, 'data', 'generated');

async function json(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

function isReadingIssue(issue) {
  const file = String(issue.file || '');
  if (file.includes('set-rla-writing-') || file.includes('set-rla-grammar-')) return false;
  if (file.includes('content-src/legacy-modules/')) return true;
  if (file.includes('content-src/sets/set-rla-core-')) return true;
  if (file.includes('content-src/sets/set-rla-reading-')) return true;
  if (file.includes('content-src/sets/set-rla-evidence-')) return true;
  return false;
}

test('published Reading bank has no cyclic answer-position or long-run warnings', async () => {
  const result = await validateContent({ quiet: true });
  const bad = result.warnings.filter((issue) => isReadingIssue(issue) && ['ANSWER_POSITION_PATTERN','ANSWER_POSITION_RUN','ANSWER_POSITION_BIAS'].includes(issue.code));
  assert.deepEqual(bad, [], `Reading answer-position warnings remain:\n${bad.map((x) => `${x.code} ${x.file}`).join('\n')}`);
});

test('published Reading bank does not reuse generic whyWrong feedback excessively', async () => {
  const result = await validateContent({ quiet: true });
  const bad = result.warnings.filter((issue) => isReadingIssue(issue) && issue.code === 'WHY_WRONG_REUSED');
  assert.deepEqual(bad, [], `Reading generic whyWrong warnings remain:\n${bad.map((x) => x.file).join('\n')}`);
});

test('learner Passage Practice contains only 400-900 word passages and includes stamina texts', async () => {
  const curriculum = await json(path.join(GENERATED, 'curriculum.json'));
  assert.ok(Array.isArray(curriculum.passagePractice) && curriculum.passagePractice.length > 0);
  let longCount = 0;
  for (const entry of curriculum.passagePractice) {
    const moduleFile = path.join(ROOT, 'data', entry.file);
    const module = await json(moduleFile);
    const words = String(module.passage || '').trim().split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 400, `${entry.title} is only ${words} words but is learner Passage Practice`);
    assert.ok(words <= 900, `${entry.title} is ${words} words, above the 900-word training target`);
    if (words >= 600) longCount += 1;
  }
  assert.ok(longCount >= 4, `expected at least four 600+ word Passage Practice texts, found ${longCount}`);
});

test('published Reading resources and module references resolve after build', async () => {
  const curriculum = await json(path.join(GENERATED, 'curriculum.json'));
  const reading = curriculum.tracks.find((track) => track.id === 'reading');
  assert.ok(reading, 'Reading track must remain published');
  for (const domain of reading.domains) {
    for (const skill of domain.skills) {
      for (const record of [...(skill.sets || []), ...(skill.checks || [])]) {
        await fs.access(path.join(ROOT, 'data', record.file));
      }
      for (const resource of skill.resources || []) {
        await fs.access(path.join(ROOT, resource.href));
      }
    }
  }
});
