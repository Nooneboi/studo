import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = (file) => fs.readFileSync(file, 'utf8');
const curriculum = JSON.parse(read('data/generated/curriculum.json'));

function loadRoutes() {
  assert.ok(fs.existsSync('js/curriculum-routes.js'), 'shared curriculum routing helper must exist');
  const context = { window: {} };
  vm.createContext(context);
  vm.runInContext(read('js/curriculum-routes.js'), context);
  assert.ok(context.window.CurriculumRoutes, 'CurriculumRoutes must be exposed to learner pages');
  return context.window.CurriculumRoutes;
}

test('canonical curriculum routes map Reading skills and grouped units to current skill pages', () => {
  const routes = loadRoutes().build(curriculum);
  assert.equal(
    routes.hrefForSkill('R1.1'),
    'skill.html?track=reading&domain=core-meaning&skill=R1.1'
  );
  assert.equal(
    routes.hrefForSkill('R5.1'),
    'skill.html?track=arguments&domain=argument-analysis&unit=claims-argument-structure'
  );
  assert.equal(routes.hrefForSkill('does-not-exist'), 'practice.html');
});

test('guided practice can resolve the next independent set on the same curriculum item', () => {
  const routes = loadRoutes().build(curriculum);
  const next = routes.nextSet('generated/modules/set-rla-explicit-meaning-active-methods-v1.json');
  assert.deepEqual(JSON.parse(JSON.stringify(next)), {
    title: 'Explicit Meaning - Independent Practice',
    file: 'generated/modules/rla-explicit-meaning-practice-01.json',
    returnHref: 'skill.html?track=reading&domain=core-meaning&skill=R1.1'
  });
});

test('Progress uses canonical curriculum routing instead of the retired category detour', () => {
  const html = read('progress.html');
  const js = read('js/progress.js');
  assert.match(html, /js\/curriculum-routes\.js/);
  assert.doesNotMatch(js, /category\.html\?subject=rla/);
  assert.match(js, /CurriculumRoutes/);
  assert.match(js, /Data\.loadCurriculum/);
});

test('module completion offers the next practice set when curriculum sequencing provides one', () => {
  const html = read('module.html');
  const js = read('js/module.js');
  assert.match(html, /js\/curriculum-routes\.js/);
  assert.match(js, /nextSet\(currentModuleFile\)/);
  assert.match(js, /Continue to/);
});

test('Train sends new learners to Practice before offering adaptive training', () => {
  const js = read('js/train.js');
  assert.match(js, /Learning\.getAttempts\(\)/);
  assert.match(js, /attempts\.length\s*<\s*3/);
  assert.match(js, /Start with Practice/i);
  assert.doesNotMatch(js, /Baseline session/);
});

test('temporary Mock surfaces describe format and timing practice rather than a full exam simulation', () => {
  const learnerCopy = [read('quiz.html'), read('js/quiz.js'), read('js/test.js'), read('js/progress.js'), read('content-src/config/rla-mock-v1.json')].join('\n');
  assert.doesNotMatch(learnerCopy, /Exam simulation/i);
  assert.doesNotMatch(learnerCopy, /Full simulation/i);
  assert.doesNotMatch(learnerCopy, /Full RLA Mock|full mock|GED-style simulation/i);
  assert.match(learnerCopy, /Format & Timing Practice/i);
});

test('learner navigation hides unavailable future subjects', () => {
  const app = read('js/app.js');
  assert.doesNotMatch(app, /soon-pill|>Soon<|Soon/);
  assert.doesNotMatch(app, /id:\s*["']math["']/);
  assert.doesNotMatch(app, /id:\s*["']science["']/);
  assert.doesNotMatch(app, /id:\s*["']social_studies["']/);
  assert.ok(!fs.existsSync('js/subjectbar.js') || !/Soon/.test(read('js/subjectbar.js')), 'retired subjectbar source must not preserve stale Soon UI');
});

test('Home explains the three learner modes directly', () => {
  const html = read('index.html');
  assert.match(html, /<strong>Practice<\/strong>/);
  assert.match(html, /<strong>Train<\/strong>/);
  assert.match(html, /<strong>Mock<\/strong>/);
  assert.doesNotMatch(html, /<strong>Plans<\/strong>|<strong>Systems<\/strong>|<strong>Details<\/strong>/);
});

test('public build ships the shared curriculum routing helper', () => {
  assert.match(read('scripts/build-public.mjs'), /curriculum-routes\.js/);
});
