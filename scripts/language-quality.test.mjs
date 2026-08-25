import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent } from './validate-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GENERATED = path.join(ROOT, 'data', 'generated');
const CONFIG = path.join(ROOT, 'content-src', 'config', 'rla.curriculum.json');
async function json(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }
const LANG_SKILLS = ['L1.1','L1.2','L1.3','L1.4','L1.5','L1.6','L1.7','L1.8','L1.9','L2.1','L2.2','L2.3','L2.4'];
function languageIssue(issue) { const f=String(issue.file||''); return f.includes('set-rla-lang-') || f.includes('p-rla-lang-') || f.includes('language-'); }



test('validator allows capitalization-only option differences in grammar-edit items', async () => {
  const fixture = path.join(ROOT, 'content-src', 'sets', '__qa-capitalization-case.json');
  const obj = {
    schemaVersion:2, id:'set-qa-capitalization-case', runtime:{id:'qa-cap-case',file:'qa-cap-case.json'},
    title:'QA capitalization case', description:'Temporary validator fixture.', subject:'rla', category:'language_conventions', topic:'QA',
    difficulty:'easy', status:'published', version:1, author:'Studo', reviewer:'QA', questions:[{
      id:'q1', type:'grammar_edit', prompt:'Choose the correct capitalization.', primarySkillId:'L2.1',
      familyId:'language.capitalization.mechanics', difficulty:'easy', dok:1,
      difficultyProfile:{textComplexity:1,reasoningDepth:1,evidenceDistance:1,distractorSimilarity:2,sourceCount:1,responseDemand:1},
      options:[
        {id:'a',text:'The meeting is in march.',distractorType:'editing_error',whyWrong:'The month name must be capitalized.'},
        {id:'b',text:'The meeting is in March.'}
      ], correct:'b', explanation:{answer:'B',whyCorrect:'Month names are capitalized.',quickTip:'Capitalize months.'}
    }],
    curriculum:{domain:'Language & Editing',primarySkillId:'L2.1',secondarySkillIds:[],contentKind:'skill_drill',learningObjective:'Test capitalization validation.',topicLabel:'QA'}
  };
  try {
    await fs.writeFile(fixture, JSON.stringify(obj,null,2)+'\n');
    const result = await validateContent({quiet:true});
    const errors = result.errors.filter((x)=>x.file.endsWith('__qa-capitalization-case.json'));
    assert.equal(errors.some((x)=>x.code==='OPTION_TEXT_DUPLICATE'), false, errors.map((x)=>x.code).join(','));
  } finally { await fs.rm(fixture,{force:true}); }
});

test('Language config defines exactly 7 learner units and maps all 13 L1/L2 skills once', async () => {
  const config = await json(CONFIG);
  const track = config.tracks.find((x) => x.id === 'language');
  assert.ok(track, 'Language track missing');
  const units = track.domains.flatMap((d) => d.units || []);
  assert.equal(units.length, 7, `expected 7 units, found ${units.length}`);
  const mapped = units.flatMap((u) => u.skillIds || []);
  assert.deepEqual([...mapped].sort(), [...LANG_SKILLS].sort());
  assert.equal(new Set(mapped).size, LANG_SKILLS.length, 'an internal Language skill is mapped more than once');
});

test('each published Language unit keeps its resource baseline while Agreement & Pronouns adds targeted transfer depth', async () => {
  const curriculum = await json(path.join(GENERATED, 'curriculum.json'));
  const track = curriculum.tracks.find((x) => x.id === 'language');
  assert.ok(track, 'published Language track missing');
  const units = track.domains.flatMap((d) => d.units || []);
  assert.equal(units.length, 7);
  for (const unit of units) {
    const guides = (unit.resources || []).filter((r) => r.type === 'study_guide');
    const workbooks = (unit.resources || []).filter((r) => r.type === 'worksheet');
    assert.equal(guides.length, 1, `${unit.id} guide count`);
    assert.equal(workbooks.length, 2, `${unit.id} workbook count`);
    const isHardeningUnit = unit.id === 'agreement-pronouns';
    assert.equal((unit.sets || []).length, isHardeningUnit ? 2 : 1, `${unit.id} focused Practice module count`);
    assert.equal((unit.checks || []).length, 0, `${unit.id} must not relabel focused Practice as a Skill Check`);
    assert.equal(unit.questionCount, isHardeningUnit ? 16 : 8, `${unit.id} focused question count`);
  }
});

test('Language mixed editing practice has six 350-450 word passages, six questions each, and covers all 13 skills', async () => {
  const curriculum = await json(path.join(GENERATED, 'curriculum.json'));
  const sets = curriculum.languagePractice || [];
  assert.equal(sets.length, 6, `expected 6 mixed editing sets, found ${sets.length}`);
  const covered = new Set();
  let total = 0;
  for (const entry of sets) {
    const module = await json(path.join(ROOT, 'data', entry.file));
    const words = String(module.passage || '').trim().split(/\s+/).filter(Boolean).length;
    assert.ok(words >= 350 && words <= 450, `${entry.title} is ${words} words`);
    assert.equal((module.questions || []).length, 6, `${entry.title} question count`);
    for (const q of module.questions || []) {
      const id = q.metadata?.skillId || q.skill?.id;
      if (id) covered.add(id);
      for (const sid of q.metadata?.secondarySkillIds || []) covered.add(sid);
    }
    total += (module.questions || []).length;
  }
  assert.equal(total, 36);
  assert.deepEqual([...covered].sort(), [...LANG_SKILLS].sort());
});

test('published Language bank has no answer-pattern or generic-feedback warnings', async () => {
  const result = await validateContent({ quiet: true });
  const bad = result.warnings.filter((issue) => languageIssue(issue) && ['ANSWER_POSITION_PATTERN','ANSWER_POSITION_RUN','ANSWER_POSITION_BIAS','WHY_WRONG_REUSED'].includes(issue.code));
  assert.deepEqual(bad, [], bad.map((x) => `${x.code} ${x.file}`).join('\n'));
});

test('Language generated resource and module references resolve', async () => {
  const curriculum = await json(path.join(GENERATED, 'curriculum.json'));
  const track = curriculum.tracks.find((x) => x.id === 'language');
  assert.ok(track);
  for (const domain of track.domains) for (const unit of domain.units || []) {
    for (const record of [...(unit.sets || []), ...(unit.checks || [])]) await fs.access(path.join(ROOT, 'data', record.file));
    for (const resource of unit.resources || []) await fs.access(path.join(ROOT, resource.href));
  }
  for (const record of curriculum.languagePractice || []) await fs.access(path.join(ROOT, 'data', record.file));
});

test('Language domain page exposes Mixed Editing Practice', async () => {
  const source = await fs.readFile(path.join(ROOT, 'js', 'domain.js'), 'utf8');
  assert.match(source, /curriculum\.languagePractice/);
  assert.match(source, /Mixed Editing Practice/);
});
