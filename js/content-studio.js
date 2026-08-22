const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const VALID_STATUS = ['draft', 'review', 'approved', 'published', 'retired'];
const VALID_TYPES = ['multiple_choice', 'evidence_based', 'grammar_edit', 'fill_blank', 'open_ended', 'extended_response'];
const VALID_CONTENT_KINDS = ['passage_practice','skill_drill','quiz','mixed_review','editing_practice','extended_response'];
const DISTRACTOR_TYPES = [
  'mentioned_not_supported', 'true_but_irrelevant', 'too_broad', 'too_narrow',
  'opposite_of_text', 'partly_true', 'unsupported_inference', 'evidence_for_different_claim',
  'confuses_cause_and_sequence', 'confuses_author_and_other_viewpoint', 'weak_source_for_claim',
  'location_homophone', 'contraction_homophone', 'possessive_pronoun_form'
];

let skills = [];
let projectHandle = null;
let activeQuestionIndex = 0;

const state = {
  passage: {
    schemaVersion: 1,
    id: '',
    title: '',
    text: '',
    textType: 'informational',
    context: 'community',
    source: { type: 'original', attribution: 'Original content by Chee Skool' },
    rights: { status: 'original', holder: 'Chee Skool', note: '' },
    evidenceAnchors: {},
    status: 'draft',
    version: 1,
    author: 'Chee Skool',
    reviewer: null,
  },
  set: {
    schemaVersion: 2,
    id: '',
    runtime: { id: '', file: '' },
    title: '',
    description: '',
    subject: 'rla',
    category: 'reading',
    topic: '',
    curriculum: {
      domain: '',
      primarySkillId: '',
      secondarySkillIds: [],
      contentKind: 'passage_practice',
      learningObjective: '',
      topicLabel: '',
    },
    difficulty: 'easy',
    status: 'draft',
    version: 1,
    passageRefs: [],
    questions: [],
    author: 'Chee Skool',
    reviewer: null,
  }
};

await init();

async function init() {
  try {
    const registry = await fetch('content-src/skills/rla.skills.json').then(r => {
      if (!r.ok) throw new Error(`Could not load skills (${r.status})`);
      return r.json();
    });
    skills = registry.skills || [];
  } catch (err) {
    console.warn(err);
    skills = [];
  }

  bindTabs();
  bindPassageFields();
  bindCurriculumFields();
  bindSetFields();
  bindTopActions();
  bindSaveActions();
  bindQualityActions();
  document.getElementById('add-studio-question').addEventListener('click', () => addQuestion());
  document.getElementById('preview-question-select').addEventListener('change', (e) => {
    activeQuestionIndex = Number(e.target.value) || 0;
    renderPreview();
  });

  renderCurriculumControls();
  renderQuestionList();
  renderQuestionEditor();
  renderPreviewSelect();
  renderPreview();
  syncInspector();
  updateWordCount();
}

function bindTabs() {
  document.querySelectorAll('[data-studio-tab]').forEach(btn => {
    btn.addEventListener('click', () => showPanel(btn.dataset.studioTab));
  });
}

function showPanel(name) {
  document.querySelectorAll('[data-studio-tab]').forEach(x => x.classList.toggle('active', x.dataset.studioTab === name));
  document.querySelectorAll('[data-studio-panel]').forEach(x => x.classList.toggle('active', x.dataset.studioPanel === name));
  if (name === 'preview') renderPreview();
  if (name === 'quality') runQualityCheck();
}

function bindPassageFields() {
  const map = {
    'passage-id': ['id'],
    'passage-title': ['title'],
    'passage-text': ['text'],
    'passage-text-type': ['textType'],
    'passage-context': ['context'],
    'passage-source-type': ['source','type'],
    'passage-attribution': ['source','attribution'],
    'passage-source-url': ['source','url'],
    'passage-rights': ['rights','status'],
    'passage-rights-holder': ['rights','holder'],
    'passage-rights-note': ['rights','note'],
    'passage-status': ['status'],
    'passage-author': ['author'],
    'passage-reviewer': ['reviewer'],
  };
  for (const [id, path] of Object.entries(map)) {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      setDeep(state.passage, path, cleanNullable(el.value));
      if (id === 'passage-id') document.getElementById('set-passage-ref').value = el.value;
      if (id === 'passage-text') updateWordCount();
      syncStates();
      renderPreview();
    });
    el.addEventListener('change', () => {
      setDeep(state.passage, path, cleanNullable(el.value));
      syncStates();
      renderPreview();
    });
  }
}

function curriculumDomains() {
  return [...new Set(skills.map(s => s.domain).filter(Boolean))];
}

function skillsForDomain(domain) {
  return skills.filter(s => s.domain === domain);
}

function skillLabel(skillId) {
  const skill = skills.find(s => s.id === skillId);
  return skill ? `${skill.id} · ${skill.label}` : skillId || '';
}

function defaultCategoryForSkill(skill) {
  const mode = String(skill?.practiceMode || '').toLowerCase();
  if (mode.includes('language')) return 'language_conventions';
  if (mode.includes('writing') || mode.includes('argument')) return 'writing';
  return 'reading';
}

