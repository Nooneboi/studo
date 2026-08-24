import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const json = (rel) => JSON.parse(read(rel));

test('V2 schema and compiler preserve authored learning stages and hints', () => {
  const schema = json('schemas/studo-content-v2.schema.json');
  const questionProps = schema.$defs.question.properties;
  assert.deepEqual(questionProps.learningStage.enum, ['guided', 'apply', 'independent']);
  assert.equal(questionProps.hint.type, 'string');
  assert.deepEqual(questionProps.interaction.properties.presentation.enum, ['choice_rows', 'drag_board']);

  const build = read('scripts/build-content.mjs');
  assert.match(build, /if \(q\.learningStage\) out\.learningStage = q\.learningStage/);
  assert.match(build, /if \(q\.hint\) out\.hint = q\.hint/);
});

test('Main Idea V2 follows a predictable Guided Apply Independent progression with direct prompts', () => {
  const source = json('content-src/sets/set-rla-mainidea-active-methods-v1.json');
  assert.ok(source.curriculum.practiceTags.includes('active-learning'));
  assert.ok(source.curriculum.practiceTags.includes('mock-excluded'));
  assert.deepEqual(source.questions.map((q) => q.learningStage), ['guided','guided','apply','apply','independent','independent']);
  assert.ok(source.questions[0].hint && source.questions[1].hint, 'guided questions should offer authored help');
  assert.ok(source.questions[3].hint, 'the scope-classification Apply task should offer one concise authored hint');
  assert.equal(source.questions[4].hint, undefined, 'independent evidence selection should not expose a hint');
  assert.equal(source.questions[5].hint, undefined, 'independent MCQ should not expose a hint');
  assert.equal(source.questions[0].prompt, 'How important is each statement to the passage’s main point?');
  assert.equal(source.questions[0].interaction.presentation, 'choice_rows');
  assert.equal(source.questions[3].interaction.presentation, 'choice_rows');
  assert.equal(source.questions[1].prompt, 'Which sentence best shows what the measurements taught the city?');
  assert.equal(source.questions[3].prompt, 'How well does each statement fit the whole passage?');
  assert.equal(source.questions[4].prompt, 'Which sentence best supports the idea that a good plan had to reduce heat without making the route harder to use?');
});

test('compiled Main Idea module keeps V2 learning metadata', () => {
  const runtime = json('data/generated/modules/set-rla-mainidea-active-methods-v1.json');
  assert.deepEqual(runtime.questions.map((q) => q.learningStage), ['guided','guided','apply','apply','independent','independent']);
  assert.equal(runtime.questions[0].hint.length > 10, true);
});

