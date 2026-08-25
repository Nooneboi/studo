import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const words = (text) => String(text || '').trim().split(/\s+/).filter(Boolean).length;

async function loadEngine() {
  delete globalThis.QuestionInteractions;
  delete globalThis.MockEngine;
  await import(`${pathToFileURL(path.join(ROOT, 'js/question-interactions.js')).href}?i=${Date.now()}`);
  await import(`${pathToFileURL(path.join(ROOT, 'js/mock-engine.js')).href}?t=${Date.now()}`);
  return globalThis.MockEngine;
}

function loadModules() {
  const index = readJson('data/generated/index.json');
  return index.map((entry) => ({ ...entry, ...readJson(path.join('data', entry.file)), file: entry.file }));
}

function counts(values) {
  return values.reduce((acc, value) => (acc[value] = (acc[value] || 0) + 1, acc), {});
}

function mockRole(module) {
  return module?.curriculum?.deliveryRoles || module?.contentMeta?.curriculum?.deliveryRoles || [];
}

test('Phase 5 canonical V2 blueprint defines three fixed forms and disables fallback', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'content-src/config/rla-mock-v2.json')), true, 'missing rla-mock-v2.json');
  const blueprint = readJson('content-src/config/rla-mock-v2.json');
  assert.equal(blueprint.version, 'rla-mock-v2');
  assert.equal(blueprint.full.objectiveQuestionCount, 46);
  assert.equal(blueprint.full.part1.questionCount, 14);
  assert.equal(blueprint.full.part3.questionCount, 32);
  assert.equal(blueprint.full.er.seconds, 2700);
  assert.equal(blueprint.full.break.seconds, 600);
  assert.deepEqual(blueprint.reportingCategoryTargets, { '1': 16, '2': 21, '3': 9 });
  assert.equal(blueprint.selection.allowPracticeFallback, false);
  assert.equal(blueprint.selection.rotation, 'least-recently-used');
  assert.equal(blueprint.forms.length, 3);
  assert.deepEqual(blueprint.forms.map((f) => f.id), ['rla-mock-form-a','rla-mock-form-b','rla-mock-form-c']);
  for (const form of blueprint.forms) {
    assert.equal(form.part1ModuleIds.length, 2);
    assert.equal(form.part3ModuleIds.length, 5);
    assert.match(form.erPromptId, /^mock-er-[abc]$/);
  }
});

test('clean build emits V2 blueprint and a separate learner-safe mock ER payload', () => {
  execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: ROOT, stdio: 'pipe' });
  const blueprint = readJson('data/generated/mock-blueprint.json');
  const mockEr = readJson('data/generated/mock-er-prompts.json');
  const ordinaryEr = readJson('data/generated/er-prompts.json');
  assert.equal(blueprint.version, 'rla-mock-v2');
  assert.equal(mockEr.prompts.length, 3);
  assert.equal(new Set(mockEr.prompts.map((p) => p.id)).size, 3);
  const ordinaryIds = new Set(ordinaryEr.prompts.map((p) => p.id));
  for (const prompt of mockEr.prompts) {
    assert.equal(ordinaryIds.has(prompt.id), false, `${prompt.id} leaked into ordinary ER Practice`);
    assert.equal(Object.hasOwn(prompt, 'strongerSource'), false);
    assert.equal(Object.hasOwn(prompt, 'authoringKey'), false);
    const totalWords = words(prompt.sourceA?.text) + words(prompt.sourceB?.text);
    assert.ok(totalWords >= 550 && totalWords <= 650, `${prompt.id} source total ${totalWords} outside 550–650`);
  }
});

test('dedicated bank contains 21 mock-only modules and 138 questions with no learning scaffolding', () => {
  const modules = loadModules();
  const mockModules = modules.filter((m) => mockRole(m).includes('mock'));
  assert.equal(mockModules.length, 21);
  assert.equal(mockModules.reduce((n, m) => n + (m.questions || []).length, 0), 138);
  for (const module of mockModules) {
    assert.deepEqual(mockRole(module), ['mock'], `${module.id} must be mock-only`);
    for (const q of module.questions || []) {
      assert.equal('hint' in q, false, `${module.id}:${q.id} leaked hint scaffolding`);
      assert.equal('learningStage' in q, false, `${module.id}:${q.id} leaked learningStage scaffolding`);
      assert.equal('confidence' in q, false, `${module.id}:${q.id} leaked confidence scaffolding`);
      assert.equal('retry' in q, false, `${module.id}:${q.id} leaked retry scaffolding`);
      assert.ok([1,2,3].includes(Number(q.metadata?.reportingCategory)), `${module.id}:${q.id} missing reportingCategory`);
    }
  }
});