function bindCurriculumFields() {
  document.getElementById('curriculum-domain').addEventListener('change', (e) => {
    state.set.curriculum.domain = e.target.value;
    const available = skillsForDomain(state.set.curriculum.domain);
    if (!available.some(s => s.id === state.set.curriculum.primarySkillId)) {
      state.set.curriculum.primarySkillId = available[0]?.id || '';
    }
    renderCurriculumControls();
    applyCurriculumDefaults();
    syncStates();
  });

  document.getElementById('curriculum-primary-skill').addEventListener('change', (e) => {
    state.set.curriculum.primarySkillId = e.target.value;
    const skill = skills.find(s => s.id === e.target.value);
    if (skill) state.set.curriculum.domain = skill.domain;
    applyCurriculumDefaults();
    renderCurriculumControls();
    syncStates();
  });

  document.getElementById('curriculum-content-kind').addEventListener('change', (e) => {
    state.set.curriculum.contentKind = e.target.value;
    syncStates();
  });

  document.getElementById('curriculum-topic-label').addEventListener('input', (e) => {
    state.set.curriculum.topicLabel = e.target.value;
    state.set.topic = e.target.value;
    syncStates();
  });

  document.getElementById('curriculum-objective').addEventListener('input', (e) => {
    state.set.curriculum.learningObjective = e.target.value;
    syncStates();
  });

  document.getElementById('curriculum-add-secondary').addEventListener('click', () => {
    const picker = document.getElementById('curriculum-secondary-picker');
    const id = picker.value;
    if (!id || id === state.set.curriculum.primarySkillId) return;
    const list = state.set.curriculum.secondarySkillIds || (state.set.curriculum.secondarySkillIds = []);
    if (!list.includes(id)) list.push(id);
    renderCurriculumControls();
    syncStates();
  });
}

function applyCurriculumDefaults() {
  const skill = skills.find(s => s.id === state.set.curriculum.primarySkillId);
  if (!skill) return;
  if (!state.set.curriculum.topicLabel) state.set.curriculum.topicLabel = skill.label.replace(/\s*\/.*$/, '');
  state.set.topic = state.set.curriculum.topicLabel || skill.label.replace(/\s*\/.*$/, '');
  state.set.category = defaultCategoryForSkill(skill);
  const category = document.getElementById('set-category');
  if (category) category.value = state.set.category;
}

function renderCurriculumControls() {
  const c = state.set.curriculum || (state.set.curriculum = { domain:'', primarySkillId:'', secondarySkillIds:[], contentKind:'passage_practice', learningObjective:'', topicLabel:'' });
  const domains = curriculumDomains();
  if (!c.domain && c.primarySkillId) c.domain = skills.find(s => s.id === c.primarySkillId)?.domain || '';

  const domainSelect = document.getElementById('curriculum-domain');
  const primarySelect = document.getElementById('curriculum-primary-skill');
  const secondaryPicker = document.getElementById('curriculum-secondary-picker');
  if (!domainSelect || !primarySelect || !secondaryPicker) return;

  domainSelect.innerHTML = `<option value="">Choose a domain</option>` + domains.map(d => `<option value="${escapeAttr(d)}"${d === c.domain ? ' selected' : ''}>${escapeHtml(d)}</option>`).join('');

  const available = c.domain ? skillsForDomain(c.domain) : skills;
  primarySelect.innerHTML = `<option value="">Choose a primary skill</option>` + available.map(s => `<option value="${escapeAttr(s.id)}"${s.id === c.primarySkillId ? ' selected' : ''}>${escapeHtml(`${s.id} · ${s.label}`)}</option>`).join('');

  const secondaryAvailable = skills.filter(s => s.id !== c.primarySkillId && !(c.secondarySkillIds || []).includes(s.id));
  secondaryPicker.innerHTML = `<option value="">Choose a secondary skill</option>` + secondaryAvailable.map(s => `<option value="${escapeAttr(s.id)}">${escapeHtml(`${s.domain} — ${s.id} · ${s.label}`)}</option>`).join('');

  document.getElementById('curriculum-content-kind').value = c.contentKind || 'passage_practice';
  document.getElementById('curriculum-topic-label').value = c.topicLabel || '';
  document.getElementById('curriculum-objective').value = c.learningObjective || '';

  const primary = skills.find(s => s.id === c.primarySkillId);
  document.getElementById('curriculum-path').textContent = `RLA → ${c.domain || 'Choose a domain'} → ${primary?.label || 'Choose a skill'}`;
  document.getElementById('curriculum-state').textContent = primary ? 'Attached' : 'Unassigned';

  const chipMount = document.getElementById('curriculum-secondary-chips');
  chipMount.innerHTML = (c.secondarySkillIds || []).length
    ? c.secondarySkillIds.map(id => `<button type="button" class="studio-skill-chip" data-remove-secondary="${escapeAttr(id)}"><span>${escapeHtml(skillLabel(id))}</span><b aria-hidden="true">×</b></button>`).join('')
    : '<span class="studio-empty-chips">No secondary skills attached.</span>';
  chipMount.querySelectorAll('[data-remove-secondary]').forEach(btn => btn.addEventListener('click', () => {
    c.secondarySkillIds = (c.secondarySkillIds || []).filter(id => id !== btn.dataset.removeSecondary);
    renderCurriculumControls();
    syncStates();
  }));
}

