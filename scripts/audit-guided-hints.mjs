#!/usr/bin/env node
// Editorial triage of authored RLA practice hints; findings require human review.
// Usage: node scripts/audit-guided-hints.mjs
import fs from 'node:fs';
import path from 'node:path';

const directory = 'content-src/sets';
const files = fs.readdirSync(directory).filter(f => f.endsWith('.json') && !f.includes('-check-') && !f.includes('-mock-'));
const rows = [];
let guided = 0;
for (const file of files) {
  const set = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8'));
  for (const q of set.questions || []) {
    if (q.learningStage !== 'guided') continue;
    guided++;
    const hint = String(q.hint || '').trim();
    const flags = [];
    if (!hint) flags.push('missing-hint');
    if (hint && hint.length < 65) flags.push('short-hint-review');
    if (hint && /\\b(?:the correct answer is|the answer is|choose (?:option|choice) [a-d]|select (?:option|choice) [a-d]|pick (?:option|choice) [a-d])\\b/i.test(hint)) flags.push('possible-answer-cue');
    if (hint && /\b(?:option|choice)\s+[a-d]\b/i.test(hint)) flags.push('names-option');
    if (flags.length) rows.push({file, questionId:q.id, type:q.type, flags});
  }
}
const report = {auditedFiles:files.length, guidedQuestions:guided, flaggedQuestions:rows.length, flags:rows};
console.log(JSON.stringify(report, null, 2));
if (process.argv.includes('--strict') && rows.some(r => r.flags.includes('missing-hint') || r.flags.includes('names-option'))) process.exitCode = 1;
