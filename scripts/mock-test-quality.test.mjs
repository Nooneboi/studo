import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

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

test('Mock V2 canonical blueprint and pure engine exist', () => {
  assert.equal(fs.existsSync(path.join(ROOT, 'content-src/config/rla-mock-v2.json')), true, 'missing canonical mock blueprint');
  assert.equal(fs.existsSync(path.join(ROOT, 'js/mock-engine.js')), true, 'missing pure mock engine');
});

test('clean build emits the canonical learner mock blueprint', () => {
  execFileSync(process.execPath, ['scripts/build-content.mjs'], { cwd: ROOT, stdio: 'pipe' });
  const generated = readJson('data/generated/mock-blueprint.json');
  assert.equal(generated.version, 'rla-mock-v2');
  assert.equal(generated.full.objectiveQuestionCount, 46);
  assert.equal(generated.full.part1.questionCount, 14);
  assert.equal(generated.full.part3.questionCount, 32);
  assert.equal(generated.full.er.seconds, 2700);
  assert.equal(generated.full.break.seconds, 600);
});

test('100 seeded full mocks satisfy counts, coverage, source integrity and stamina requirements', async () => {
  const engine = await loadEngine();
  const modules = loadModules();
  const prompts = readJson('data/generated/er-prompts.json').prompts;
  const blueprint = readJson('content-src/config/rla-mock-v1.json');
  for (let seed = 1; seed <= 100; seed += 1) {
    const mock = engine.generateFullMock({ modules, prompts, blueprint, seed });
    assert.equal(mock.part1.length, 14, `seed ${seed} p1`);
    assert.equal(mock.part3.length, 32, `seed ${seed} p3`);
    const all = [...mock.part1, ...mock.part3];
    assert.equal(all.length, 46);
    const qKeys = all.map((x) => `${x.moduleId}:${x.questionId}`);
    assert.equal(new Set(qKeys).size, 46, `seed ${seed} duplicate question`);
    const counts = all.reduce((o, item) => (o[item.category] = (o[item.category] || 0) + 1, o), {});
    assert.deepEqual(counts, { reading: 25, arguments: 10, language_conventions: 11 });
    assert.equal(mock.selectedReadingSets.length, 3);
    assert.equal(mock.selectedReadingSets.filter((x) => x.textType === 'literary').length, 1);
    assert.ok(mock.selectedReadingSets.some((x) => x.words >= 600), `seed ${seed} missing stamina passage`);
    assert.ok(prompts.some((p) => p.id === mock.erPromptId));
  }
});


test('mock scoring handles canonical select, sort, order, and dropdown answers', async () => {
  const engine = await loadEngine();
  const moduleMap = new Map([['m1', {
    questions: [
      {id:'q1',type:'select_text',correct:'s2',interaction:{targets:[{id:'s1',text:'One'},{id:'s2',text:'Two'}]},skill:{id:'R1.2',label:'Main idea'}},
      {id:'q2',type:'drag_sort',correct:'d1=yes|d2=no',interaction:{items:[{id:'d1'},{id:'d2'}],zones:[{id:'yes'},{id:'no'}]},skill:{id:'R1.2',label:'Main idea'}},
      {id:'q3',type:'drag_order',correct:'o2|o1|o3',interaction:{items:[{id:'o1'},{id:'o2'},{id:'o3'}]},skill:{id:'R1.2',label:'Main idea'}},
      {id:'q4',type:'grammar_edit',correct:'b',options:[{id:'a',text:'was'},{id:'b',text:'were'}],skill:{id:'L1.1',label:'Agreement'}}
    ]
  }]]);
  const items = [1,2,3,4].map((n) => ({moduleId:'m1',questionId:`q${n}`,category:n === 4 ? 'language_conventions' : 'reading'}));
  const attempt = { mode:'objective', objective:{items,answers:{'m1:q1':'s2','m1:q2':'d2=no|d1=yes','m1:q3':'o2|o1|o3','m1:q4':'b'},flags:{}} };
  assert.equal(engine.scoreObjectiveAttempt(attempt, moduleMap).correct, 4);
});

test('mock eligibility rejects active-learning modules tagged mock-excluded', async () => {
  const engine = await loadEngine();
  assert.equal(engine.isMockEligible({ curriculum:{ practiceTags:['mock-excluded'] } }), false);
  assert.equal(engine.isMockEligible({ curriculum:{ practiceTags:['transfer','active-learning'] } }), true);
  assert.equal(engine.isMockEligible({}), true);
});