test('each fixed form satisfies source-set, category, item-type, DOK and passage contracts', () => {
  const blueprint = readJson('content-src/config/rla-mock-v2.json');
  const modules = loadModules();
  const moduleMap = new Map(modules.map((m) => [m.id, m]));
  const allFormModuleIds = [];
  const allPassageTexts = [];

  for (const form of blueprint.forms) {
    const ids = [...form.part1ModuleIds, ...form.part3ModuleIds];
    allFormModuleIds.push(...ids);
    assert.equal(ids.length, 7);
    assert.equal(new Set(ids).size, 7);
    const formModules = ids.map((id) => {
      const module = moduleMap.get(id);
      assert.ok(module, `${form.id} missing module ${id}`);
      return module;
    });
    assert.deepEqual(formModules.slice(0,2).map((m) => m.questions.length), [7,7]);
    assert.deepEqual(formModules.slice(2).map((m) => m.questions.length), [8,6,6,6,6]);
    assert.equal(formModules.reduce((n,m) => n + m.questions.length, 0), 46);

    const questions = formModules.flatMap((m) => m.questions);
    assert.deepEqual(counts(questions.map((q) => String(q.metadata.reportingCategory))), { '1':16, '2':21, '3':9 });
    const typeCounts = counts(questions.map((q) => q.type));
    assert.equal(typeCounts.multiple_choice, 34);
    assert.equal(typeCounts.grammar_edit, 8);
    assert.equal(typeCounts.select_text, 2);
    assert.equal((typeCounts.drag_sort || 0) + (typeCounts.drag_order || 0), 2);
    assert.equal(Object.values(typeCounts).reduce((n,x) => n + x, 0), 46);
    for (const q of questions.filter((q) => q.type === 'multiple_choice')) assert.equal(q.options?.length, 4, `${form.id}:${q.id} MC must have four options`);

    const passageTypes = formModules.map((m) => m.contentMeta?.passage?.textType || 'informational');
    assert.equal(passageTypes.filter((x) => x === 'literary').length, 2, `${form.id} needs two literary sets`);
    assert.equal(passageTypes.filter((x) => x !== 'literary').length, 5, `${form.id} needs five informational/editing sets`);
    const contexts = new Set(formModules.map((m) => m.contentMeta?.passage?.context));
    for (const required of ['civics','science','workplace','data']) assert.ok(contexts.has(required), `${form.id} missing ${required} context`);

    const editingModules = formModules.filter((m) => m.questions.some((q) => q.type === 'grammar_edit'));
    assert.equal(editingModules.length, 1, `${form.id} needs exactly one editing set`);
    assert.equal(editingModules[0].questions.length, 8);
    assert.equal(editingModules[0].questions.every((q) => q.type === 'grammar_edit'), true);

    let hasStamina = false;
    for (const module of formModules) {
      const wc = words(module.passage);
      allPassageTexts.push(String(module.passage || '').trim().replace(/\s+/g,' ').toLowerCase());
      if (module === editingModules[0]) assert.ok(wc <= 450, `${module.id} editing passage too long: ${wc}`);
      else assert.ok(wc >= 400 && wc <= 900, `${module.id} passage length ${wc} outside 400–900`);
      if (wc >= 600) hasStamina = true;
    }
    assert.equal(hasStamina, true, `${form.id} needs a 600+ word stamina source`);

    const dok = counts(questions.map((q) => String(q.metadata?.dok)));
    assert.ok(dok['1'] > 0 && dok['2'] > 0 && dok['3'] > 0, `${form.id} must contain DOK 1–3`);
    assert.ok(dok['2'] > dok['1'] && dok['2'] > dok['3'], `${form.id} DOK 2 must be largest band`);
  }

  assert.equal(new Set(allFormModuleIds).size, 21, 'module overlap across forms');
  assert.equal(new Set(allPassageTexts).size, 21, 'passage text overlap across forms');
});

