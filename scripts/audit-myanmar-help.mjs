#!/usr/bin/env node
// Report Myanmar teaching explanation coverage in generated Learn/Practice modules.
// Usage: node scripts/audit-myanmar-help.mjs
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = 'data/generated/modules';
if (!existsSync(root)) {
  console.error('Missing generated module directory: ' + root);
  process.exit(1);
}
const files = readdirSync(root).filter(name => name.endsWith('.json')).sort();
const hasText = (value) => typeof value === 'string' && value.trim().length > 0;
function sectionsValid(sections) {
  return Array.isArray(sections) && sections.some(s => s && hasText(s.body));
}
function hasMyanmarHelp(value) {
  if (hasText(value)) return true;
  if (!value || typeof value !== 'object') return false;
  if (sectionsValid(value.sections)) return true;
  return Object.values(value.byAnswer || {}).some(sectionsValid);
}
let total = 0, covered = 0, invalid = 0;
const uncovered = [];
for (const file of files) {
  let module;
  try { module = JSON.parse(readFileSync(join(root, file), 'utf8')); }
  catch (err) {
    console.error('Invalid module JSON: ' + file + ' — ' + err.message);
    invalid++;
    continue;
  }
  if (!Array.isArray(module.questions)) continue;
  for (const q of module.questions) {
    total++;
    if (hasMyanmarHelp(q.myanmarExplanation)) covered++;
    else uncovered.push({file, questionId: q.id ?? '(unknown)', skillId: q.skill?.id ?? module.contentMeta?.curriculum?.primarySkillId ?? 'unknown'});
  }
}
const summary = {moduleFiles: files.length, questions: total, withMyanmarHelp: covered, withoutMyanmarHelp: total-covered, invalidModuleFiles: invalid, coveragePercent: total ? +(100*covered/total).toFixed(1) : 0};
console.log(JSON.stringify({summary, missing: uncovered}, null, 2));
if (invalid) process.exitCode = 1;
