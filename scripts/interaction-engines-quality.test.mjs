import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ROOT = process.cwd();

async function loadInteractions() {
  delete globalThis.QuestionInteractions;
  await import(`${pathToFileURL(path.join(ROOT, 'js/question-interactions.js')).href}?t=${Date.now()}`);
  return globalThis.QuestionInteractions;
}

test('interaction helper canonicalizes and scores every V1 objective type', async () => {
  const I = await loadInteractions();
  const mc = { type:'multiple_choice', options:[{id:'a',text:'A'},{id:'b',text:'B'}], correct:'b' };
  const select = { type:'select_text', interaction:{targets:[{id:'s1',text:'One.'},{id:'s2',text:'Two.'}]}, correct:'s2' };
  const sort = { type:'drag_sort', interaction:{items:[{id:'d2',text:'Two'},{id:'d1',text:'One'}],zones:[{id:'yes',label:'Yes'},{id:'no',label:'No'}]}, correct:'d1=yes|d2=no' };
  const order = { type:'drag_order', interaction:{items:[{id:'o1',text:'One'},{id:'o2',text:'Two'},{id:'o3',text:'Three'}]}, correct:'o2|o1|o3' };

  assert.equal(I.canonicalizeAnswer(mc, 'b'), 'b');
  assert.equal(I.canonicalizeAnswer(select, 's2'), 's2');
  assert.equal(I.canonicalizeAnswer(sort, 'd2=no|d1=yes'), 'd1=yes|d2=no');
  assert.equal(I.canonicalizeAnswer(order, ['o2','o1','o3']), 'o2|o1|o3');
  assert.equal(I.isCorrect(sort, 'd2=no|d1=yes'), true);
  assert.equal(I.isCorrect(order, 'o2|o1|o3'), true);
  assert.equal(I.isCorrect(select, 's1'), false);
});

test('interaction helper detects completeness without changing storage away from strings', async () => {
  const I = await loadInteractions();
  const sort = { type:'drag_sort', interaction:{items:[{id:'d1'},{id:'d2'}],zones:[{id:'yes'},{id:'no'}]} };
  const order = { type:'drag_order', interaction:{items:[{id:'o1'},{id:'o2'},{id:'o3'}]} };
  assert.equal(I.hasCompleteAnswer(sort, 'd1=yes'), false);
  assert.equal(I.hasCompleteAnswer(sort, 'd1=yes|d2=no'), true);
  assert.equal(I.hasCompleteAnswer(order, 'o1|o2'), false);
  assert.equal(I.hasCompleteAnswer(order, 'o1|o2|o3'), true);
});

test('select-text segmentation requires authored targets and never guesses sentence boundaries', async () => {
  const I = await loadInteractions();
  const text = 'First sentence. Second sentence. Third sentence.';
  const segments = I.segmentTextTargets(text, [
    { id:'s1', text:'First sentence.' },
    { id:'s3', text:'Third sentence.' }
  ]);
  assert.deepEqual(segments.filter((x) => x.kind === 'target').map((x) => x.id), ['s1','s3']);
  assert.equal(segments.map((x) => x.text).join(''), text);
});

test('order movement is deterministic and preserves all ids', async () => {
  const I = await loadInteractions();
  assert.deepEqual(I.moveOrder(['o1','o2','o3'], 'o2', -1), ['o2','o1','o3']);
  assert.deepEqual(I.moveOrder(['o1','o2','o3'], 'o1', -1), ['o1','o2','o3']);
  assert.deepEqual(I.moveOrder(['o1','o2','o3'], 'o2', 1), ['o1','o3','o2']);
});



test('grammar helper distinguishes whole-revision and inline dropdown modes', async () => {
  const I = await loadInteractions();
  const revision = { type:'grammar_edit', prompt:'Choose the clearest revision.' };
  const inline = { type:'grammar_edit', prompt:'The students {{blank}} ready.' };
  assert.equal(I.grammarEditMode(revision), 'revision');
  assert.equal(I.grammarEditMode(inline), 'inline');
  assert.deepEqual(I.splitGrammarPrompt(inline), { before:'The students ', after:' ready.' });
  assert.deepEqual(I.splitGrammarPrompt(revision), { before:'Choose the clearest revision.', after:'' });
});