function bindSetFields() {
  const map = {
    'set-id': ['id'],
    'set-runtime-id': ['runtime','id'],
    'set-runtime-file': ['runtime','file'],
    'set-title': ['title'],
    'set-description': ['description'],
    'set-category': ['category'],
    'set-difficulty': ['difficulty'],
    'set-status': ['status'],
    'set-author': ['author'],
    'set-reviewer': ['reviewer'],
  };
  for (const [id, path] of Object.entries(map)) {
    const el = document.getElementById(id);
    el.addEventListener('input', () => {
      setDeep(state.set, path, cleanNullable(el.value));
      if (id === 'set-runtime-id' && !document.getElementById('set-runtime-file').value) {
        state.set.runtime.file = `${slugify(el.value)}.json`;
        document.getElementById('set-runtime-file').value = state.set.runtime.file;
      }
      syncStates();
    });
    el.addEventListener('change', () => {
      setDeep(state.set, path, cleanNullable(el.value));
      syncStates();
    });
  }

  document.getElementById('set-passage-ref').addEventListener('input', (e) => {
    state.set.passageRefs = e.target.value.trim() ? [e.target.value.trim()] : [];
  });
}

function bindTopActions() {
  document.getElementById('connect-folder-btn').addEventListener('click', connectProjectFolder);
  document.getElementById('import-source-btn').addEventListener('click', () => document.getElementById('import-source-input').click());
  document.getElementById('import-source-input').addEventListener('change', importSourceJson);
}

function bindSaveActions() {
  document.getElementById('save-source-btn').addEventListener('click', saveSourceFiles);
  document.getElementById('download-source-btn').addEventListener('click', () => downloadSourceFiles());
  document.getElementById('copy-build-command').addEventListener('click', async () => {
    const command = 'npm run content:check';
    await navigator.clipboard?.writeText(command);
    setSaveMessage('Copied: npm run content:check');
  });
}

function bindQualityActions() {
  document.getElementById('run-studio-check').addEventListener('click', runQualityCheck);
}

function updateWordCount() {
  const count = words(state.passage.text).length;
  document.getElementById('passage-word-count').textContent = `${count} word${count === 1 ? '' : 's'}`;
}

function syncStates() {
  document.getElementById('passage-state').textContent = state.passage.status || 'draft';
  document.getElementById('set-state').textContent = state.set.status || 'draft';
  const cp = document.getElementById('curriculum-state');
  if (cp) cp.textContent = state.set.curriculum?.primarySkillId ? 'Attached' : 'Unassigned';
  syncInspector();
}

function syncInspector() {
  const curriculumSkill = skills.find(s => s.id === state.set.curriculum?.primarySkillId);
  const curriculumEl = document.getElementById('inspector-curriculum');
  const objectiveEl = document.getElementById('inspector-objective');
  if (curriculumEl) curriculumEl.textContent = curriculumSkill ? `${curriculumSkill.domain} → ${curriculumSkill.label}` : 'Not assigned';
  if (objectiveEl) objectiveEl.textContent = state.set.curriculum?.learningObjective || 'Choose a domain and primary skill.';
  const q = state.set.questions[activeQuestionIndex];
  const skill = q ? skills.find(s => s.id === q.primarySkillId) : null;
  document.getElementById('inspector-skill').textContent = skill ? `${skill.id} · ${skill.label}` : (q?.primarySkillId || 'No question yet');
  document.getElementById('inspector-family').textContent = q?.familyId || 'Add a question to start authoring.';
}

function addQuestion(seed = {}) {
  const q = normalizeQuestion({
    id: `q${state.set.questions.length + 1}`,
    type: 'multiple_choice',
    prompt: '',
    primarySkillId: state.set.curriculum?.primarySkillId || skills[0]?.id || '',
    familyId: '',
    difficulty: state.set.difficulty || 'easy',
    dok: 2,
    difficultyProfile: {
      textComplexity: 1,
      reasoningDepth: 2,
      evidenceDistance: 1,
      distractorSimilarity: 2,
      sourceCount: Math.max(1, state.set.passageRefs.length || 1),
      responseDemand: 1,
    },
    points: 1,
    estimatedSeconds: 45,
    options: defaultOptions(),
    correct: ['a'],
    explanation: { answer: 'A', whyCorrect: '', quickTip: '' },
    ...seed,
  });
  state.set.questions.push(q);
  activeQuestionIndex = state.set.questions.length - 1;
  renderQuestionList();
  renderQuestionEditor();
  renderPreviewSelect();
  syncInspector();
}

function removeQuestion(index) {
  state.set.questions.splice(index, 1);
  state.set.questions.forEach((q, i) => q.id = `q${i + 1}`);
  activeQuestionIndex = Math.max(0, Math.min(activeQuestionIndex, state.set.questions.length - 1));
  renderQuestionList();
  renderQuestionEditor();
  renderPreviewSelect();
  syncInspector();
}

