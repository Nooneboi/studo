import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (file) => fs.readFileSync(file, 'utf8');

function loadLearning() {
  const storage = new Map();
  const context = {
    console,
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Set,
    Map,
    localStorage: {
      getItem(key) { return storage.has(key) ? storage.get(key) : null; },
      setItem(key, value) { storage.set(key, String(value)); },
      removeItem(key) { storage.delete(key); },
    },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(`${read('js/learning.js')}\n;globalThis.__LearningForTest = Learning;`, context, { filename: 'learning.js' });
  return { Learning: context.__LearningForTest, storage };
}

function sampleModule() {
  return {
    id: 'set-check-fixture',
    title: 'Fixture Skill Check',
    subject: 'rla',
    category: 'reading',
    topic: 'Main idea / central idea',
    difficulty: 'medium',
    contentMeta: { curriculum: { deliveryRoles: ['skill_check'], primarySkillId: 'R1.2' } },
  };
}

function sampleQuestion(id = 'q1') {
  return {
    id,
    type: 'multiple_choice',
    correct: 'a',
    familyId: 'mainidea.whole.explicit',
    skill: { id: 'R1.2', label: 'Main idea / central idea', category: 'reading' },
    metadata: { difficulty: 'medium' },
    options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }],
  };
}

test('dedicated Skill Check learner runtime and public build contract exist', () => {
  assert.ok(fs.existsSync('check.html'), 'check.html must exist');
  assert.ok(fs.existsSync('js/check.js'), 'js/check.js must exist');
  const html = read('check.html');
  const source = read('js/check.js');
  const publicBuild = read('scripts/build-public.mjs');

  assert.ok(html.indexOf('js/question-interactions.js') >= 0, 'Check must load shared interaction helpers');
  assert.ok(html.indexOf('js/question-interactions.js') < html.indexOf('js/check.js'), 'interaction helper must load before Check controller');
  assert.match(source, /deliveryRoles/);
  assert.match(source, /skill_check/);
  assert.match(source, /sq:skill-check-history:v1/);
  assert.match(source, /mode:\s*["']skill_check["']/);
  assert.match(source, /Answers after finishing/i);
  assert.doesNotMatch(html, /confidence/i);
  assert.doesNotMatch(html, /id=["'](?:hint|confidence)|guided-retry/i);
  assert.match(publicBuild, /check\.html/);
  assert.match(publicBuild, /check\.js/);
});

test('Skill Check independent attempt carries more evidence than ordinary Practice without changing raw counts', () => {
  const practice = loadLearning().Learning;
  const check = loadLearning().Learning;
  const module = sampleModule();
  const question = sampleQuestion();

  const practiceResult = practice.recordAttempt({ module, question, answer: 'a', correct: true, mode: 'practice', assistance: 'none', firstTryCorrect: true, attemptCount: 1 });
  const checkResult = check.recordAttempt({ module, question, answer: 'a', correct: true, mode: 'skill_check', assistance: 'none', firstTryCorrect: true, attemptCount: 1, learningStage: null });

  assert.equal(checkResult.attempt.mode, 'skill_check');
  assert.equal(checkResult.attempt.assistance, 'none');
  assert.equal(checkResult.attempt.attemptCount, 1);
  assert.equal(checkResult.attempt.learningStage, null);
  assert.ok(checkResult.skill.score > practiceResult.skill.score, `expected check signal ${checkResult.skill.score} > practice ${practiceResult.skill.score}`);
});

test('skill pages expose a separate optional Check section and Progress keeps Check results separate', () => {
  const skill = read('js/skill.js');
  const progress = read('js/progress.js');
  assert.match(skill, /item\.checks/);
  assert.match(skill, /Skill Check/);
  assert.match(skill, /Independent[^\n]*no hints[^\n]*answers after finishing/i);
  assert.match(skill, /check\.html\?file=/);
  assert.match(progress, /sq:skill-check-history:v1/);
  assert.match(progress, /Latest Skill Check/);
  assert.match(progress, /Practice signal/);
  assert.doesNotMatch(progress, /Skill Check[^\n]*(Pass|Fail|Mastered)/i);
});

test('Check-origin mistakes route back to canonical skill review instead of Practice module replay', () => {
  const progress = read('js/progress.js');
  assert.match(progress, /skill_check/);
  assert.match(progress, /practiceHref\(mistake\)/);
});
