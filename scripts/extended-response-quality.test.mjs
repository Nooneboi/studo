import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from './validate-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONFIG = path.join(ROOT, 'content-src', 'config', 'rla.curriculum.json');
const GENERATED = path.join(ROOT, 'data', 'generated');
const W_SKILLS = ['W1.1','W1.2','W1.3','W1.4','W1.5','W1.6','W1.7','W1.8','W1.9','W1.10','W1.11','W1.12'];
async function json(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }

test('Extended Response config defines exactly 6 learner units and maps all 12 W1 skills once', async () => {
  const config = await json(CONFIG);
  const track = config.tracks.find((x) => x.id === 'extended-response');
  assert.ok(track, 'Extended Response track missing');
  const units = track.domains.flatMap((d) => d.units || []);
  assert.equal(units.length, 6, `expected 6 units, found ${units.length}`);
  const mapped = units.flatMap((u) => u.skillIds || []);
  assert.deepEqual([...mapped].sort(), [...W_SKILLS].sort());
  assert.equal(new Set(mapped).size, W_SKILLS.length, 'a W1 skill is mapped more than once');
  assert.equal(track.publicationState, 'published', 'ER should publish only after the full V1 quality gate passes');
});

test('builder recognizes extended-response practice separately from focused unit checks', async () => {
  const source = await fs.readFile(path.join(ROOT, 'scripts', 'build-content.mjs'), 'utf8');
  assert.match(source, /extendedResponsePractice/);
  assert.match(source, /extended_response_practice/);
});

test('each ER unit has one focused module with eight objective questions and all W1 skills are covered', async () => {
  const config = await json(CONFIG);
  const trackConfig = config.tracks.find((x) => x.id === 'extended-response');
  const units = trackConfig.domains.flatMap((d) => d.units || []);
  const setsDir = path.join(ROOT, 'content-src', 'sets');
  const files = (await fs.readdir(setsDir)).filter((name) => /^set-rla-er-focus-.*\.json$/.test(name));
  assert.equal(files.length, 6, `expected 6 focused ER sets, found ${files.length}`);
  const covered = new Set();
  for (const unit of units) {
    const matches = [];
    for (const file of files) {
      const set = await json(path.join(setsDir, file));
      if (set.curriculum?.unitId === unit.id) matches.push(set);
    }
    assert.equal(matches.length, 1, `${unit.id} focused set count`);
    assert.equal(matches[0].questions?.length, 8, `${unit.id} question count`);
    for (const q of matches[0].questions || []) {
      covered.add(q.primarySkillId);
      for (const id of q.secondarySkillIds || []) covered.add(id);
    }
  }
  assert.deepEqual([...covered].sort(), [...W_SKILLS].sort());
});


test('validator accepts the dedicated extended_response_practice content kind', async () => {
  const fixture = path.join(ROOT, 'content-src', 'sets', '__qa-er-content-kind.json');
  const obj = {
    schemaVersion:2,id:'set-qa-er-kind',runtime:{id:'qa-er-kind',file:'qa-er-kind.json'},title:'QA ER kind',description:'Temporary validator fixture.',subject:'rla',category:'writing',topic:'Extended Response',difficulty:'easy',status:'published',version:1,author:'Studo',reviewer:'QA',
    questions:[{id:'q1',type:'multiple_choice',prompt:'Which choice best states the task?',primarySkillId:'W1.1',familyId:'writing.er.task',difficulty:'easy',dok:1,difficultyProfile:{textComplexity:1,reasoningDepth:1,evidenceDistance:1,distractorSimilarity:2,sourceCount:2,responseDemand:1},options:[{id:'a',text:'Evaluate which argument is better supported.'},{id:'b',text:'Give only a personal opinion.',distractorType:'task_misread',whyWrong:'The ER is source-based analysis, not personal opinion.'}],correct:'a',explanation:{answer:'A',whyCorrect:'The task is to evaluate support across the supplied sources.',quickTip:'Judge the sources, not your preference.'}}],
    curriculum:{domain:'Extended Response',primarySkillId:'W1.1',secondarySkillIds:[],contentKind:'extended_response_practice',learningObjective:'Validate ER content kind.',topicLabel:'Extended Response'}
  };
  try {
    await fs.writeFile(fixture, JSON.stringify(obj,null,2)+'\n');
    const result = await validateContent({quiet:true});
    const errors = result.errors.filter((x)=>x.file.endsWith('__qa-er-content-kind.json'));
    assert.equal(errors.some((x)=>x.code==='CURRICULUM_KIND_INVALID'), false, errors.map((x)=>x.code).join(','));
  } finally { await fs.rm(fixture,{force:true}); }
});