function renderQuestionList() {
  const mount = document.getElementById('studio-question-list');
  if (!state.set.questions.length) {
    mount.innerHTML = '<div class="studio-question-empty">No questions yet.</div>';
    return;
  }
  mount.innerHTML = '';
  state.set.questions.forEach((q, i) => {
    const skill = skills.find(s => s.id === q.primarySkillId);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `studio-question-item${i === activeQuestionIndex ? ' active' : ''}`;
    btn.innerHTML = `<strong>${escapeHtml(q.id)} · ${escapeHtml(skill?.label || q.primarySkillId || 'No skill')}</strong><span>${escapeHtml(q.prompt || 'Untitled question')}</span>`;
    btn.addEventListener('click', () => {
      activeQuestionIndex = i;
      renderQuestionList();
      renderQuestionEditor();
      syncInspector();
    });
    mount.appendChild(btn);
  });
}

function renderQuestionEditor() {
  const mount = document.getElementById('studio-question-editor');
  const q = state.set.questions[activeQuestionIndex];
  if (!q) {
    mount.innerHTML = '<div class="studio-question-empty">Add a question to begin.</div>';
    return;
  }

  const auto = isAutoGraded(q);
  mount.innerHTML = `
    <div class="studio-question-grid">
      ${fieldSelect('q-type','Type',VALID_TYPES,q.type)}
      ${fieldSelect('q-skill','Primary skill',skills.map(s => ({value:s.id,label:`${s.domain} — ${s.id} · ${s.label}`})),q.primarySkillId)}
      ${fieldInput('q-family','Family ID',q.familyId,'reading.main_idea.community_action')}
      ${fieldSelect('q-difficulty','Difficulty',VALID_DIFFICULTIES,q.difficulty)}
      ${fieldSelect('q-dok','DOK',[1,2,3],q.dok)}
      ${fieldInput('q-seconds','Estimated seconds',q.estimatedSeconds,'45','number')}
      <label class="studio-qfield full"><span>Question prompt</span><textarea id="q-prompt">${escapeHtml(q.prompt)}</textarea></label>
    </div>

    <div class="studio-section-title"><h2>Difficulty profile</h2><p>1 = low · 3 = high</p></div>
    <div class="studio-question-grid">
      ${profileSelect('textComplexity','Text complexity',q)}
      ${profileSelect('reasoningDepth','Reasoning depth',q)}
      ${profileSelect('evidenceDistance','Evidence distance',q)}
      ${profileSelect('distractorSimilarity','Distractor similarity',q)}
      ${profileSelect('sourceCount','Source count',q)}
      ${profileSelect('responseDemand','Response demand',q)}
    </div>

    ${auto ? `<div class="studio-question-options" id="studio-options-editor"></div>` : ''}

    <div class="studio-section-title"><h2>Explanation</h2><p>Plain language. Short first.</p></div>
    <div class="studio-question-grid">
      ${fieldInput('q-answer','Answer label',q.explanation?.answer || '', 'B')}
      ${fieldInput('q-evidence-ref','Evidence anchor',q.explanation?.evidenceRef || '', 'optional')}
      <label class="studio-qfield full"><span>Why the correct answer works</span><textarea id="q-why-correct">${escapeHtml(q.explanation?.whyCorrect || '')}</textarea></label>
      <label class="studio-qfield full"><span>Quick tip <em>optional</em></span><textarea id="q-quick-tip">${escapeHtml(q.explanation?.quickTip || '')}</textarea></label>
    </div>
    <div class="studio-question-actions"><button type="button" class="btn ghost small" id="remove-current-question">Remove question</button></div>
  `;

  if (auto) renderOptionEditors(q);
  bindQuestionEditor(q);
}

function bindQuestionEditor(q) {
  bindValue('q-type', v => {
    q.type = v;
    if (isAutoGraded(q) && (!q.options || !q.options.length)) {
      q.options = defaultOptions(); q.correct = ['a'];
    }
    renderQuestionEditor();
  }, 'change');
  bindValue('q-skill', v => { q.primarySkillId = v; renderQuestionList(); syncInspector(); }, 'change');
  bindValue('q-family', v => { q.familyId = v.trim(); syncInspector(); });
  bindValue('q-difficulty', v => q.difficulty = v, 'change');
  bindValue('q-dok', v => q.dok = Number(v), 'change');
  bindValue('q-seconds', v => q.estimatedSeconds = Math.max(0, Number(v) || 0));
  bindValue('q-prompt', v => { q.prompt = v; renderQuestionList(); renderPreview(); });
  bindValue('q-answer', v => q.explanation.answer = v.trim());
  bindValue('q-evidence-ref', v => {
    if (v.trim()) q.explanation.evidenceRef = v.trim(); else delete q.explanation.evidenceRef;
  });
  bindValue('q-why-correct', v => { q.explanation.whyCorrect = v; renderPreview(); });
  bindValue('q-quick-tip', v => q.explanation.quickTip = v);
  document.querySelectorAll('[data-profile]').forEach(el => {
    el.addEventListener('change', () => q.difficultyProfile[el.dataset.profile] = Number(el.value));
  });
  document.getElementById('remove-current-question')?.addEventListener('click', () => removeQuestion(activeQuestionIndex));
}