test('attempt recovery helpers use fixed selected IDs and timestamp-based timing', async () => {
  const engine = await loadEngine();
  const modules = loadModules();
  const prompts = readJson('data/generated/er-prompts.json').prompts;
  const blueprint = readJson('content-src/config/rla-mock-v1.json');
  const generated = engine.generateFullMock({ modules, prompts, blueprint, seed: 42 });
  const attempt = engine.createAttempt(generated, blueprint, 1_000_000, 'mock-fixed');
  const snapshot = JSON.parse(JSON.stringify(attempt));
  assert.equal(snapshot.attemptId, 'mock-fixed');
  assert.deepEqual(snapshot.part1.items, generated.part1);
  assert.equal(engine.remainingSeconds(snapshot.part1, 1_010_000), blueprint.full.part1.seconds - 10);
  snapshot.part1.answers[engine.objectiveItemKey(snapshot.part1.items[0])] = 'a';
  snapshot.part1.flags[engine.objectiveItemKey(snapshot.part1.items[1])] = true;
  const restored = JSON.parse(JSON.stringify(snapshot));
  assert.deepEqual(restored.part1.items, snapshot.part1.items);
  assert.deepEqual(restored.part1.answers, snapshot.part1.answers);
  assert.deepEqual(restored.part1.flags, snapshot.part1.flags);
});

test('objective scoring excludes ER and never invents scaled/pass fields', async () => {
  const engine = await loadEngine();
  const modules = loadModules();
  const moduleMap = new Map(modules.map((m) => [m.id, m]));
  const prompts = readJson('data/generated/er-prompts.json').prompts;
  const blueprint = readJson('content-src/config/rla-mock-v1.json');
  const generated = engine.generateFullMock({ modules, prompts, blueprint, seed: 17 });
  const attempt = engine.createAttempt(generated, blueprint, Date.now(), 'score-test');
  for (const stage of [attempt.part1, attempt.part3]) {
    for (const item of stage.items) {
      const module = moduleMap.get(item.moduleId);
      const q = module.questions.find((x) => x.id === item.questionId);
      stage.answers[engine.objectiveItemKey(item)] = q.correct;
    }
  }
  attempt.er.selfScores = { argument: 2, organization: 2, english: 2 };
  const score = engine.scoreObjectiveAttempt(attempt, moduleMap);
  assert.equal(score.total, 46);
  assert.equal(score.correct, 46);
  assert.equal(score.accuracy, 100);
  assert.equal('scaledScore' in score, false);
  assert.equal('pass' in score, false);
  assert.equal('erScore' in score, false);
});

test('learner ER prompt payload contains no authoring answer key fields', () => {
  const payload = readJson('data/generated/er-prompts.json');
  for (const prompt of payload.prompts) {
    assert.equal(Object.hasOwn(prompt, 'strongerSource'), false);
    assert.equal(Object.hasOwn(prompt, 'authoringKey'), false);
  }
});

test('Quiz and Test pages no longer describe the legacy all-question test', () => {
  const quiz = fs.readFileSync(path.join(ROOT, 'quiz.html'), 'utf8');
  const quizJs = fs.readFileSync(path.join(ROOT, 'js/quiz.js'), 'utf8');
  const testJs = fs.readFileSync(path.join(ROOT, 'js/test.js'), 'utf8');
  assert.doesNotMatch(quiz, /every matching question gets pulled/i);
  assert.doesNotMatch(quizJs, /loadAllQuizzes\(\).*flatMap/s);
  assert.doesNotMatch(testJs, /items\s*=\s*modules\.flatMap/);
  assert.match(quiz, /Full RLA Mock/i);
  assert.match(quiz, /46 objective/i);
});

test('mock workspace contract includes flags, review, break, raw results and no scaled-score language', () => {
  const html = fs.readFileSync(path.join(ROOT, 'test.html'), 'utf8');
  const js = fs.readFileSync(path.join(ROOT, 'js/test.js'), 'utf8');
  assert.match(html, /Flag for review/i);
  assert.match(js, /rlaMockAttempts/);
  assert.match(js, /break/i);
  assert.match(js, /Text Features & Technique/);
  assert.match(js, /Evidence & Arguments/);
  assert.match(js, /Language Conventions/);
  assert.doesNotMatch(`${html}\n${js}`, /scaledScore|College Ready/i);
  assert.match(js, /not an official GED score or pass prediction/i);
});

