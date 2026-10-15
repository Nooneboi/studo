#!/usr/bin/env node
// QA for the four editorial Myanmar explanation batches.
// Usage: node scripts/qa-myanmar-batches.mjs
import fs from 'node:fs';
import path from 'node:path';
const lessons = [
  'set-rla-args-text-data-formats',
  'set-rla-supporting-details-active-methods-v1',
  'set-rla-inference-active-methods-v1',
  'set-rla-summary-active-methods-v1',
];
const issues = [];
let questions = 0;
for (const name of lessons) {
  const src = JSON.parse(fs.readFileSync(path.join('content-src/sets', name + '.json'), 'utf8'));
  const out = JSON.parse(fs.readFileSync(path.join('data/generated/modules', name + '.json'), 'utf8'));
  const runtimeById = new Map((out.questions || []).map(q => [q.id, q]));
  for (const q of src.questions || []) {
    questions++;
    const label = name + '/' + q.id;
    const runtime = runtimeById.get(q.id);
    const help = q.explanation?.myanmar;
    if (!runtime) { issues.push(label + ': missing runtime question'); continue; }
    if (!Array.isArray(help?.sections) || !help.sections.length ||
        help.sections.some(s => !s?.title?.trim() || !s?.body?.trim())) {
      issues.push(label + ': empty or malformed Myanmar teaching sections');
    }
    if (JSON.stringify(help) !== JSON.stringify(runtime.myanmarExplanation)) {
      issues.push(label + ': source and runtime Myanmar help differ');
    }
    if (Array.isArray(q.options)) {
      if (!q.options.some(option => option.id === q.correct)) {
        issues.push(label + ': answer key does not reference an option');
      }
      const ids = q.options.map(option => String(option.id));
      if (ids.some((id, index) => id !== String.fromCharCode(97 + index))) {
        issues.push(label + ': displayed multiple-choice options are not in A–D order');
      }
      const declared = q.explanation?.answer;
      if (/^[A-Z]$/.test(declared || '') && declared.toLowerCase() !== q.correct) {
        issues.push(label + ': explanation answer label does not match answer key');
      }
    }
  }
  if ((out.questions || []).length !== (src.questions || []).length) {
    issues.push(name + ': generated question count differs from source');
  }
}
console.log(JSON.stringify({lessons: lessons.length, questions, errors: issues.length, issues}, null, 2));
if (issues.length) process.exitCode = 1;