function renderOptionEditors(q) {
  const mount = document.getElementById('studio-options-editor');
  mount.innerHTML = '';
  const correctIds = new Set(Array.isArray(q.correct) ? q.correct : [q.correct].filter(Boolean));
  (q.options || []).forEach((opt, idx) => {
    const isCorrect = correctIds.has(opt.id);
    const row = document.createElement('div');
    row.className = 'studio-option-editor';
    row.innerHTML = `
      <div class="studio-option-radio"><input type="radio" name="studio-correct" ${isCorrect ? 'checked' : ''} aria-label="Option ${escapeHtml(opt.id.toUpperCase())} is correct"></div>
      <div class="studio-option-fields">
        <label class="studio-qfield"><span>${escapeHtml(opt.id.toUpperCase())}. Answer option</span><input class="opt-text" value="${escapeAttr(opt.text || '')}"></label>
        <div class="studio-option-meta" ${isCorrect ? 'hidden' : ''}>
          <label class="studio-qfield"><span>Distractor type</span><select class="opt-type">${selectOptions(DISTRACTOR_TYPES,opt.distractorType || '')}</select></label>
          <label class="studio-qfield"><span>Why this answer is wrong</span><input class="opt-why" value="${escapeAttr(opt.whyWrong || '')}" placeholder="Explain the exact error in one sentence."></label>
        </div>
      </div>`;

    row.querySelector('input[type="radio"]').addEventListener('change', () => {
      q.correct = [opt.id];
      q.explanation.answer = opt.id.toUpperCase();
      renderOptionEditors(q);
      const answerField = document.getElementById('q-answer');
      if (answerField) answerField.value = q.explanation.answer;
      renderPreview();
    });
    row.querySelector('.opt-text').addEventListener('input', e => { opt.text = e.target.value; renderPreview(); });
    row.querySelector('.opt-type')?.addEventListener('change', e => opt.distractorType = e.target.value || null);
    row.querySelector('.opt-why')?.addEventListener('input', e => opt.whyWrong = e.target.value || null);
    mount.appendChild(row);
  });
}

function renderPreviewSelect() {
  const select = document.getElementById('preview-question-select');
  select.innerHTML = '';
  state.set.questions.forEach((q, i) => {
    const opt = document.createElement('option');
    opt.value = String(i);
    opt.textContent = `${q.id} · ${truncate(q.prompt || 'Untitled', 48)}`;
    select.appendChild(opt);
  });
  select.value = String(Math.min(activeQuestionIndex, Math.max(0, state.set.questions.length - 1)));
}

function renderPreview() {
  const mount = document.getElementById('studio-preview-mount');
  const q = state.set.questions[activeQuestionIndex];
  if (!q) {
    mount.innerHTML = '<div class="studio-empty-preview">Add a question to preview the learner view.</div>';
    return;
  }
  const skill = skills.find(s => s.id === q.primarySkillId);
  const optionsHtml = isAutoGraded(q) ? (q.options || []).map(o => `<div class="studio-preview-option"><span>○ ${escapeHtml(o.id.toUpperCase())}.</span><span>${escapeHtml(o.text)}</span></div>`).join('') : '<div class="studio-preview-option"><span>Response</span><span>Learner writes an answer here.</span></div>';
  mount.innerHTML = `
    <div class="studio-preview">
      <article class="studio-preview-passage">
        <span class="eyebrow">Passage</span>
        <h3>${escapeHtml(state.passage.title || 'Untitled passage')}</h3>
        <p>${escapeHtml(state.passage.text || 'Add passage text to see it here.').replace(/\n/g,'<br>')}</p>
      </article>
      <article class="studio-preview-question">
        <div class="studio-preview-meta"><span>${escapeHtml(skill?.label || q.primarySkillId || 'Skill')}</span><span>${escapeHtml(q.difficulty)} · DOK ${q.dok}</span></div>
        <h3>${escapeHtml(q.prompt || 'Add a question prompt.')}</h3>
        <div class="studio-preview-options">${optionsHtml}</div>
      </article>
    </div>`;
}