test('grammar_edit supports deliberate revision dropdowns and single inline blanks but rejects multi-blank prompts', async () => {
  const tempFile = path.join(ROOT, 'content-src/sets/zz-temp-grammar-modes.json');
  const base = {
    primarySkillId: 'L1.1', familyId: 'agreement.number', difficulty: 'medium', dok: 2,
    options: [
      { id:'a', text:'was', distractorType:'agreement', whyWrong:'This option does not agree with the plural subject.' },
      { id:'b', text:'were' }
    ],
    correct: 'b', explanation: { answer:'b', whyCorrect:'The plural subject takes the plural verb.' }
  };
  const tempSet = {
    schemaVersion: 2,
    id: 'set-temp-grammar-modes',
    title: 'Temporary grammar modes',
    subject: 'rla',
    category: 'language',
    topic: 'Agreement',
    difficulty: 'medium',
    status: 'review',
    version: 1,
    curriculum: {
      domain: 'Language & Editing',
      primarySkillId: 'L1.1',
      contentKind: 'skill_drill',
      learningObjective: 'Temporary validator fixture.'
    },
    questions: [
      { ...base, id:'q1', type:'grammar_edit', prompt:'Choose the clearest revision of the sentence.' },
      { ...base, id:'q2', type:'grammar_edit', prompt:'The students {{blank}} ready.' },
      { ...base, id:'q3', type:'grammar_edit', prompt:'The students {{blank}} ready and {{blank}} waiting.' }
    ]
  };
  fs.writeFileSync(tempFile, JSON.stringify(tempSet, null, 2));
  try {
    const { validateContent } = await import(`${pathToFileURL(path.join(ROOT, 'scripts/validate-content.mjs')).href}?grammar=${Date.now()}`);
    const result = await validateContent({ quiet: true });
    const grammarErrors = result.errors.filter((x) => x.code === 'GRAMMAR_BLANK_INVALID');
    assert.equal(grammarErrors.length, 1, `expected only the multi-blank fixture to fail, got ${grammarErrors.length}`);
    assert.match(grammarErrors[0].location || grammarErrors[0].message || '', /q3/);
  } finally {
    fs.rmSync(tempFile, { force: true });
  }
});

test('content validator rejects malformed V1 interactions', async () => {
  const tempFile = path.join(ROOT, 'content-src/sets/zz-temp-invalid-interactions.json');
  const tempSet = {
    schemaVersion: 2,
    id: 'set-temp-invalid-interactions',
    title: 'Temporary invalid interaction contract',
    subject: 'rla',
    category: 'reading',
    topic: 'Temporary',
    difficulty: 'medium',
    status: 'review',
    version: 1,
    passageRefs: ['p-rla-core-transfer-handoff'],
    curriculum: {
      domain: 'Core Meaning',
      primarySkillId: 'R1.2',
      contentKind: 'skill_drill',
      learningObjective: 'Temporary validator fixture.'
    },
    questions: [
      {
        id: 'q1', type: 'select_text', prompt: 'Select the evidence.', primarySkillId: 'R1.2',
        familyId: 'mainidea.whole.implied', difficulty: 'medium', dok: 2,
        interaction: { selectionMode: 'sentence', targets: [{id:'s1', text:'This sentence is not in the passage.'},{id:'s1', text:'Duplicate id.'}] },
        correct: 's1', explanation: { answer: 's1', whyCorrect: 'Temporary fixture.' }
      },
      {
        id: 'q2', type: 'drag_sort', prompt: 'Sort these.', primarySkillId: 'R1.2',
        familyId: 'mainidea.whole.implied', difficulty: 'medium', dok: 2,
        interaction: { items: [{id:'d1',text:'One'},{id:'d2',text:'Two'}], zones: [{id:'yes',label:'Yes'},{id:'no',label:'No'}] },
        correct: 'd1=yes', explanation: { answer: 'mapping', whyCorrect: 'Temporary fixture.' }
      },
      {
        id: 'q3', type: 'drag_order', prompt: 'Order these.', primarySkillId: 'R1.2',
        familyId: 'mainidea.whole.implied', difficulty: 'medium', dok: 2,
        interaction: { items: [{id:'o1',text:'First'},{id:'o2',text:'Second'},{id:'o3',text:'Third'}] },
        correct: 'o1|o2|o3', explanation: { answer: 'order', whyCorrect: 'Temporary fixture.' }
      }
    ]
  };
  fs.writeFileSync(tempFile, JSON.stringify(tempSet, null, 2));
  try {
    const { validateContent } = await import(`${pathToFileURL(path.join(ROOT, 'scripts/validate-content.mjs')).href}?t=${Date.now()}`);
    const result = await validateContent({ quiet: true });
    assert.ok(result.errors.some((x) => x.code === 'SELECT_TARGET_INVALID'));
    assert.ok(result.errors.some((x) => x.code === 'SELECT_TARGET_TEXT_INVALID'));
    assert.ok(result.errors.some((x) => x.code === 'DRAG_CORRECT_INVALID'));
    assert.ok(result.errors.some((x) => x.code === 'DRAG_ORDER_ALREADY_CORRECT'));
  } finally {
    fs.rmSync(tempFile, { force: true });
  }
});


test('Practice loads the shared interaction model before module code', () => {
  const html = fs.readFileSync(path.join(ROOT, 'module.html'), 'utf8');
  assert.ok(html.indexOf('js/question-interactions.js') >= 0, 'Practice should load the shared interaction model');
  assert.ok(html.indexOf('js/question-interactions.js') < html.indexOf('js/module.js'), 'interaction helper must load before module.js');
});

