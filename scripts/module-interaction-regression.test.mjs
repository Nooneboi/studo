import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Regression coverage for module navigation and Burmese help; browser QA remains separate.
const moduleJs = fs.readFileSync(new URL('../js/module.js', import.meta.url), 'utf8');
const siteCss = fs.readFileSync(new URL('../css/site.css', import.meta.url), 'utf8');

function extractFunction(name) {
  const start = moduleJs.indexOf('function ' + name + '(');
  assert.ok(start >= 0, name + ' missing');
  const brace = moduleJs.indexOf('{', start);
  let depth = 0, quote = null, escaped = false;
  for (let i = brace; i < moduleJs.length; i++) {
    const char = moduleJs[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
    if (char === '{') depth++;
    if (char === '}' && --depth === 0) return moduleJs.slice(start, i + 1);
  }
  throw new Error('Cannot extract ' + name);
}

test('unanswered Main Idea footer is visible rather than hidden by CSS', () => {
  const rule = siteCss.match(/body\.mainidea-v22-runtime \.question-footer\.mainidea-v22-waiting\s*\{([^}]*)\}/);
  assert.ok(rule, 'waiting-state CSS rule must exist');
  assert.match(rule[1], /visibility:\s*visible\s*!important/);
  assert.match(rule[1], /pointer-events:\s*auto\s*!important/);
});

test('navigation state tracks saved answers on a guided lesson', () => {
  const classes = new Set(['mainidea-v22-waiting']);
  const footer = {classList: {toggle(name, force) { if (force) classes.add(name); else classes.delete(name); }}};
  const next = {disabled: true};
  let value = null;
  const sandbox = {
    activeQuestions: () => [{question: {id: 'q1'}}],
    currentIndex: 0,
    currentQuiz: {id: 'quiz'},
    Store: {getAnswers: () => ({q1: value})},
    document: {body: {classList: {contains: name => name === 'mainidea-v22-runtime'}},
      getElementById: name => ({'question-footer': footer, 'next-question': next})[name]},
    isGuidedLearningModule: () => true,
    updateProgress: () => {},
  };
  vm.runInNewContext(extractFunction('updateAnswerStatus') + '\nthis.runStatus = updateAnswerStatus;', sandbox);
  sandbox.runStatus();
  assert.equal(next.disabled, true);
  assert.equal(classes.has('mainidea-v22-waiting'), true);
  value = 'b';
  sandbox.runStatus();
  assert.equal(next.disabled, false);
  assert.equal(classes.has('mainidea-v22-waiting'), false);
});

test('Myanmar help resolves ordinary and answer-specific sections', () => {
  const sandbox = {};
  vm.runInNewContext(extractFunction('resolveMyanmarHelp') +
    '\n' + extractFunction('hasMyanmarHelp') +
    '\nthis.resolve = resolveMyanmarHelp; this.has = hasMyanmarHelp;', sandbox);
  assert.equal(sandbox.has({sections: [{body: 'အဖြေကို ရှင်းပြထားသည်။'}]}, 'a'), true);
  assert.equal(sandbox.has({sections: [{body: '  '}]}, 'a'), false);
  const text = sandbox.resolve({byAnswer: {b: [{body:'B reasoning'}]}, sections: [{body:'General'}]}, 'b');
  assert.equal(text[0].body, 'B reasoning');
  assert.equal(sandbox.resolve(null, 'a').length, 0);
});