function runQualityCheck() {
  const issues = validateDraft();
  const errors = issues.filter(i => i.type === 'error');
  const warnings = issues.filter(i => i.type === 'warning');
  const summary = document.getElementById('studio-quality-summary');
  summary.innerHTML = `
    <span class="studio-quality-pill ${errors.length ? 'error' : 'ok'}">${errors.length} error${errors.length === 1 ? '' : 's'}</span>
    <span class="studio-quality-pill ${warnings.length ? 'warning' : 'ok'}">${warnings.length} warning${warnings.length === 1 ? '' : 's'}</span>
    ${!issues.length ? '<span class="studio-quality-pill ok">Ready for command-line validation</span>' : ''}`;
  const list = document.getElementById('studio-quality-list');
  list.innerHTML = issues.length ? issues.map(i => `<div class="studio-quality-item ${i.type}"><strong>${escapeHtml(i.title)}</strong><p>${escapeHtml(i.message)}</p></div>`).join('') : '<div class="studio-quality-item"><strong>No browser-side issues found.</strong><p>Run <code>npm run content:check</code> after saving. The project validator remains the final gate.</p></div>';

  document.getElementById('inspector-health').textContent = errors.length ? 'Needs fixes' : warnings.length ? 'Review suggested' : 'Looks ready';
  document.getElementById('inspector-health-detail').textContent = errors.length ? `${errors.length} blocking issue${errors.length === 1 ? '' : 's'}.` : warnings.length ? `${warnings.length} quality warning${warnings.length === 1 ? '' : 's'}.` : 'Save, then run the full validator.';
  return { issues, errors, warnings };
}

function validateDraft() {
  const out = [];
  const err = (title, message) => out.push({ type:'error', title, message });
  const warn = (title, message) => out.push({ type:'warning', title, message });

  if (!/^p-[a-z0-9-]+$/.test(state.passage.id || '')) err('Passage ID', 'Use a stable ID such as p-rla-community-garden.');
  if (!state.passage.title?.trim()) err('Passage title', 'Add a passage title.');
  if (words(state.passage.text).length < 20) err('Passage text', 'The passage needs more complete text before it can be used.');
  if (!state.passage.source?.type || !state.passage.source?.attribution) err('Source', 'Add source type and attribution.');
  if (state.passage.status === 'published' && !state.passage.reviewer) err('Passage reviewer', 'Published passages need a reviewer.');

  if (!/^set-[a-z0-9-]+$/.test(state.set.id || '')) err('Set ID', 'Use a stable ID such as set-rla-reading-community-garden.');
  if (!state.set.runtime?.id) err('Runtime ID', 'Add a runtime ID for the compiled module.');
  if (!/^[a-z0-9-]+\.json$/.test(state.set.runtime?.file || '')) err('Runtime file', 'Use a filename such as community-garden-practice.json.');
  if (!state.set.title?.trim()) err('Set title', 'Add a learner-facing title.');
  if (!state.set.curriculum?.domain) err('Curriculum placement', 'Choose the RLA domain this set belongs to.');
  if (!state.set.curriculum?.primarySkillId || !skills.some(s => s.id === state.set.curriculum.primarySkillId)) err('Curriculum placement', 'Choose a valid primary curriculum skill.');
  if (!state.set.curriculum?.learningObjective?.trim()) warn('Learning objective', 'Add one plain-language sentence describing what the learner should be able to do.');
  if (!VALID_CONTENT_KINDS.includes(state.set.curriculum?.contentKind)) err('Content format', 'Choose a valid content format.');
  for (const sid of state.set.curriculum?.secondarySkillIds || []) if (!skills.some(s => s.id === sid)) err('Secondary skill', `Unknown secondary skill: ${sid}.`);
  if (!state.set.topic?.trim()) err('Topic', 'Add a topic.');
  if (!state.set.questions.length) err('Questions', 'Add at least one question.');
  if (state.set.status === 'published' && !state.set.reviewer) err('Set reviewer', 'Published sets need a reviewer.');

  state.set.questions.forEach((q, i) => {
    const label = `Question ${i + 1}`;
    if (!/^q\d+$/.test(q.id || '')) err(label, 'Question IDs should look like q1, q2, q3...');
    if (!skills.some(s => s.id === q.primarySkillId)) err(label, `Unknown skill ID: ${q.primarySkillId || '(missing)'}.`);
    if (!q.familyId?.trim()) err(label, 'Add a family ID so transfer can be tracked.');
    if (!q.prompt?.trim()) err(label, 'Add the question prompt.');
    if (words(q.prompt).length > 35) warn(label, 'The question stem is over 35 words. Check whether it can be shorter.');
    if (!q.explanation?.whyCorrect?.trim()) err(label, 'Explain why the correct answer works in plain language.');
    if (words(q.explanation?.whyCorrect).length > 80) warn(label, 'The explanation is over 80 words. Learners may scan past it.');
    if (isAutoGraded(q)) {
      const correct = new Set(Array.isArray(q.correct) ? q.correct : [q.correct].filter(Boolean));
      if (!(q.options || []).length) err(label, 'Add answer options.');
      if (!correct.size) err(label, 'Choose a correct answer.');
      (q.options || []).forEach(o => {
        if (!o.text?.trim()) err(label, `Option ${o.id.toUpperCase()} is empty.`);
        if (!correct.has(o.id)) {
          if (!o.distractorType) err(label, `Option ${o.id.toUpperCase()} needs a distractor type.`);
          if (!o.whyWrong?.trim()) err(label, `Option ${o.id.toUpperCase()} needs a short why-wrong note.`);
        }
      });
    }
    if (q.difficulty === 'hard' && Number(q.difficultyProfile?.reasoningDepth || 1) < 2) warn(label, 'Hard difficulty has low reasoningDepth. Make sure difficulty is not coming from confusing wording.');
  });

  return out;
}