test('full mock engine selects fixed forms, rotates all three before repeat, and objective practice stays on Practice', async () => {
  const engine = await loadEngine();
  const modules = loadModules();
  const blueprint = readJson('content-src/config/rla-mock-v2.json');
  const prompts = readJson('data/generated/mock-er-prompts.json').prompts;

  const first = engine.generateFullMock({ modules, prompts, blueprint, history: [] });
  const second = engine.generateFullMock({ modules, prompts, blueprint, history: [{ formId:first.formId, completedAt:'2026-08-25T01:00:00Z' }] });
  const third = engine.generateFullMock({ modules, prompts, blueprint, history: [
    { formId:first.formId, completedAt:'2026-08-25T01:00:00Z' },
    { formId:second.formId, completedAt:'2026-08-25T02:00:00Z' }
  ] });
  assert.equal(new Set([first.formId, second.formId, third.formId]).size, 3);
  const fourth = engine.generateFullMock({ modules, prompts, blueprint, history: [
    { formId:first.formId, completedAt:'2026-08-25T01:00:00Z' },
    { formId:second.formId, completedAt:'2026-08-25T02:00:00Z' },
    { formId:third.formId, completedAt:'2026-08-25T03:00:00Z' }
  ]});
  assert.equal(fourth.formId, first.formId, 'after all forms, least-recently-used should be selected');
  assert.equal(engine.chooseFullMockFormId({ blueprint, history: [], activeFormId:'rla-mock-form-c' }), 'rla-mock-form-c');

  for (const generated of [first,second,third,fourth]) {
    assert.equal(generated.part1.length, 14);
    assert.equal(generated.part3.length, 32);
    assert.equal(generated.bankMode, 'mock_only');
    assert.equal(generated.erPromptId, blueprint.forms.find((f) => f.id === generated.formId).erPromptId);
  }

  const objective = engine.generateObjectivePractice({ modules, blueprint, seed:'phase5-objective' });
  const moduleMap = new Map(modules.map((m) => [m.id,m]));
  assert.equal(objective.items.length, 30);
  for (const item of objective.items) assert.equal(mockRole(moduleMap.get(item.moduleId)).includes('practice'), true, `${item.moduleId} is not Practice role`);
  assert.equal(objective.items.some((item) => mockRole(moduleMap.get(item.moduleId)).includes('mock')), false, 'Objective Practice burned mock-only content');
});

test('full attempts and history preserve formId and reporting-category raw evidence', async () => {
  const engine = await loadEngine();
  const modules = loadModules();
  const moduleMap = new Map(modules.map((m) => [m.id,m]));
  const blueprint = readJson('content-src/config/rla-mock-v2.json');
  const prompts = readJson('data/generated/mock-er-prompts.json').prompts;
  const generated = engine.generateFullMock({ modules, prompts, blueprint, history: [] });
  const attempt = engine.createAttempt(generated, blueprint, 1_000_000, 'phase5-attempt');
  assert.equal(attempt.formId, generated.formId);
  for (const stage of [attempt.part1, attempt.part3]) {
    for (const item of stage.items) {
      const q = moduleMap.get(item.moduleId).questions.find((x) => x.id === item.questionId);
      stage.answers[engine.objectiveItemKey(item)] = q.correct;
    }
  }
  const score = engine.scoreObjectiveAttempt(attempt, moduleMap);
  assert.equal(score.correct, 46);
  assert.deepEqual(Object.fromEntries(Object.entries(score.reportingCategories).map(([k,v]) => [k,v.total])), { '1':16, '2':21, '3':9 });
  const history = engine.sanitizeAttemptForHistory(attempt);
  assert.equal(history.formId, generated.formId);
  assert.equal('scaledScore' in score, false);
  assert.equal('pass' in score, false);
});

test('learner UI uses Full RLA Mock, mock-only ER loading, published-style result labels, and no fallback claims', () => {
  const quiz = fs.readFileSync(path.join(ROOT, 'quiz.html'), 'utf8');
  const quizJs = fs.readFileSync(path.join(ROOT, 'js/quiz.js'), 'utf8');
  const testJs = fs.readFileSync(path.join(ROOT, 'js/test.js'), 'utf8');
  const erJs = fs.readFileSync(path.join(ROOT, 'js/extended-response.js'), 'utf8');
  const progress = fs.readFileSync(path.join(ROOT, 'js/progress.js'), 'utf8');
  const joined = `${quiz}\n${quizJs}\n${testJs}`;
  assert.match(joined, /Full RLA Mock/);
  assert.match(joined, /unseen/i);
  assert.match(testJs, /Text Features & Technique/);
  assert.match(testJs, /Evidence & Arguments/);
  assert.match(testJs, /Language Conventions/);
  assert.doesNotMatch(joined, /Practice bank.*format and timing|practice_fallback/i);
  assert.doesNotMatch(joined, /scaled score estimate|pass probability|College Ready/i);
  assert.match(erJs, /mock-er-prompts\.json/);
  assert.match(erJs, /mockAttemptId/);
  assert.match(erJs, /attempt\.er\.promptId|savedAttempt\.er\.promptId/);
  assert.match(progress, /formId/);
  assert.match(progress, /reportingCategories/);
  assert.match(progress, /Self-review/i);
});

test('public build ships the dedicated mock ER payload required by deployed Full Mock', () => {
  const builder = fs.readFileSync(path.join(ROOT, 'scripts/build-public.mjs'), 'utf8');
  assert.match(builder, /mock-er-prompts\.json/);
});