test('ER prompt bank contains 10 original paired-source prompts with balanced stronger-source answers and exemplars', async () => {
  const dir = path.join(ROOT, 'content-src', 'er-prompts');
  const files = (await fs.readdir(dir)).filter((name) => /^er-.*\.json$/.test(name));
  assert.equal(files.length, 10, `expected 10 ER prompts, found ${files.length}`);
  const stronger = { A:0, B:0 };
  const topics = new Set();
  for (const file of files) {
    const p = await json(path.join(dir,file));
    assert.equal(p.status, 'published');
    assert.ok((p.sourceA?.text || '').split(/\s+/).length >= 220, `${file} source A too short`);
    assert.ok((p.sourceB?.text || '').split(/\s+/).length >= 220, `${file} source B too short`);
    assert.ok(['A','B'].includes(p.strongerSource), `${file} strongerSource`);
    stronger[p.strongerSource]++;
    topics.add(p.topic);
    assert.ok(p.authoringKey?.reasons?.length >= 2, `${file} authoring key`);
    assert.ok((p.modelResponse || '').split(/\s+/).length >= 250, `${file} model response too short`);
    assert.doesNotMatch(p.modelResponse || '', /Both sources address\s+(?:should|how should)\b/i, `${file} has an awkward model-response opening`);
    assert.doesNotMatch(p.modelResponse || '', /\.\.(?:\s|$)/, `${file} has doubled sentence punctuation`);
    assert.ok(Array.isArray(p.annotations) && p.annotations.length >= 4, `${file} annotations`);
    assert.ok(Array.isArray(p.revisionPrompts) && p.revisionPrompts.length >= 3, `${file} revision prompts`);
  }
  assert.deepEqual(stronger, {A:5,B:5});
  assert.ok(topics.size >= 10, `expected topic diversity, got ${topics.size}`);
});



test('two Phase 3E ER prompts provide denser 550-650 word paired-source practice with opposite stronger-source positions', async () => {
  const ids = ['er-night-delivery-window','er-vacant-lot-housing'];
  const prompts = [];
  for (const id of ids) prompts.push(await json(path.join(ROOT, 'content-src', 'er-prompts', `${id}.json`)));
  for (const p of prompts) {
    const words = `${p.sourceA.text} ${p.sourceB.text}`.trim().split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 550 && words <= 650, `${p.id} combined source words: ${words}`);
    assert.ok((p.modelResponse || '').trim().split(/\s+/).length >= 250, `${p.id} model response too short`);
    assert.ok(p.annotations.length >= 4);
    assert.ok(p.revisionPrompts.length >= 4);
  }
  assert.notEqual(prompts[0].strongerSource, prompts[1].strongerSource);
});

test('clean build emits ten learner ER prompts without authoring-key spoilers', async () => {
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  await promisify(execFile)('node', ['scripts/build-content.mjs'], { cwd: ROOT });
  const prompts = await json(path.join(GENERATED, 'er-prompts.json'));
  assert.equal(prompts.prompts?.length, 10);
  for (const p of prompts.prompts || []) {
    assert.equal('authoringKey' in p, false, `${p.id} leaked authoringKey`);
    assert.equal('strongerSource' in p, false, `${p.id} leaked strongerSource`);
    assert.ok(p.modelResponse && p.annotations?.length >= 4);
  }
});

test('ER resource registry provides one guide and two workbooks for each learner unit', async () => {
  const registry = await json(path.join(ROOT, 'content-src', 'resources', 'rla.resources.json'));
  const ers = (registry.resources || []).filter((r) => String(r.id || '').startsWith('res-rla-er-v1-'));
  assert.equal(ers.length, 18, `expected 18 ER resources, found ${ers.length}`);
  const config = await json(CONFIG);
  const units = config.tracks.find((x)=>x.id==='extended-response').domains.flatMap((d)=>d.units||[]);
  for (const unit of units) {
    const rows = ers.filter((r)=>r.unitId===unit.id);
    assert.equal(rows.filter((r)=>r.type==='study_guide').length,1,`${unit.id} guide`);
    assert.equal(rows.filter((r)=>r.type==='worksheet').length,2,`${unit.id} workbooks`);
    for (const r of rows) await fs.access(path.join(ROOT,r.href));
  }
});