async function connectProjectFolder() {
  if (!('showDirectoryPicker' in window)) {
    setSaveMessage('Direct folder saving is not supported here. Use Download source JSON instead.');
    return;
  }
  try {
    const picked = await window.showDirectoryPicker({ mode: 'readwrite' });
    try {
      await picked.getFileHandle('package.json');
      await picked.getDirectoryHandle('content-src');
    } catch {
      setSaveMessage('Choose the Chee Skool project folder — the one containing package.json and content-src/.');
      return;
    }
    projectHandle = picked;
    document.getElementById('folder-status').textContent = projectHandle.name;
    document.getElementById('connect-folder-btn').textContent = 'Folder connected';
    setSaveMessage('Project folder connected.');
  } catch (err) {
    if (err.name !== 'AbortError') setSaveMessage(`Could not connect folder: ${err.message}`);
  }
}

async function saveSourceFiles() {
  syncFromVisibleForms();
  const check = runQualityCheck();
  if (check.errors.length) {
    showPanel('quality');
    setSaveMessage('Fix blocking issues before saving.');
    return;
  }
  if (!projectHandle) {
    downloadSourceFiles();
    setSaveMessage('No project folder connected, so Studio downloaded the source files instead.');
    return;
  }
  try {
    const contentSrc = await projectHandle.getDirectoryHandle('content-src', { create: true });
    const passagesDir = await contentSrc.getDirectoryHandle('passages', { create: true });
    const setsDir = await contentSrc.getDirectoryHandle('sets', { create: true });
    await writeJsonFile(passagesDir, `${state.passage.id}.json`, cleanPassage(state.passage));
    await writeJsonFile(setsDir, `${state.set.id}.json`, cleanSet(state.set));
    setSaveMessage('Saved to content-src/. Run npm run content:check next.');
  } catch (err) {
    setSaveMessage(`Save failed: ${err.message}`);
  }
}

function downloadSourceFiles() {
  syncFromVisibleForms();
  downloadJson(`${state.passage.id || 'passage'}.json`, cleanPassage(state.passage));
  setTimeout(() => downloadJson(`${state.set.id || 'question-set'}.json`, cleanSet(state.set)), 180);
}

async function importSourceJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const doc = JSON.parse(await file.text());
    if (doc.schemaVersion === 1 && doc.id?.startsWith('p-')) {
      state.passage = cleanPassage({ ...state.passage, ...doc });
      populatePassageForm();
      setSaveMessage(`Loaded passage ${doc.id}.`);
      showPanel('passage');
    } else if (doc.schemaVersion === 2 && doc.id?.startsWith('set-')) {
      state.set = cleanSet({ ...state.set, ...doc, curriculum: { ...state.set.curriculum, ...(doc.curriculum || {}) }, questions: (doc.questions || []).map(normalizeQuestion) });
      activeQuestionIndex = 0;
      populateSetForm();
      renderQuestionList(); renderQuestionEditor(); renderPreviewSelect(); renderPreview(); syncInspector();
      setSaveMessage(`Loaded question set ${doc.id}.`);
      showPanel('questions');
    } else {
      throw new Error('This is not a Phase 4 passage or question-set source file.');
    }
  } catch (err) {
    setSaveMessage(`Import failed: ${err.message}`);
  } finally {
    event.target.value = '';
  }
}

function populatePassageForm() {
  const p = state.passage;
  setEl('passage-id', p.id); setEl('passage-title', p.title); setEl('passage-text', p.text);
  setEl('passage-text-type', p.textType); setEl('passage-context', p.context);
  setEl('passage-source-type', p.source?.type); setEl('passage-attribution', p.source?.attribution);
  setEl('passage-source-url', p.source?.url); setEl('passage-rights', p.rights?.status);
  setEl('passage-rights-holder', p.rights?.holder); setEl('passage-rights-note', p.rights?.note);
  setEl('passage-status', p.status); setEl('passage-author', p.author); setEl('passage-reviewer', p.reviewer);
  updateWordCount(); syncStates(); renderPreview();
}

function populateSetForm() {
  const s = state.set;
  setEl('set-id', s.id); setEl('set-runtime-id', s.runtime?.id); setEl('set-runtime-file', s.runtime?.file);
  setEl('set-title', s.title); setEl('set-description', s.description); setEl('set-category', s.category);
  setEl('set-difficulty', s.difficulty); setEl('set-status', s.status);
  setEl('set-passage-ref', s.passageRefs?.[0] || ''); setEl('set-author', s.author); setEl('set-reviewer', s.reviewer);
  renderCurriculumControls();
  syncStates();
}

function syncFromVisibleForms() {
  // Normal input events already keep state current. This only normalizes references.
  const ref = document.getElementById('set-passage-ref').value.trim();
  state.set.passageRefs = ref ? [ref] : [];
  state.set.runtime.file = state.set.runtime.file || `${slugify(state.set.runtime.id || state.set.id.replace(/^set-/, ''))}.json`;
}