test('Practice implements select text and accessible non-drag alternatives', () => {
  const source = fs.readFileSync(path.join(ROOT, 'js/module.js'), 'utf8');
  assert.match(source, /select_text/);
  assert.match(source, /data-select-target/);
  assert.match(source, /data-sort-destination/);
  assert.match(source, /data-order-up/);
  assert.match(source, /data-order-down/);
  assert.match(source, /Check answer/);
  assert.match(source, /grammarEditMode/);
});


test('Practice keeps unsubmitted interaction work in a separate local draft namespace', () => {
  const storage = fs.readFileSync(path.join(ROOT, 'js/storage.js'), 'utf8');
  const moduleSource = fs.readFileSync(path.join(ROOT, 'js/module.js'), 'utf8');
  assert.match(storage, /getInteractionDrafts/);
  assert.match(storage, /setInteractionDraft/);
  assert.match(storage, /clearInteractionDraft/);
  assert.match(storage, /interaction-drafts/);
  assert.match(moduleSource, /setInteractionDraft/);
  assert.match(moduleSource, /getInteractionDrafts/);
});

test('interaction controls expose a live status and practical minimum targets', () => {
  const css = fs.readFileSync(path.join(ROOT, 'css/site.css'), 'utf8');
  assert.match(css, /\.interaction-live-status/);
  assert.match(css, /min-height:\s*44px/);
});


test('Mock loads and renders the shared interaction families without immediate feedback', () => {
  const html = fs.readFileSync(path.join(ROOT, 'test.html'), 'utf8');
  const source = fs.readFileSync(path.join(ROOT, 'js/test.js'), 'utf8');
  assert.ok(html.indexOf('js/question-interactions.js') >= 0, 'Mock should load interaction helper');
  assert.ok(html.indexOf('js/question-interactions.js') < html.indexOf('js/mock-engine.js'));
  assert.match(source, /select_text/);
  assert.match(source, /drag_sort/);
  assert.match(source, /drag_order/);
  assert.match(source, /data-sort-destination/);
  assert.match(source, /data-order-up/);
  assert.match(source, /hasCompleteAnswer/);
  assert.match(source, /objectiveAnswerComplete/);
  assert.match(source, /canonicalizeAnswer/);
  assert.match(source, /formatAnswer/);
  assert.match(source, /isCorrect/);
  assert.doesNotMatch(source, /This item type is not supported in Mock V1/);
});

test('build compiler preserves interaction metadata', () => {
  const source = fs.readFileSync(path.join(ROOT, 'scripts/build-content.mjs'), 'utf8');
  assert.match(source, /if \(q\.interaction\) out\.interaction =/);
});

test('Main Idea active-learning reference set uses a smooth scaffolded progression and stays out of random Mock', () => {
  const setPath = path.join(ROOT, 'content-src/sets/set-rla-mainidea-active-methods-v1.json');
  const passagePath = path.join(ROOT, 'content-src/passages/p-rla-mainidea-active-shade-route.json');
  assert.ok(fs.existsSync(setPath), 'reference set should exist');
  assert.ok(fs.existsSync(passagePath), 'reference passage should exist');
  const set = JSON.parse(fs.readFileSync(setPath, 'utf8'));
  const passage = JSON.parse(fs.readFileSync(passagePath, 'utf8'));
  assert.deepEqual(set.curriculum?.practiceTags, ['active-learning', 'mock-excluded']);
  assert.equal(set.curriculum?.primarySkillId, 'R1.2');
  assert.deepEqual(set.curriculum?.secondarySkillIds || [], [], 'the Main Idea reference module must not leak into Supporting Details curriculum placement');
  assert.equal(set.questions.length, 6);
  assert.deepEqual(set.questions.map((q) => q.type), ['drag_sort','select_text','multiple_choice','drag_sort','select_text','multiple_choice']);
  assert.deepEqual(set.questions.map((q) => q.difficulty), ['easy','easy','medium','medium','hard','hard']);
  assert.deepEqual(set.questions.map((q) => q.dok), [1,1,2,2,3,3]);
  assert.ok(set.questions.every((q) => q.primarySkillId === 'R1.2'));
  assert.ok(set.questions.every((q) => !(q.secondarySkillIds || []).includes('R1.3')), 'Main Idea activity questions may use details as reasoning support but must not be indexed as Supporting Details practice');
  assert.ok(set.questions.every((q) => q.explanation?.whyCorrect && q.explanation?.quickTip));
  const wordCount = String(passage.text || '').trim().split(/\s+/).filter(Boolean).length;
  assert.ok(wordCount >= 450 && wordCount <= 650, `reference passage should be 450–650 words, got ${wordCount}`);
  assert.equal(passage.textType, 'informational');
  assert.equal(passage.source?.type, 'original');
});

test('learner-only public build and offline shell ship the shared interaction runtime', () => {
  const buildSource = fs.readFileSync(path.join(ROOT, 'scripts/build-public.mjs'), 'utf8');
  const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
  assert.match(buildSource, /'question-interactions\.js'/);
  assert.match(sw, /js\/question-interactions\.js/);
});
