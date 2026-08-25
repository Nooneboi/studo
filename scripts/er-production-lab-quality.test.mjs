import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const TASK_DIR = path.join(ROOT, 'content-src', 'er-tasks');
const GENERATED = path.join(ROOT, 'data', 'generated');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const exists = (file) => fs.existsSync(path.join(ROOT, file));

function taskFiles() {
  return fs.existsSync(TASK_DIR) ? fs.readdirSync(TASK_DIR).filter((f) => f.endsWith('.json')).sort() : [];
}

test('ER Production Lab has exactly six focused canonical production tasks', () => {
  assert.equal(fs.existsSync(TASK_DIR), true, 'content-src/er-tasks must exist');
  const files = taskFiles();
  assert.equal(files.length, 6);
  const tasks = files.map((f) => JSON.parse(fs.readFileSync(path.join(TASK_DIR, f), 'utf8')));
  assert.deepEqual(new Set(tasks.map((t) => t.taskType)), new Set([
    'evaluative_thesis','exact_evidence','evidence_analysis',
    'summary_to_analysis','body_development','revision_focus_clarity'
  ]));
  for (const task of tasks) {
    assert.equal(task.status, 'published');
    assert.ok(task.promptId);
    assert.ok(Array.isArray(task.skillIds) && task.skillIds.length >= 1);
    assert.ok(task.skillIds.every((id) => /^W1\./.test(id)));
    assert.ok(String(task.instruction || '').length >= 30);
    assert.ok(Array.isArray(task.successCriteria) && task.successCriteria.length >= 3 && task.successCriteria.length <= 5);
    assert.ok(String(task.modelResponse || '').length >= 40);
    assert.ok(Array.isArray(task.revisionPrompts) && task.revisionPrompts.length >= 1);
  }
});

test('content build emits learner-safe Production Lab data and curriculum cards', () => {
  assert.equal(exists('data/generated/er-production-tasks.json'), true, 'generated Production Lab data missing');
  const generated = readJson('data/generated/er-production-tasks.json');
  assert.equal(generated.tasks.length, 6);
  assert.ok(generated.tasks.every((t) => !('authoringNotes' in t)));
  const curriculum = readJson('data/generated/curriculum.json');
  assert.equal(curriculum.extendedResponseProduction?.length, 6);
});

test('ER workspace supports task mode without fake scoring or mastery history', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'extended-response.js'), 'utf8');
  assert.match(source, /er-production-tasks\.json/);
  assert.match(source, /get\(["']task["']\)/);
  assert.match(source, /studo\.er\.production\./);
  assert.match(source, /Production Lab/);
  assert.doesNotMatch(source, /Production Lab[\s\S]{0,1200}upsertHistory\(/);
  assert.doesNotMatch(source, /AI Score|Official GED Score|pass prediction|GED-equivalent/i);
});

test('ER domain separates Production Lab from full Extended Response practice', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js', 'domain.js'), 'utf8');
  assert.match(source, /curriculum\.extendedResponseProduction/);
  assert.match(source, />Production Lab</);
  assert.match(source, /extended-response\.html\?task=/);
  assert.match(source, /Full Extended Response Practice/);
});