test('ER workspace contract supports timed and untimed persistent writing without fake scoring', async () => {
  const htmlPath = path.join(ROOT, 'extended-response.html');
  const jsPath = path.join(ROOT, 'js', 'extended-response.js');
  await assert.doesNotReject(() => fs.access(htmlPath));
  await assert.doesNotReject(() => fs.access(jsPath));
  const html = await fs.readFile(htmlPath, 'utf8');
  const source = await fs.readFile(jsPath, 'utf8');
  assert.match(source, /\b2700\b/, 'timed mode must use 2700 seconds');
  assert.match(source, /sq:er:\$\{promptId\}:\$\{mode\}/, 'state key must be prompt and mode scoped');
  assert.match(source, /StudoSafeStorage/, 'workspace must use safe local persistence');
  assert.match(source, /remainingSeconds/, 'timer state must persist remaining seconds');
  assert.match(source, /submittedAt/, 'submission state must be explicit');
  assert.match(source, /renderReview/, 'workspace needs a post-submit review path');
  assert.match(source, /state\.submittedAt/, 'model/review reveal must depend on submission state');
  assert.doesNotMatch(`${html}\n${source}`, /AI Score|Official GED Score|Guaranteed(?:\s+GED)? Score/i);
  const workspaceCopy = `${html}\n${source}`;
  assert.match(workspaceCopy, /Source A/i);
  assert.match(workspaceCopy, /Source B/i);
  assert.match(workspaceCopy, /essay/i);
  assert.match(workspaceCopy, /planner/i);
});

test('ER build exposes full prompt cards in curriculum without learner answer-key spoilers', async () => {
  const source = await fs.readFile(path.join(ROOT, 'scripts', 'build-content.mjs'), 'utf8');
  assert.match(source, /validation\.erPrompts/);
  assert.match(source, /extendedResponsePractice/);
  const { execFile } = await import('node:child_process');
  const { promisify } = await import('node:util');
  await promisify(execFile)('node', ['scripts/build-content.mjs'], { cwd: ROOT });
  const curriculum = await json(path.join(GENERATED, 'curriculum.json'));
  assert.equal(curriculum.extendedResponsePractice?.length, 10, 'expected 10 full ER prompt cards');
  for (const item of curriculum.extendedResponsePractice || []) {
    assert.ok(item.id && item.title && item.topic, 'prompt card is missing learner metadata');
    assert.equal('strongerSource' in item, false, `${item.id} leaked strongerSource`);
    assert.equal('authoringKey' in item, false, `${item.id} leaked authoringKey`);
  }
});

test('ER domain routes full prompts to the dedicated writing workspace', async () => {
  const source = await fs.readFile(path.join(ROOT, 'js', 'domain.js'), 'utf8');
  assert.match(source, /extendedResponsePractice/);
  assert.match(source, /extended-response\.html\?prompt=/);
  assert.match(source, /Timed 45 min|45 min/i);
  assert.match(source, /Untimed/i);
});

test('ER attempt history and self-review stay separate from objective mastery', async () => {
  const erSource = await fs.readFile(path.join(ROOT, 'js', 'extended-response.js'), 'utf8');
  const progressSource = await fs.readFile(path.join(ROOT, 'js', 'progress.js'), 'utf8');
  assert.match(erSource, /sq:er:history/);
  assert.match(erSource, /selfScores/);
  assert.match(erSource, /revisionComplete/);
  assert.doesNotMatch(erSource, /Learning\.(?:record|answer|submit|recordAttempt)[A-Za-z]*\([^)]*selfScores/s, 'self-scores must not enter objective Learning APIs');
  assert.match(progressSource, /sq:er:history/);
  assert.match(progressSource, /Self-review/i);
  assert.match(progressSource, /Extended Response/i);
});

test('timed ER revisions stay editable after refresh once the learner chooses to revise', async () => {
  const source = await fs.readFile(path.join(ROOT, 'js', 'extended-response.js'), 'utf8');
  assert.match(source, /isRevising/);
  assert.match(source, /lockedByTime[\s\S]*!state\.isRevising/);
});

test('ER self-review explains what 0, 1, and 2 mean instead of showing bare numbers', async () => {
  const source = await fs.readFile(path.join(ROOT, 'js', 'extended-response.js'), 'utf8');
  assert.match(source, /0\s*-\s*Not yet/i);
  assert.match(source, /1\s*-\s*Partly/i);
  assert.match(source, /2\s*-\s*Clear/i);
  assert.match(source, /Weak vs\. stronger/i);
});

test('timed prompt cards warn that the timer starts immediately and locks editing at zero', async () => {
  const source = await fs.readFile(path.join(ROOT, 'js', 'domain.js'), 'utf8');
  assert.match(source, /starts immediately/i);
  assert.match(source, /locks.*00:00/i);
});