function cleanPassage(raw) {
  const p = JSON.parse(JSON.stringify(raw));
  if (!p.source?.url) delete p.source.url;
  if (!p.rights?.holder) delete p.rights.holder;
  if (!p.rights?.note) delete p.rights.note;
  if (!p.reviewer) p.reviewer = null;
  if (!p.evidenceAnchors || !Object.keys(p.evidenceAnchors).length) p.evidenceAnchors = {};
  return p;
}

function cleanSet(raw) {
  const s = JSON.parse(JSON.stringify(raw));
  s.curriculum = s.curriculum || { domain:'', primarySkillId:'', secondarySkillIds:[], contentKind:'passage_practice', learningObjective:'', topicLabel:'' };
  if (!s.curriculum.secondarySkillIds?.length) delete s.curriculum.secondarySkillIds;
  if (!s.curriculum.learningObjective) delete s.curriculum.learningObjective;
  if (!s.curriculum.topicLabel) delete s.curriculum.topicLabel;
  if (!s.description) delete s.description;
  if (!s.reviewer) s.reviewer = null;
  s.questions = (s.questions || []).map(q => {
    const out = normalizeQuestion(q);
    if (!out.secondarySkillIds?.length) delete out.secondarySkillIds;
    if (!out.explanation.quickTip) delete out.explanation.quickTip;
    if (!out.explanation.evidenceRef) delete out.explanation.evidenceRef;
    if (!isAutoGraded(out)) { delete out.options; if (out.correct == null || out.correct === '') delete out.correct; }
    return out;
  });
  return s;
}

function normalizeQuestion(q) {
  const out = JSON.parse(JSON.stringify(q));
  out.explanation = out.explanation || { answer:'', whyCorrect:'', quickTip:'' };
  out.difficultyProfile = out.difficultyProfile || { textComplexity:1, reasoningDepth:2, evidenceDistance:1, distractorSimilarity:2, sourceCount:1, responseDemand:1 };
  if (isAutoGraded(out)) {
    out.options = (out.options?.length ? out.options : defaultOptions()).map((o, i) => ({ id:o.id || ['a','b','c','d'][i], text:o.text || '', ...(o.distractorType ? {distractorType:o.distractorType}:{}), ...(o.whyWrong ? {whyWrong:o.whyWrong}:{}) }));
    if (!Array.isArray(out.correct)) out.correct = [out.correct].filter(Boolean);
    if (!out.correct.length) out.correct = ['a'];
  }
  return out;
}

function defaultOptions() {
  return ['a','b','c','d'].map(id => ({ id, text:'', ...(id === 'a' ? {} : { distractorType:'mentioned_not_supported', whyWrong:'' }) }));
}

function isAutoGraded(q) { return ['multiple_choice','evidence_based','grammar_edit'].includes(q.type); }

async function writeJsonFile(dirHandle, filename, data) {
  const handle = await dirHandle.getFileHandle(filename, { create:true });
  const writable = await handle.createWritable();
  await writable.write(JSON.stringify(data, null, 2) + '\n');
  await writable.close();
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2) + '\n'], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bindValue(id, cb, eventName = 'input') {
  const el = document.getElementById(id);
  if (el) el.addEventListener(eventName, e => cb(e.target.value));
}

function fieldInput(id, label, value, placeholder='', type='text') {
  return `<label class="studio-qfield"><span>${escapeHtml(label)}</span><input id="${id}" type="${type}" value="${escapeAttr(value ?? '')}" placeholder="${escapeAttr(placeholder)}"></label>`;
}
function fieldSelect(id, label, options, selected) {
  return `<label class="studio-qfield"><span>${escapeHtml(label)}</span><select id="${id}">${selectOptions(options, selected)}</select></label>`;
}
function profileSelect(key, label, q) {
  return `<label class="studio-qfield"><span>${escapeHtml(label)}</span><select data-profile="${key}">${selectOptions([1,2,3], q.difficultyProfile?.[key] || 1)}</select></label>`;
}
function selectOptions(options, selected) {
  return options.map(o => {
    const value = typeof o === 'object' ? o.value : o;
    const label = typeof o === 'object' ? o.label : o;
    return `<option value="${escapeAttr(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${escapeHtml(String(label).replaceAll('_',' '))}</option>`;
  }).join('');
}

function setDeep(obj, path, value) {
  let cur = obj;
  path.slice(0,-1).forEach(key => cur = cur[key] ||= {});
  const last = path[path.length-1];
  if (value === null || value === '') delete cur[last]; else cur[last] = value;
}
function cleanNullable(v) { return String(v ?? '').trim() || null; }
function words(text) { return String(text || '').trim().split(/\s+/).filter(Boolean); }
function slugify(v) { return String(v || '').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
function truncate(v,n) { v=String(v||''); return v.length>n ? `${v.slice(0,n-1)}…` : v; }
function setEl(id, value) { const el=document.getElementById(id); if(el) el.value = value ?? ''; }
function setSaveMessage(msg) { document.getElementById('studio-save-message').textContent = msg; }
function escapeHtml(v) { return String(v ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }
function escapeAttr(v) { return escapeHtml(v).replace(/'/g,'&#39;'); }