test('mock ER state is attempt-scoped and provides a return-to-mock action after submission', () => {
  const er = fs.readFileSync(path.join(ROOT, 'js/extended-response.js'), 'utf8');
  assert.match(er, /params\.get\("attempt"\)/);
  assert.match(er, /sq:er:mock:/);
  assert.match(er, /Return to mock/i);
});

test('Progress exposes separate Mock Tests history without mixing ER self-review into objective mastery', () => {
  const progress = fs.readFileSync(path.join(ROOT, 'js/progress.js'), 'utf8');
  assert.match(progress, /rlaMockAttempts/);
  assert.match(progress, /Mock Tests/);
  assert.match(progress, /Objective/i);
  assert.match(progress, /Self-review/i);
});

test('no learner navigation links to the retired subject/category test route', () => {
  const files = ['js/category.js','js/practice.js','js/home.js','index.html','practice.html','quiz.html'];
  for (const file of files) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.doesNotMatch(text, /test\.html\?subject=/, `${file} still links to legacy all-question test route`);
  }
});

test('objective practice generator creates a bounded 30-question mixed-domain form', async () => {
  const engine = await loadEngine();
  const modules = loadModules();
  const blueprint = readJson('content-src/config/rla-mock-v1.json');
  for (let seed = 1; seed <= 40; seed += 1) {
    const practice = engine.generateObjectivePractice({ modules, blueprint, seed: `obj-${seed}` });
    assert.equal(practice.items.length, 30);
    const counts = practice.items.reduce((o, item) => (o[item.category] = (o[item.category] || 0) + 1, o), {});
    assert.deepEqual(counts, { reading: 17, arguments: 6, language_conventions: 7 });
    const keys = practice.items.map((x) => `${x.moduleId}:${x.questionId}`);
    assert.equal(new Set(keys).size, 30);
  }
});

test('results can report section time used from timestamps', async () => {
  const engine = await loadEngine();
  const stage = { seconds: 1620, startedAt: 1_000_000, submittedAt: new Date(1_600_000).toISOString(), items: [], answers: {}, flags: {} };
  assert.equal(engine.stageTimeUsedSeconds(stage), 600);
  const testJs = fs.readFileSync(path.join(ROOT, 'js/test.js'), 'utf8');
  assert.match(testJs, /Time used/i);
});

test('mock scoring exposes skill breakdown without changing raw objective totals', async () => {
  const engine = await loadEngine();
  const modules = loadModules();
  const moduleMap = new Map(modules.map((m) => [m.id, m]));
  const prompts = readJson('data/generated/er-prompts.json').prompts;
  const blueprint = readJson('content-src/config/rla-mock-v1.json');
  const generated = engine.generateFullMock({ modules, prompts, blueprint, seed: 314 });
  const attempt = engine.createAttempt(generated, blueprint, Date.now(), 'skill-breakdown');
  for (const stage of [attempt.part1, attempt.part3]) {
    for (const item of stage.items) {
      const module = moduleMap.get(item.moduleId);
      const q = module.questions.find((x) => x.id === item.questionId);
      stage.answers[engine.objectiveItemKey(item)] = q.correct;
    }
  }
  const score = engine.scoreObjectiveAttempt(attempt, moduleMap);
  assert.ok(score.skills && Object.keys(score.skills).length > 0, 'missing skill breakdown');
  assert.equal(Object.values(score.skills).reduce((n, b) => n + b.total, 0), 46);
  assert.equal(Object.values(score.skills).reduce((n, b) => n + b.correct, 0), 46);
});

test('grammar-edit items use a dropdown interaction in the mock workspace', () => {
  const js = fs.readFileSync(path.join(ROOT, 'js/test.js'), 'utf8');
  assert.match(js, /mock-edit-select/);
  assert.match(js, /<select/);
});

test('section review keeps strict timing active and results expose post-test answer review', () => {
  const js = fs.readFileSync(path.join(ROOT, 'js/test.js'), 'utf8');
  const reviewStart = js.indexOf('function renderSectionReview()');
  const reviewEnd = js.indexOf('function submitObjectiveStage', reviewStart);
  const reviewBlock = js.slice(reviewStart, reviewEnd);
  assert.doesNotMatch(reviewBlock, /stopTimer\(\)/, 'section review pauses the active timer');
  assert.match(js, /Review objective answers/i);
  assert.match(js, /whyWrong|explanation/);
});