test('active-learning Practice keeps the unanswered workspace focused on the task itself', () => {
  const moduleJs = read('js/module.js');
  assert.match(moduleJs, /function isGuidedLearningModule\(/);
  assert.match(moduleJs, /practiceTags[^\n]+active-learning|active-learning[^\n]+practiceTags/);
  assert.match(moduleJs, /guided-learning-workspace/);
  assert.match(moduleJs, /guided-stage-line/);

  const currentQuestion = moduleJs.match(/function renderCurrentQuestion[\s\S]*?function questionDetail/)?.[0] || '';
  assert.ok(currentQuestion, 'guided renderCurrentQuestion section should exist');
  assert.doesNotMatch(currentQuestion, /guided-hint/);
  assert.doesNotMatch(currentQuestion, /Need help\?/);
  assert.doesNotMatch(currentQuestion, /guided-stage-note/);
  assert.match(currentQuestion, /isAutoGraded\(q\) && !guided \? confidencePanelHtml/);

  assert.match(moduleJs, /guidedRetryUsed/);
  assert.match(moduleJs, /Try once more/);
  assert.match(moduleJs, /q\.hint \|\| 'Recheck the passage and try once more\.'/);
});

test('guided answer renderers do not interrupt answering with confidence controls', () => {
  const moduleJs = read('js/module.js');
  const start = moduleJs.indexOf('function renderGuidedMultipleChoiceAnswer');
  const end = moduleJs.indexOf('function renderSelectTextAnswer');
  const guidedRenderers = moduleJs.slice(start, end);
  assert.ok(start >= 0 && end > start, 'guided answer renderers should exist');
  assert.doesNotMatch(guidedRenderers, /revealConfidencePanel\(/);
  assert.doesNotMatch(guidedRenderers, /How sure are you\?/);
});

test('guided navigation keeps Next quiet until the current question has been checked', () => {
  const moduleJs = read('js/module.js');
  const currentQuestion = moduleJs.match(/function renderCurrentQuestion[\s\S]*?function questionDetail/)?.[0] || '';
  assert.match(currentQuestion, /const guidedNextLocked = guided && !savedAnswer/);
  assert.match(currentQuestion, /id="next-question"[^>]*\$\{guidedNextLocked \? "disabled" : ""\}/);
  assert.match(moduleJs, /function unlockGuidedNext\(/);
  const submit = moduleJs.match(/function submitInteractiveAnswer[\s\S]*?function optionSelectHtml/)?.[0] || '';
  assert.match(submit, /unlockGuidedNext\(\)/);
});

test('guided classification uses visible choice rows instead of pseudo-dragging', () => {
  const moduleJs = read('js/module.js');
  const guidedSort = moduleJs.match(/function renderGuidedDragSortAnswer[\s\S]*?function renderDragSortAnswer/)?.[0] || '';
  assert.ok(guidedSort, 'guided classification renderer should exist');
  assert.match(moduleJs, /function renderGuidedChoiceRows\(/);
  assert.match(guidedSort, /interaction\?\.presentation === ['"]choice_rows['"]/);
  assert.match(guidedSort, /renderGuidedChoiceRows/);
  const choiceRows = moduleJs.match(/function renderGuidedChoiceRows[\s\S]*?function renderGuidedDragSortAnswer/)?.[0] || '';
  assert.match(choiceRows, /guided-choice-grid/);
  assert.match(choiceRows, /guided-choice-row/);
  assert.match(choiceRows, /guided-choice-options/);
  assert.match(choiceRows, /data-classify-item/);
  assert.match(moduleJs, /'Helps explain the main point': \['Key to main idea', 'Connects to the whole passage'\]/);
  assert.match(moduleJs, /'Mostly a supporting detail': \['Specific detail', 'True, but not central'\]/);
  assert.doesNotMatch(choiceRows, /draggable=/);
  assert.doesNotMatch(choiceRows, /guided-sort-card/);
  assert.doesNotMatch(choiceRows, /data-guided-sort-back/);
  assert.doesNotMatch(choiceRows, /Statements to sort/);
});

test('guided classification instructions describe visible choices, not dragging mechanics', () => {
  const moduleJs = read('js/module.js');
  assert.match(moduleJs, /q\.interaction\?\.presentation === "choice_rows" \? "Choose one option for each statement\."/);
});

test('guided select-text makes the passage selection state carry the feedback without redundant visible status text', () => {
  const moduleJs = read('js/module.js');
  assert.match(moduleJs, /selection-mode-bar/);
  assert.match(moduleJs, /SELECT ONE/);
  assert.doesNotMatch(moduleJs.match(/function guidedHelperText[\s\S]*?function responseIsComplete/)?.[0] || '', /highlighted/);
  const guidedSelect = moduleJs.match(/function renderGuidedSelectTextAnswer[\s\S]*?function renderSelectTextAnswer/)?.[0] || '';
  assert.ok(guidedSelect, 'guided select-text renderer should exist');
  assert.doesNotMatch(guidedSelect, /guided-selection-status/);
  assert.doesNotMatch(guidedSelect, /sentence selected|No selection yet/);
  assert.match(guidedSelect, /interaction-live-status sr-only/);
});

test('guided CSS reduces density and exposes clear card, category, selection, and mobile states', () => {
  const css = read('css/site.css');
  assert.match(css, /\.guided-learning-workspace/);
  assert.match(css, /\.guided-task-panel/);
  assert.match(css, /\.guided-choice-grid/);
  assert.match(css, /\.guided-choice-row/);
  assert.match(css, /\.guided-choice-options/);
  assert.match(css, /\.selection-mode-bar/);
  assert.doesNotMatch(css, /\.guided-selection-status/);
  assert.match(css, /@media \(max-width: 720px\)[\s\S]*guided-learning-workspace/);
});
